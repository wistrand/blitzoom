// false-neighbor-seed-sweep.mjs — Does the anchor-collision mechanism + the
// seed-search fix generalize beyond Pokemon? For each property dataset: measure
// FNR under default-style weights with (a) the shipped 'group' projection seed
// and (b) the best of 50 candidate seeds ranked by analytic collision mass.
// Controls: datasets with already-low FNR should not get worse.
// Results and interpretation: agent_docs/RESEARCH-false-neighbor-validation.md
//
// Run:  node scripts/false-neighbor-seed-sweep.mjs   (~2 min)
//   or  deno run --allow-read scripts/false-neighbor-seed-sweep.mjs

import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const { runPipeline, tokenizeLabel, tokenizeNumeric, degreeBucket } = await import(`${REPO}/docs/blitzoom-pipeline.js`);
const { MINHASH_K, computeMinHash, computeEffectiveWeights, buildGaussianProjection, projectWith } =
  await import(`${REPO}/docs/blitzoom-algo.js`);

const K = MINHASH_K;
const TAU = 0.10;
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
function jac(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const [sm, bg] = a.size <= b.size ? [a, b] : [b, a];
  for (const t of sm) if (bg.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function sweep(name, edgesFile, nodesFile, maxPairs = 500000) {
  const g = runPipeline(readData(`${REPO}/docs/data/${edgesFile}`), nodesFile ? readData(`${REPO}/docs/data/${nodesFile}`) : null);
  const { nodeArray, adjGroups, groupNames, numericBins, projBuf } = g;
  const N = nodeArray.length, G = groupNames.length;
  const toks = nodeArray.map((n, i) => groupNames.map(gn => new Set(tokensForGroup(n, adjGroups[i], gn, numericBins))));
  const { effW, totalW } = computeEffectiveWeights(groupNames, { group: 3 });
  const wg = groupNames.map(gn => effW[gn] / totalW);
  const wfrac = effW.group / totalW;

  // Anchor geometry for the 'group' categories
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

  // FNR under a given group-anchor map (null = shipped projections)
  function measureFNR(anchorMap) {
    const px = new Float64Array(N), py = new Float64Array(N);
    const groupIdx = groupNames.indexOf('group');
    for (let i = 0; i < N; i++) {
      let x = 0, y = 0;
      for (let gi = 0; gi < G; gi++) {
        let ax, ay;
        if (gi === groupIdx && anchorMap) { const a = anchorMap.get(nodeArray[i].group); ax = a[0]; ay = a[1]; }
        else { ax = projBuf[i * G * 2 + gi * 2]; ay = projBuf[i * G * 2 + gi * 2 + 1]; }
        x += ax * wg[gi]; y += ay * wg[gi];
      }
      px[i] = x; py[i] = y;
    }
    let mx = 0, my = 0;
    for (let i = 0; i < N; i++) { mx += px[i]; my += py[i]; }
    mx /= N; my /= N;
    let vv = 0;
    for (let i = 0; i < N; i++) vv += (px[i] - mx) ** 2 + (py[i] - my) ** 2;
    const sigma = Math.sqrt(vv / (2 * N));
    const eps2 = (0.1 * sigma) ** 2;

    const totalPairs = N * (N - 1) / 2;
    const stride = totalPairs <= maxPairs ? 1 : Math.ceil(totalPairs / maxPairs);
    let inEps = 0, falseIn = 0, falseTotal = 0, sampled = 0, pi = -1;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        pi++;
        if (stride > 1 && pi % stride !== 0) continue;
        sampled++;
        let J = 0;
        for (let gi = 0; gi < G; gi++) J += wg[gi] * jac(toks[i][gi], toks[j][gi]);
        const isFalse = J < TAU;
        if (isFalse) falseTotal++;
        const dx = px[i] - px[j], dy = py[i] - py[j];
        if (dx * dx + dy * dy <= eps2) { inEps++; if (isFalse) falseIn++; }
      }
    }
    return { fnr: inEps ? falseIn / inEps : 0, inEps, falseIn, base: falseTotal / sampled, sigma };
  }

  const before = measureFNR(null);
  const after = measureFNR(best.anchors);
  const massRatio = shipped.mass > 0 ? best.mass / shipped.mass : 1;
  console.log(`${name.padEnd(18)} C=${String(cats.length).padStart(3)}  base=${(100 * before.base).toFixed(0).padStart(3)}%` +
    `  mass ${shipped.mass.toFixed(0).padStart(8)} → ${best.mass.toFixed(0).padStart(8)} (${(100 * massRatio).toFixed(0).padStart(3)}%)` +
    `  FNR ${(100 * before.fnr).toFixed(1).padStart(5)}% → ${(100 * after.fnr).toFixed(1).padStart(5)}%` +
    `  (${before.falseIn}/${before.inEps} → ${after.falseIn}/${after.inEps})  σ ${before.sigma.toFixed(2)} → ${after.sigma.toFixed(2)}`);
}

console.log('dataset             C(group)  base  collision mass shipped→best      FNR shipped→reseeded            σ');
sweep('Pokemon', 'pokemon.edges', 'pokemon.nodes');
sweep('Porsche', 'porsche.edges', 'porsche.nodes');
sweep('Marvel', 'marvel.edges', 'marvel.nodes');
sweep('Epstein', 'epstein.edges', 'epstein.nodes');
sweep('Synth Packages', 'synth-packages.edges', 'synth-packages.nodes');
sweep('BlitZoom Source', 'blitzoom-source.edges', 'blitzoom-source.nodes');
sweep('MITRE ATT&CK', 'mitre-attack.edges', 'mitre-attack.nodes', 400000);
