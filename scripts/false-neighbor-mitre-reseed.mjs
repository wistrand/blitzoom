// false-neighbor-mitre-reseed.mjs — Follow-up to the validation study: does
// MITRE's blend anomaly (Part 1: mean t = 1.08, KS = 0.256, distances ~√2
// narrower than predicted) share a cause with its anchor collisions (Part 3:
// worst collision mass in the corpus, 1.83M)?
//
// Test: re-run the Part 1 blend-kernel validation (t = d²/σ² vs χ²₂) with each
// node's 'group' projection replaced by the anchor from the best-of-50
// collision-mass seed — the same reseeding as the Part 3 sweep. The theory
// variance σ² depends only on signature correlations, which are seed-
// independent, so only the measured distances change.
//
// Controls:
//   Pokemon — blend already calibrated (KS 0.028); reseeding must not break it.
//   Marvel, Synth — anomaly on the WIDE side (KS 0.162 / 0.183, mean t > 2),
//   attributed to cross-group correlation, not anchor collision; reseeding the
//   group matrix should not fix them.
// Results and interpretation: agent_docs/RESEARCH-false-neighbor-validation.md
//
// Run:  node scripts/false-neighbor-mitre-reseed.mjs   (~30s)
//   or  deno run --allow-read scripts/false-neighbor-mitre-reseed.mjs

import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const { runPipeline, tokenizeLabel, tokenizeNumeric, degreeBucket } = await import(`${REPO}/docs/blitzoom-pipeline.js`);
const { MINHASH_K, computeMinHash, computeEffectiveWeights, buildGaussianProjection, projectWith } =
  await import(`${REPO}/docs/blitzoom-algo.js`);

const K = MINHASH_K;
const SHIPPED_SEED = 2001; // PROJECTION_SEED_BASE + 0 — 'group' is always group index 0

function readData(p) { const b = readFileSync(p); return p.endsWith('.gz') ? gunzipSync(b).toString('utf8') : b.toString('utf8'); }

function tokensForGroup(node, nbrGroups, gname, numericBins) {
  const buf = new Array(64);
  if (gname === 'group') return ['group:' + node.group];
  if (gname === 'label') { const e = tokenizeLabel(node.label, node.id, buf, 0); return buf.slice(0, e); }
  if (gname === 'structure') return ['deg:' + degreeBucket(node.degree), 'leaf:' + (node.degree === 0)];
  if (gname === 'neighbors') return nbrGroups.length ? nbrGroups.map(x => 'ngroup:' + x) : ['ngroup:isolated'];
  if (gname === 'edgetype') return node.edgeTypes?.length ? node.edgeTypes.map(t => 'etype:' + t) : ['etype:none'];
  const val = node.extraProps?.[gname];
  const e = tokenizeNumeric(gname, val, numericBins[gname], buf, 0);
  return buf.slice(0, e);
}

function zscore(sig) {
  if (sig[0] === -1) return null;
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

function summarizeT(ts) {
  ts.sort((a, b) => a - b);
  const n = ts.length;
  const mean = ts.reduce((s, x) => s + x, 0) / n;
  const median = ts[Math.floor(n / 2)];
  let ks = 0;
  for (let i = 0; i < n; i++) {
    const F = 1 - Math.exp(-ts[i] / 2);
    ks = Math.max(ks, Math.abs(F - (i + 1) / n), Math.abs(F - i / n));
  }
  return { mean, median, ks };
}

function run(name, edgesFile, nodesFile, maxPairs = 400000) {
  const g = runPipeline(readData(`${REPO}/docs/data/${edgesFile}`), readData(`${REPO}/docs/data/${nodesFile}`));
  const { nodeArray, adjGroups, groupNames, numericBins, projBuf } = g;
  const N = nodeArray.length, G = groupNames.length;
  const groupIdx = groupNames.indexOf('group');
  const { effW, totalW } = computeEffectiveWeights(groupNames, { group: 3 });
  const wg = groupNames.map(gn => effW[gn] / totalW);
  const wfrac = effW.group / totalW;

  // Reconstruct token sets + z-scored signatures (theory σ² needs per-pair r)
  const sigs = new Array(N), toks = new Array(N);
  for (let i = 0; i < N; i++) {
    sigs[i] = new Array(G); toks[i] = new Array(G);
    for (let gi = 0; gi < G; gi++) {
      const tk = tokensForGroup(nodeArray[i], adjGroups[i], groupNames[gi], numericBins);
      toks[i][gi] = new Set(tk);
      sigs[i][gi] = tk.length === 0 ? null : zscore(computeMinHash(tk, tk.length));
    }
  }

  // Seed search — identical candidates and scoring to the Part 3 sweep
  const pops = new Map();
  for (const n of nodeArray) pops.set(n.group, (pops.get(n.group) || 0) + 1);
  const cats = [...pops.keys()];
  const catSigs = new Map(cats.map(c => [c, computeMinHash(['group:' + c], 1)]));
  let s2floor = 0;
  for (const gn of groupNames) if (gn !== 'group') s2floor += (effW[gn] / totalW) ** 2 * 2 * K;
  function collision(seed) {
    const R = buildGaussianProjection(seed, K);
    const a = new Map(cats.map(c => [c, projectWith(catSigs.get(c), R)]));
    let mass = 0;
    for (let x = 0; x < cats.length; x++) {
      for (let y = x + 1; y < cats.length; y++) {
        const pa = a.get(cats[x]), pb = a.get(cats[y]);
        const D = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
        mass += pops.get(cats[x]) * pops.get(cats[y]) * Math.exp(-((D * wfrac) ** 2) / (2 * s2floor));
      }
    }
    return { mass, anchors: a };
  }
  const shipped = collision(SHIPPED_SEED);
  let best = { seed: SHIPPED_SEED, ...shipped };
  for (let t = 1; t <= 50; t++) {
    const seed = SHIPPED_SEED + 10000 + t * 977;
    const r = collision(seed);
    if (r.mass < best.mass) best = { seed, ...r };
  }

  // Blend positions: shipped projBuf, and with reseeded group anchors
  const bx0 = new Float64Array(N), by0 = new Float64Array(N);
  const bx1 = new Float64Array(N), by1 = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
    for (let gi = 0; gi < G; gi++) {
      const px = projBuf[i * G * 2 + gi * 2], py = projBuf[i * G * 2 + gi * 2 + 1];
      x0 += px * wg[gi]; y0 += py * wg[gi];
      if (gi === groupIdx) {
        const a = best.anchors.get(nodeArray[i].group);
        x1 += a[0] * wg[gi]; y1 += a[1] * wg[gi];
      } else {
        x1 += px * wg[gi]; y1 += py * wg[gi];
      }
    }
    bx0[i] = x0; by0[i] = y0; bx1[i] = x1; by1[i] = y1;
  }

  // Pair loop: theory σ² from signature correlations (seed-independent),
  // t = d²/σ² under both blends
  const totalPairs = N * (N - 1) / 2;
  const stride = totalPairs <= maxPairs ? 1 : Math.ceil(totalPairs / maxPairs);
  const t0 = [], t1 = [];
  let pi = -1;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      pi++;
      if (stride > 1 && pi % stride !== 0) continue;
      let s2 = 0;
      for (let gi = 0; gi < G; gi++) {
        const u = sigs[i][gi], v = sigs[j][gi];
        let varC;
        if (u === null && v === null) varC = 0;
        else if (u === null || v === null) varC = K;
        else {
          let dot = 0;
          for (let q = 0; q < K; q++) dot += u[q] * v[q];
          varC = Math.max(0, 2 * K * (1 - dot / K));
        }
        s2 += wg[gi] * wg[gi] * varC;
      }
      if (s2 <= 1e-12) continue;
      const dx0 = bx0[i] - bx0[j], dy0 = by0[i] - by0[j];
      const dx1 = bx1[i] - bx1[j], dy1 = by1[i] - by1[j];
      t0.push((dx0 * dx0 + dy0 * dy0) / s2);
      t1.push((dx1 * dx1 + dy1 * dy1) / s2);
    }
  }

  const a = summarizeT(t0), b = summarizeT(t1);
  console.log(`${name.padEnd(16)} C=${String(cats.length).padStart(3)}  mass ${shipped.mass.toFixed(0).padStart(8)} → ${best.mass.toFixed(0).padStart(7)} (seed ${best.seed})` +
    `  |  blend t vs χ²₂ (theory mean 2.000):`);
  console.log(`${''.padEnd(16)} shipped   mean ${a.mean.toFixed(3)}  median ${a.median.toFixed(3)}  KS ${a.ks.toFixed(4)}`);
  console.log(`${''.padEnd(16)} reseeded  mean ${b.mean.toFixed(3)}  median ${b.median.toFixed(3)}  KS ${b.ks.toFixed(4)}`);

  // Per-seed co-movement: does mean t track collision mass across all 51 seeds?
  // Precompute per-pair non-group blend diff + σ² once (seed-independent); per
  // seed only the weighted group-anchor delta changes.
  const P = t0.length;
  const pBaseDx = new Float64Array(P), pBaseDy = new Float64Array(P), pS2 = new Float64Array(P);
  const pCi = new Int32Array(P), pCj = new Int32Array(P);
  const catIdx = new Map(cats.map((c, ix) => [c, ix]));
  {
    let pi2 = -1, p = 0;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        pi2++;
        if (stride > 1 && pi2 % stride !== 0) continue;
        let s2 = 0;
        for (let gi = 0; gi < G; gi++) {
          const u = sigs[i][gi], v = sigs[j][gi];
          let varC;
          if (u === null && v === null) varC = 0;
          else if (u === null || v === null) varC = K;
          else {
            let dot = 0;
            for (let q = 0; q < K; q++) dot += u[q] * v[q];
            varC = Math.max(0, 2 * K * (1 - dot / K));
          }
          s2 += wg[gi] * wg[gi] * varC;
        }
        if (s2 <= 1e-12) continue;
        // non-group part of the blend difference
        let dx = bx0[i] - bx0[j], dy = by0[i] - by0[j];
        const gpx = (projBuf[i * G * 2 + groupIdx * 2] - projBuf[j * G * 2 + groupIdx * 2]) * wg[groupIdx];
        const gpy = (projBuf[i * G * 2 + groupIdx * 2 + 1] - projBuf[j * G * 2 + groupIdx * 2 + 1]) * wg[groupIdx];
        pBaseDx[p] = dx - gpx; pBaseDy[p] = dy - gpy; pS2[p] = s2;
        pCi[p] = catIdx.get(nodeArray[i].group); pCj[p] = catIdx.get(nodeArray[j].group);
        p++;
      }
    }
  }
  const seeds = [SHIPPED_SEED];
  for (let t = 1; t <= 50; t++) seeds.push(SHIPPED_SEED + 10000 + t * 977);
  const masses = [], meanTs = [];
  const w = wg[groupIdx];
  for (const seed of seeds) {
    const { mass, anchors } = collision(seed);
    const ax = new Float64Array(cats.length), ay = new Float64Array(cats.length);
    cats.forEach((c, ix) => { const an = anchors.get(c); ax[ix] = an[0]; ay[ix] = an[1]; });
    let sum = 0;
    for (let p = 0; p < P; p++) {
      const dx = pBaseDx[p] + w * (ax[pCi[p]] - ax[pCj[p]]);
      const dy = pBaseDy[p] + w * (ay[pCi[p]] - ay[pCj[p]]);
      sum += (dx * dx + dy * dy) / pS2[p];
    }
    masses.push(mass); meanTs.push(sum / P);
  }
  // Pearson on log(mass) vs mean t (mass spans orders of magnitude), plus
  // Spearman rank correlation
  const logM = masses.map(m => Math.log(m + 1));
  const pearson = (xs, ys) => {
    const n = xs.length;
    const mx2 = xs.reduce((s, x) => s + x, 0) / n, my2 = ys.reduce((s, x) => s + x, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const dx = xs[i] - mx2, dy = ys[i] - my2; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
    return sxy / Math.sqrt(sxx * syy);
  };
  const rank = xs => {
    const order = xs.map((x, i) => [x, i]).sort((a2, b2) => a2[0] - b2[0]);
    const rk = new Array(xs.length);
    order.forEach(([, i], r) => { rk[i] = r; });
    return rk;
  };
  const grand = meanTs.reduce((s, x) => s + x, 0) / meanTs.length;
  console.log(`${''.padEnd(16)} 51 seeds: mean t range [${Math.min(...meanTs).toFixed(2)}, ${Math.max(...meanTs).toFixed(2)}]` +
    `  grand mean ${grand.toFixed(3)} (theory 2.000)` +
    `  corr(log mass, mean t): Pearson ${pearson(logM, meanTs).toFixed(3)}  Spearman ${pearson(rank(logM), rank(meanTs)).toFixed(3)}`);
}

run('MITRE ATT&CK', 'mitre-attack.edges', 'mitre-attack.nodes');
run('Pokemon', 'pokemon.edges', 'pokemon.nodes');
run('Marvel', 'marvel.edges', 'marvel.nodes');
run('Synth Packages', 'synth-packages.edges', 'synth-packages.nodes');
