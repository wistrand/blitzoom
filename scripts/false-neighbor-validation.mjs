// false-neighbor-validation.mjs — Empirical validation of the analytic
// false-neighbor theory for BlitZoom's MinHash → Gaussian 2D projection.
// Results and interpretation: agent_docs/RESEARCH-false-neighbor-validation.md
//
// Theory under test (per property group g, k = 128):
//   z-scored signatures u, v have ||u||² = k exactly; r = <u,v>/k.
//   Over Gaussian projection randomness, the pair difference is 2D Gaussian with
//   per-coordinate variance s²_g = 2k(1 − r)  (one-empty case: k; both-empty: 0).
//   Blended (α = 0): s² = Σ_g (w_g/W)² s²_g, and t = d²/s² ~ χ²₂ (CDF 1 − e^{−t/2}).
//   Collision kernel: P(d ≤ ε) = 1 − exp(−ε²/(2s²)).
//   Bridge: E[r] ≈ J (Jaccard), slight positive bias expected.
//
// Run:  node scripts/false-neighbor-validation.mjs
//   or  deno run --allow-read scripts/false-neighbor-validation.mjs
// Takes ~60s; the Amazon pipeline (367K nodes, single-threaded) dominates.

import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

function readData(path) {
  const buf = readFileSync(path);
  return path.endsWith('.gz') ? gunzipSync(buf).toString('utf8') : buf.toString('utf8');
}

const REPO = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const { runPipeline } = await import(`${REPO}/docs/blitzoom-pipeline.js`);
const { tokenizeLabel, tokenizeNumeric, degreeBucket } = await import(`${REPO}/docs/blitzoom-pipeline.js`);
const { MINHASH_K, computeMinHash, computeEffectiveWeights, buildGaussianProjection, PROJECTION_SEED_BASE } =
  await import(`${REPO}/docs/blitzoom-algo.js`);

const K = MINHASH_K;

// ─── Token reconstruction (mirrors projectNode exactly) ─────────────────────
function tokensForGroup(node, neighborGroups, g, numericBins) {
  const buf = new Array(64);
  if (g === 'group') return ['group:' + node.group];
  if (g === 'label') {
    const end = tokenizeLabel(node.label, node.id, buf, 0);
    return buf.slice(0, end);
  }
  if (g === 'structure') return ['deg:' + degreeBucket(node.degree), 'leaf:' + (node.degree === 0)];
  if (g === 'neighbors') {
    if (neighborGroups.length === 0) return ['ngroup:isolated'];
    return neighborGroups.map(x => 'ngroup:' + x);
  }
  if (g === 'edgetype') {
    if (node.edgeTypes && node.edgeTypes.length > 0) return node.edgeTypes.map(t => 'etype:' + t);
    return ['etype:none'];
  }
  // extra property
  const val = node.extraProps && node.extraProps[g];
  const end = tokenizeNumeric(g, val, numericBins[g], buf, 0);
  return buf.slice(0, end); // may be [] (empty/undefined → no tokens)
}

function zscore(sig) {
  if (sig[0] === -1) return null; // empty-token sentinel
  let mean = 0;
  for (let i = 0; i < K; i++) mean += sig[i];
  mean /= K;
  let v = 0;
  for (let i = 0; i < K; i++) { const d = sig[i] - mean; v += d * d; }
  const std = Math.sqrt(v / K) || 1;
  const u = new Float64Array(K);
  for (let i = 0; i < K; i++) u[i] = (sig[i] - mean) / std;
  return u;
}

function jaccard(a, b) {
  // Design convention: J(∅,∅) = 1, J(∅,X) = 0.
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const t of small) if (big.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

// ─── Statistics helpers ─────────────────────────────────────────────────────
function chi2CDF(t) { return 1 - Math.exp(-t / 2); }

function summarizeT(ts, label) {
  ts.sort((a, b) => a - b);
  const n = ts.length;
  const mean = ts.reduce((s, x) => s + x, 0) / n;
  const median = ts[Math.floor(n / 2)];
  // KS distance vs chi²₂ CDF (descriptive; pairs are not independent)
  let ks = 0;
  for (let i = 0; i < n; i++) {
    const F = chi2CDF(ts[i]);
    ks = Math.max(ks, Math.abs(F - (i + 1) / n), Math.abs(F - i / n));
  }
  const probe = [0.2, 0.5, 1, 2, 4];
  const rows = probe.map(x => {
    let lo = 0, hi = n;
    while (lo < hi) { const m = (lo + hi) >> 1; if (ts[m] <= x) lo = m + 1; else hi = m; }
    return { x, emp: lo / n, theory: chi2CDF(x) };
  });
  console.log(`  ${label}: n=${n}  mean=${mean.toFixed(3)} (theory 2.000)  median=${median.toFixed(3)} (theory 1.386)  KS=${ks.toFixed(4)}`);
  for (const r of rows) {
    console.log(`    P(t<=${r.x}):  empirical ${r.emp.toFixed(4)}   theory ${r.theory.toFixed(4)}   diff ${(r.emp - r.theory >= 0 ? '+' : '')}${(r.emp - r.theory).toFixed(4)}`);
  }
}

// ─── Main experiment ────────────────────────────────────────────────────────
function runDataset(name, edgesPath, nodesPath, maxPairs, maxNodes = Infinity) {
  console.log(`\n========== ${name} ==========`);
  const edgesText = readData(`${REPO}/docs/data/${edgesPath}`);
  const nodesText = nodesPath ? readData(`${REPO}/docs/data/${nodesPath}`) : null;
  const t0 = Date.now();
  const g = runPipeline(edgesText, nodesText);
  let { nodeArray, adjGroups, groupNames, numericBins, projBuf } = g;
  const fullN = nodeArray.length, G = groupNames.length;
  // Deterministic node subsample for very large datasets (pair statistics only
  // need a representative node set, not the full graph).
  if (fullN > maxNodes) {
    const stride = Math.ceil(fullN / maxNodes);
    const idxs = [];
    for (let i = 0; i < fullN; i += stride) idxs.push(i);
    const sub = new Float64Array(idxs.length * G * 2);
    idxs.forEach((src, dst) => {
      sub.set(projBuf.subarray(src * G * 2, (src + 1) * G * 2), dst * G * 2);
    });
    nodeArray = idxs.map(i => nodeArray[i]);
    adjGroups = idxs.map(i => adjGroups[i]);
    projBuf = sub;
    console.log(`subsampled ${fullN} → ${nodeArray.length} nodes (every ${stride}th)`);
  }
  const N = nodeArray.length;
  console.log(`nodes=${N}${fullN !== N ? `/${fullN}` : ''} edges=${g.edges.length} groups=[${groupNames.join(', ')}]  pipeline ${Date.now() - t0}ms`);

  // Default-style strengths: group = 3, everything else floor (via computeEffectiveWeights)
  const { effW, totalW } = computeEffectiveWeights(groupNames, { group: 3 });
  const ROTS = groupNames.map((_, gi) => buildGaussianProjection(PROJECTION_SEED_BASE + gi, K));

  // Per node: z-scored sigs, token sets, per-group projections, blended position
  const sigs = new Array(N);       // sigs[i][gi] = Float64Array | null
  const toks = new Array(N);       // toks[i][gi] = Set
  const bx = new Float64Array(N), by = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    sigs[i] = new Array(G); toks[i] = new Array(G);
    let px = 0, py = 0;
    for (let gi = 0; gi < G; gi++) {
      const tk = tokensForGroup(nodeArray[i], adjGroups[i], groupNames[gi], numericBins);
      toks[i][gi] = new Set(tk);
      sigs[i][gi] = tk.length === 0 ? null : zscore(computeMinHash(tk, tk.length));
      const w = effW[groupNames[gi]] / totalW;
      px += projBuf[i * G * 2 + gi * 2] * w;
      py += projBuf[i * G * 2 + gi * 2 + 1] * w;
    }
    bx[i] = px; by[i] = py;
  }

  // Sanity check: reconstructed z-scored sigs must reproduce the shipped
  // projections (u·R vs projBuf) — proves token reconstruction matches projectNode.
  {
    let worst = 0;
    for (let i = 0; i < Math.min(25, N); i++) {
      for (let gi = 0; gi < G; gi++) {
        const u = sigs[i][gi];
        const R = ROTS[gi];
        let px = 0, py = 0;
        if (u !== null) {
          for (let q = 0; q < K; q++) { px += u[q] * R[0][q]; py += u[q] * R[1][q]; }
        }
        worst = Math.max(worst,
          Math.abs(px - projBuf[i * G * 2 + gi * 2]),
          Math.abs(py - projBuf[i * G * 2 + gi * 2 + 1]));
      }
    }
    if (worst > 1e-9) throw new Error(`token reconstruction mismatch: max delta ${worst}`);
    console.log(`sanity: reconstructed projections match pipeline (max delta ${worst.toExponential(1)})`);
  }

  // Layout scale (per-axis std of blended positions)
  let mx = 0, my = 0;
  for (let i = 0; i < N; i++) { mx += bx[i]; my += by[i]; }
  mx /= N; my /= N;
  let vx = 0, vy = 0;
  for (let i = 0; i < N; i++) { vx += (bx[i] - mx) ** 2; vy += (by[i] - my) ** 2; }
  const layoutStd = Math.sqrt((vx + vy) / (2 * N));
  console.log(`layout per-axis std = ${layoutStd.toFixed(2)}`);

  // Pair sampling plan
  const totalPairs = N * (N - 1) / 2;
  const sampleAll = totalPairs <= maxPairs;
  const stride = sampleAll ? 1 : Math.ceil(totalPairs / maxPairs);
  console.log(`pairs: ${totalPairs} total, ${sampleAll ? 'using all' : `sampling every ${stride}th`}`);

  // Pick a high-entropy single group for the per-group kernel test
  const singleGi = groupNames.indexOf('label');

  const tBlend = [], tSingle = [];
  const rjBins = Array.from({ length: 10 }, () => ({ sumR: 0, sumJ: 0, n: 0 }));
  // False-neighbor accounting at several ε (as fraction c of layout std)
  const CS = [0.05, 0.1, 0.2];
  const TAU = 0.10; // "dissimilar" threshold on weighted Jaccard
  const fn = CS.map(() => ({ inEps: 0, falseInEps: 0, predIn: 0, predFalseIn: 0 }));
  let sampled = 0, falsePairs = 0;
  const wg = groupNames.map(gn => effW[gn] / totalW);

  let pairIdx = -1;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      pairIdx++;
      if (!sampleAll && pairIdx % stride !== 0) continue;

      // Per-group r, variance contribution, exact Jaccard
      let s2 = 0, Jw = 0;
      for (let gi = 0; gi < G; gi++) {
        const u = sigs[i][gi], v = sigs[j][gi];
        let varC;
        if (u === null && v === null) varC = 0;
        else if (u === null || v === null) varC = K; // diff = one full signature
        else {
          let dot = 0;
          for (let q = 0; q < K; q++) dot += u[q] * v[q];
          const r = dot / K;
          varC = Math.max(0, 2 * K * (1 - r));
          if (gi === singleGi) {
            // single-group kernel test + r-vs-J bridge (label group)
            const J = jaccard(toks[i][gi], toks[j][gi]);
            const bin = Math.min(9, Math.floor(J * 10));
            rjBins[bin].sumR += r; rjBins[bin].sumJ += J; rjBins[bin].n++;
            if (1 - r > 1e-9) {
              const dxs = projBuf[i * G * 2 + gi * 2] - projBuf[j * G * 2 + gi * 2];
              const dys = projBuf[i * G * 2 + gi * 2 + 1] - projBuf[j * G * 2 + gi * 2 + 1];
              tSingle.push((dxs * dxs + dys * dys) / (2 * K * (1 - r)));
            }
          }
        }
        s2 += wg[gi] * wg[gi] * varC;
        Jw += wg[gi] * jaccard(toks[i][gi], toks[j][gi]);
      }

      const dx = bx[i] - bx[j], dy = by[i] - by[j];
      const d2 = dx * dx + dy * dy;
      if (s2 > 1e-12) tBlend.push(d2 / s2);

      const isFalse = Jw < TAU;
      sampled++; if (isFalse) falsePairs++;
      for (let ci = 0; ci < CS.length; ci++) {
        const eps = CS[ci] * layoutStd;
        const pKernel = s2 > 1e-12 ? 1 - Math.exp(-(eps * eps) / (2 * s2)) : (d2 <= eps * eps ? 1 : 0);
        fn[ci].predIn += pKernel;
        if (isFalse) fn[ci].predFalseIn += pKernel;
        if (d2 <= eps * eps) {
          fn[ci].inEps++;
          if (isFalse) fn[ci].falseInEps++;
        }
      }
    }
  }

  console.log(`\n[1] Single-group kernel (group='label'): t = d²/(2k(1−r)) vs χ²₂`);
  summarizeT(tSingle, 'label');

  console.log(`\n[2] Blended kernel (α=0, default-style weights): t = d²/σ² vs χ²₂`);
  summarizeT(tBlend, 'blend');

  console.log(`\n[3] Bridge E[r] vs J (label group, binned by exact Jaccard):`);
  for (let b = 0; b < 10; b++) {
    const { sumR, sumJ, n } = rjBins[b];
    if (n === 0) continue;
    console.log(`    J∈[${(b / 10).toFixed(1)},${((b + 1) / 10).toFixed(1)}): n=${String(n).padStart(8)}  mean J=${(sumJ / n).toFixed(3)}  mean r=${(sumR / n).toFixed(3)}  bias=${(sumR / n - sumJ / n >= 0 ? '+' : '')}${(sumR / n - sumJ / n).toFixed(3)}`);
  }

  console.log(`\n[4] False-neighbor rate (false = weighted Jaccard < ${TAU}), ε as fraction of layout std:`);
  console.log(`    base rate: ${falsePairs} of ${sampled} sampled pairs are dissimilar (${(100 * falsePairs / sampled).toFixed(1)}%)`);
  for (let ci = 0; ci < CS.length; ci++) {
    const f = fn[ci];
    const empFNR = f.inEps > 0 ? f.falseInEps / f.inEps : NaN;
    const predFNR = f.predIn > 0 ? f.predFalseIn / f.predIn : NaN;
    console.log(`    ε=${CS[ci]}σ: pairs within ε — actual ${f.inEps}, kernel-predicted ${f.predIn.toFixed(1)}` +
      `  |  FNR — empirical ${(empFNR * 100).toFixed(1)}%, semi-analytic ${(predFNR * 100).toFixed(1)}%`);
  }
}

// Property-rich datasets
runDataset('Epstein (edge types)', 'epstein.edges', 'epstein.nodes', 1e9);
runDataset('Pokemon (rich properties)', 'pokemon.edges', 'pokemon.nodes', 1e9);
runDataset('MITRE ATT&CK (rich properties)', 'mitre-attack.edges', 'mitre-attack.nodes', 400000);
runDataset('Marvel (categorical properties)', 'marvel.edges', 'marvel.nodes', 400000);
runDataset('Porsche (numeric properties)', 'porsche.edges', 'porsche.nodes', 1e9);
runDataset('Synth Packages (rich)', 'synth-packages.edges', 'synth-packages.nodes', 400000);
runDataset('BlitZoom Source (mixed props)', 'blitzoom-source.edges', 'blitzoom-source.nodes', 400000);
// Edge-only datasets (degenerate signature regime)
runDataset('Karate (edge-only, 34 nodes)', 'karate.edges', 'karate.nodes', 1e9);
runDataset('Power Grid (edge-only)', 'powergrid.edges', null, 400000);
runDataset('Facebook (edge-only, dense)', 'facebook.edges', null, 400000);
// Large scale (node-subsampled)
runDataset('Amazon co-purchase (367K, subsampled)', 'amazon-copurchase.edges.gz', 'amazon-copurchase.nodes.gz', 400000, 15000);
