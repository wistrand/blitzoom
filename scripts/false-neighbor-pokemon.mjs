// false-neighbor-pokemon.mjs — Diagnose Pokemon's 18% false-neighbor rate and
// measure how auto-tune / bearings / seed choice change it.
// Results and interpretation: agent_docs/RESEARCH-false-neighbor-validation.md
//
// Parts:
//  A. Reproduce false pairs under default weights (group:3), decompose by
//     (type_i, type_j) — test the anchor-collision hypothesis. Each Type has
//     exactly one 'group' anchor (single token → identical signature), so
//     cross-type collisions should be predictable from the 18 anchor positions.
//  B. Run the real autoTuneStrengths + autoTuneBearings headlessly; measure
//     empirical FNR under: default, autotune, autotune+bearings.
//  C. Comparison configs (equal strengths, solo groups) — does the semi-analytic
//     kernel FNR rank configs the same as the empirical rate?
//  D. Seed search for the 'group' projection matrix, scored by analytic
//     collision mass. Cross-dataset version: false-neighbor-seed-sweep.mjs
//
// Run:  node scripts/false-neighbor-pokemon.mjs   (~2 min; auto-tune dominates)
//   or  deno run --allow-read scripts/false-neighbor-pokemon.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const { runPipeline, tokenizeLabel, tokenizeNumeric, degreeBucket } = await import(`${REPO}/docs/blitzoom-pipeline.js`);
const { MINHASH_K, computeMinHash, computeEffectiveWeights } = await import(`${REPO}/docs/blitzoom-algo.js`);
const { autoTuneStrengths, autoTuneBearings } = await import(`${REPO}/docs/blitzoom-utils.js`);

const K = MINHASH_K;

// ── Load + hydrate ──────────────────────────────────────────────────────────
const g = runPipeline(
  readFileSync(`${REPO}/docs/data/pokemon.edges`, 'utf8'),
  readFileSync(`${REPO}/docs/data/pokemon.nodes`, 'utf8'));
const { nodeArray, adjGroups, groupNames, numericBins, projBuf, adjList, nodeIndex } = g;
const N = nodeArray.length, G = groupNames.length;
for (let i = 0; i < N; i++) {
  const p = {};
  for (let gi = 0; gi < G; gi++) p[groupNames[gi]] = [projBuf[i * G * 2 + gi * 2], projBuf[i * G * 2 + gi * 2 + 1]];
  nodeArray[i].projections = p;
}
console.log(`pokemon: N=${N} groups=[${groupNames.join(', ')}]`);

// ── Token sets + z-scored sigs (same reconstruction as false-neighbor-validation) ──
function tokensForGroup(node, nbrGroups, gname) {
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
  let m = 0; for (let i = 0; i < K; i++) m += sig[i]; m /= K;
  let v = 0; for (let i = 0; i < K; i++) { const d = sig[i] - m; v += d * d; }
  const s = Math.sqrt(v / K) || 1;
  const u = new Float64Array(K);
  for (let i = 0; i < K; i++) u[i] = (sig[i] - m) / s;
  return u;
}
function jac(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const [sm, bg] = a.size <= b.size ? [a, b] : [b, a];
  for (const t of sm) if (bg.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
const toks = nodeArray.map((n, i) => groupNames.map(gn => new Set(tokensForGroup(n, adjGroups[i], gn))));
const sigs = nodeArray.map((n, i) => groupNames.map((gn, gi) => toks[i][gi].size === 0 ? null : zscore(computeMinHash([...toks[i][gi]], toks[i][gi].size))));

// ── Reference dissimilarity: weighted Jaccard under DEFAULT weights, fixed for
//    all configs so FNR numbers are comparable ──────────────────────────────
const { effW: refW, totalW: refTot } = computeEffectiveWeights(groupNames, { group: 3 });
const TAU = 0.10;
function refJ(i, j) {
  let s = 0;
  for (let gi = 0; gi < G; gi++) s += (refW[groupNames[gi]] / refTot) * jac(toks[i][gi], toks[j][gi]);
  return s;
}

// ── Pre-quant blend (mirrors unifiedBlend without quantization) ─────────────
function blendPositions(strengths, alpha = 0, passes = 5, bearings = null) {
  const { effW, totalW } = computeEffectiveWeights(groupNames, strengths);
  const px = new Float64Array(N), py = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let x = 0, y = 0;
    for (let gi = 0; gi < G; gi++) {
      const p = nodeArray[i].projections[groupNames[gi]];
      if (!p) continue;
      let ax = p[0], ay = p[1];
      const th = bearings?.[groupNames[gi]] || 0;
      if (th) { const c = Math.cos(th), s = Math.sin(th); const rx = ax * c - ay * s; ay = ax * s + ay * c; ax = rx; }
      x += ax * effW[groupNames[gi]]; y += ay * effW[groupNames[gi]];
    }
    px[i] = x / totalW; py[i] = y / totalW;
  }
  if (alpha > 0 && passes > 0) {
    const ax0 = px.slice(), ay0 = py.slice();
    for (let p = 0; p < passes; p++) {
      const nx = new Float64Array(N), ny = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        const nbrs = adjList[nodeArray[i].id];
        if (nbrs?.length) {
          let sx = 0, sy = 0, c = 0;
          for (const nid of nbrs) { const k = idIdx[nid]; if (k !== undefined) { sx += px[k]; sy += py[k]; c++; } }
          if (c) { nx[i] = (1 - alpha) * ax0[i] + alpha * sx / c; ny[i] = (1 - alpha) * ay0[i] + alpha * sy / c; continue; }
        }
        nx[i] = ax0[i]; ny[i] = ay0[i];
      }
      px.set(nx); py.set(ny);
    }
  }
  return { px, py, effW, totalW };
}
const idIdx = {}; nodeArray.forEach((n, i) => { idIdx[n.id] = i; });

// ── FNR measurement + kernel prediction for a config ────────────────────────
function evalConfig(name, strengths, alpha = 0, bearings = null, decompose = false) {
  const { px, py, effW, totalW } = blendPositions(strengths, alpha, 5, bearings);
  let mx = 0, my = 0;
  for (let i = 0; i < N; i++) { mx += px[i]; my += py[i]; }
  mx /= N; my /= N;
  let vv = 0;
  for (let i = 0; i < N; i++) vv += (px[i] - mx) ** 2 + (py[i] - my) ** 2;
  const sigma = Math.sqrt(vv / (2 * N));
  const eps = 0.1 * sigma, eps2 = eps * eps;
  const wg = groupNames.map(gn => effW[gn] / totalW);

  let inEps = 0, falseIn = 0, predIn = 0, predFalseIn = 0, falseTotal = 0;
  const combo = new Map();
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const J = refJ(i, j);
      const isFalse = J < TAU;
      if (isFalse) falseTotal++;
      const dx = px[i] - px[j], dy = py[i] - py[j];
      const close = dx * dx + dy * dy <= eps2;
      if (close) {
        inEps++;
        if (isFalse) {
          falseIn++;
          if (decompose) {
            const a = nodeArray[i].group, b = nodeArray[j].group;
            const key = a <= b ? a + ' × ' + b : b + ' × ' + a;
            combo.set(key, (combo.get(key) || 0) + 1);
          }
        }
      }
      // kernel prediction (α=0 form; approximation when alpha>0)
      let s2 = 0;
      for (let gi = 0; gi < G; gi++) {
        const u = sigs[i][gi], v = sigs[j][gi];
        let varC;
        if (u === null && v === null) varC = 0;
        else if (u === null || v === null) varC = K;
        else { let d = 0; for (let q = 0; q < K; q++) d += u[q] * v[q]; varC = Math.max(0, 2 * K * (1 - d / K)); }
        s2 += wg[gi] * wg[gi] * varC;
      }
      const pk = s2 > 1e-12 ? 1 - Math.exp(-eps2 / (2 * s2)) : (close ? 1 : 0);
      predIn += pk;
      if (isFalse) predFalseIn += pk;
    }
  }
  const fnr = inEps ? falseIn / inEps : 0;
  const pfnr = predIn ? predFalseIn / predIn : 0;
  console.log(`\n[${name}] α=${alpha} σ=${sigma.toFixed(2)}  dissimilar base=${(100 * falseTotal / (N * (N - 1) / 2)).toFixed(1)}%`);
  console.log(`  FNR @0.1σ: empirical ${(100 * fnr).toFixed(1)}%  (${falseIn}/${inEps})   semi-analytic ${(100 * pfnr).toFixed(1)}%`);
  if (decompose && combo.size) {
    const top = [...combo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    console.log('  top false-pair type combos: ' + top.map(([k, c]) => `${k}:${c}`).join('  '));
  }
  return { fnr, pfnr, falseIn, inEps };
}

// ── Part A: default config + anchor-collision analysis ──────────────────────
console.log('\n===== Part A: anatomy of the default layout =====');
// The 18 type anchors under the 'group' projection (one point per type).
const anchors = new Map();
for (let i = 0; i < N; i++) {
  if (!anchors.has(nodeArray[i].group)) anchors.set(nodeArray[i].group, nodeArray[i].projections.group);
}
const types = [...anchors.keys()];
const pairsByDist = [];
for (let a = 0; a < types.length; a++) {
  for (let b = a + 1; b < types.length; b++) {
    const pa = anchors.get(types[a]), pb = anchors.get(types[b]);
    pairsByDist.push({ pair: types[a] + ' × ' + types[b], d: Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) });
  }
}
pairsByDist.sort((x, y) => x.d - y.d);
console.log(`${types.length} type anchors; closest anchor pairs (group-projection space):`);
for (const p of pairsByDist.slice(0, 8)) console.log(`  ${p.pair}: d=${p.d.toFixed(2)}`);
console.log(`  (median anchor distance: ${pairsByDist[Math.floor(pairsByDist.length / 2)].d.toFixed(2)})`);

evalConfig('default group:3', { group: 3 }, 0, null, true);

// ── Part B: auto-tune ───────────────────────────────────────────────────────
console.log('\n===== Part B: auto-tune =====');
const tune = await autoTuneStrengths(nodeArray, groupNames, adjList, nodeIndex, { timeout: 60000 });
console.log('autotune result:', JSON.stringify({ strengths: tune.strengths, alpha: tune.alpha, quant: tune.quant, score: +tune.score?.toFixed?.(4) || tune.score }));
evalConfig('autotune', tune.strengths, tune.alpha, null, true);

const bearings = autoTuneBearings(nodeArray, groupNames, tune.strengths);
console.log('autotune bearings (deg):', JSON.stringify(Object.fromEntries(Object.entries(bearings).map(([k, v]) => [k, +(v * 180 / Math.PI).toFixed(1)]))));
evalConfig('autotune+bearings', tune.strengths, tune.alpha, bearings, true);

// ── Part C: alternative configs ─────────────────────────────────────────────
console.log('\n===== Part C: comparison configs =====');
const tunable = groupNames.filter(gn => !['label', 'structure', 'neighbors'].includes(gn));
const equal = {}; for (const t of tunable) equal[t] = 3;
evalConfig('equal all tunable = 3', equal, 0);
evalConfig('generation-solo 8', { generation: 8 }, 0);
evalConfig('group+generation', { group: 3, generation: 8 }, 0);

// ── Part D: seed search for the 'group' projection matrix ───────────────────
// Anchor collisions are one draw of the seeded PRNG. Score candidate seeds by
// analytic collision mass: Σ pop_a·pop_b·exp(−(D_ab·w_frac)²/(2·s²_floor)),
// where D_ab = anchor distance and s²_floor = residual per-coordinate variance
// from the floor-weighted groups. Pick the best, patch, re-measure FNR.
console.log('\n===== Part D: seed search for the group projection =====');
const { buildGaussianProjection: buildR, projectWith } = await import(`${REPO}/docs/blitzoom-algo.js`);

const pops = new Map();
for (const n of nodeArray) pops.set(n.group, (pops.get(n.group) || 0) + 1);
const cats = [...pops.keys()];
const catSigs = new Map(cats.map(c => [c, computeMinHash(['group:' + c], 1)]));

const { effW: dW, totalW: dTot } = computeEffectiveWeights(groupNames, { group: 3 });
const wfrac = dW.group / dTot;
let s2floor = 0;
for (const gn of groupNames) if (gn !== 'group') s2floor += (dW[gn] / dTot) ** 2 * 2 * K;

function collisionMass(seed) {
  const R = buildR(seed, K);
  const a = new Map(cats.map(c => [c, projectWith(catSigs.get(c), R)]));
  let mass = 0, minD = Infinity;
  for (let x = 0; x < cats.length; x++) {
    for (let y = x + 1; y < cats.length; y++) {
      const pa = a.get(cats[x]), pb = a.get(cats[y]);
      const D = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
      minD = Math.min(minD, D);
      mass += pops.get(cats[x]) * pops.get(cats[y]) * Math.exp(-((D * wfrac) ** 2) / (2 * s2floor));
    }
  }
  return { mass, minD, anchors: a };
}

const SHIPPED_SEED = 2001; // PROJECTION_SEED_BASE + 0 ('group' is group index 0)
const shipped = collisionMass(SHIPPED_SEED);
console.log(`shipped seed ${SHIPPED_SEED}: collision mass ${shipped.mass.toFixed(0)}, min anchor dist ${shipped.minD.toFixed(2)}`);
let best = { seed: SHIPPED_SEED, ...shipped };
for (let t = 1; t <= 50; t++) {
  const seed = SHIPPED_SEED + 10000 + t * 977;
  const r = collisionMass(seed);
  if (r.mass < best.mass) best = { seed, ...r };
}
console.log(`best of 50 candidates: seed ${best.seed}, collision mass ${best.mass.toFixed(0)} (${(best.mass / shipped.mass * 100).toFixed(0)}% of shipped), min anchor dist ${best.minD.toFixed(2)}`);

for (const n of nodeArray) n.projections.group = best.anchors.get(n.group).slice();
evalConfig('default group:3, reseeded group matrix', { group: 3 }, 0, null, true);
