// Golden regression values from the false-neighbor validation study
// (agent_docs/RESEARCH-false-neighbor-validation.md). Pins the study's
// headline numbers against the live pipeline: Pokemon's default-layout
// false-neighbor rate (18.3% = 317/1731 at ε = 0.1σ) and the best-of-50
// reseed for the 'group' projection matrix (seed 37403). Fails if
// tokenization, MinHash, projection seeding, blend weights, or the Gaussian
// matrix construction change behavior.
//
// Run: deno test --no-check --allow-read tests/false_neighbor_golden_test.ts

import { assert, assertEquals, assertAlmostEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { runPipeline, tokenizeLabel, tokenizeNumeric, degreeBucket } from '../docs/blitzoom-pipeline.js';
import {
  MINHASH_K, computeMinHash, computeEffectiveWeights, buildGaussianProjection, projectWith,
} from '../docs/blitzoom-algo.js';

const K = MINHASH_K;
const TAU = 0.10;
const SHIPPED_SEED = 2001; // PROJECTION_SEED_BASE + 0 — 'group' is group index 0

// deno-lint-ignore no-explicit-any
function tokensForGroup(node: any, nbrGroups: string[], gname: string, numericBins: any): string[] {
  const buf = new Array(64);
  if (gname === 'group') return ['group:' + node.group];
  if (gname === 'label') { const e = tokenizeLabel(node.label, node.id, buf, 0); return buf.slice(0, e); }
  if (gname === 'structure') return ['deg:' + degreeBucket(node.degree), 'leaf:' + (node.degree === 0)];
  if (gname === 'neighbors') return nbrGroups.length ? nbrGroups.map(x => 'ngroup:' + x) : ['ngroup:isolated'];
  if (gname === 'edgetype') return node.edgeTypes?.length ? node.edgeTypes.map((t: string) => 'etype:' + t) : ['etype:none'];
  const val = node.extraProps?.[gname];
  const e = tokenizeNumeric(gname, val, numericBins[gname], buf, 0);
  return buf.slice(0, e);
}

function jac(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const [sm, bg] = a.size <= b.size ? [a, b] : [b, a];
  for (const t of sm) if (bg.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

const g = runPipeline(
  await Deno.readTextFile('docs/data/pokemon.edges'),
  await Deno.readTextFile('docs/data/pokemon.nodes'));
const { nodeArray, adjGroups, groupNames, numericBins, projBuf } = g;
const N = nodeArray.length, G = groupNames.length;
const { effW, totalW } = computeEffectiveWeights(groupNames, { group: 3 });
const wg = groupNames.map((gn: string) => effW[gn] / totalW);

Deno.test('golden: Pokemon group-matrix seed search (study Part 2/3)', () => {
  assertEquals(N, 959);
  const pops = new Map<string, number>();
  for (const n of nodeArray) pops.set(n.group, (pops.get(n.group) || 0) + 1);
  const cats = [...pops.keys()];
  assertEquals(cats.length, 18); // 18 Pokemon types
  const catSigs = new Map(cats.map(c => [c, computeMinHash(['group:' + c], 1)]));
  const wfrac = effW.group / totalW;
  let s2floor = 0;
  for (const gn of groupNames) if (gn !== 'group') s2floor += (effW[gn] / totalW) ** 2 * 2 * K;

  const collisionMass = (seed: number): number => {
    const R = buildGaussianProjection(seed, K);
    const a = cats.map(c => projectWith(catSigs.get(c), R));
    let mass = 0;
    for (let x = 0; x < cats.length; x++) {
      for (let y = x + 1; y < cats.length; y++) {
        const D = Math.hypot(a[x][0] - a[y][0], a[x][1] - a[y][1]);
        mass += pops.get(cats[x])! * pops.get(cats[y])! * Math.exp(-((D * wfrac) ** 2) / (2 * s2floor));
      }
    }
    return mass;
  };

  const shippedMass = collisionMass(SHIPPED_SEED);
  let bestSeed = SHIPPED_SEED, bestMass = shippedMass;
  for (let t = 1; t <= 50; t++) {
    const seed = SHIPPED_SEED + 10000 + t * 977;
    const m = collisionMass(seed);
    if (m < bestMass) { bestMass = m; bestSeed = seed; }
  }

  assertAlmostEquals(shippedMass, 55469.301, 0.01);
  assertEquals(bestSeed, 37403);
  assertAlmostEquals(bestMass, 20808.670, 0.01);
});

Deno.test('golden: Pokemon false-neighbor rate 18.3% at ε = 0.1σ (study Part 1/2)', () => {
  // Blend positions under default-style weights (group: 3, rest floor), α = 0
  const px = new Float64Array(N), py = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let x = 0, y = 0;
    for (let gi = 0; gi < G; gi++) {
      x += projBuf[i * G * 2 + gi * 2] * wg[gi];
      y += projBuf[i * G * 2 + gi * 2 + 1] * wg[gi];
    }
    px[i] = x; py[i] = y;
  }
  let mx = 0, my = 0;
  for (let i = 0; i < N; i++) { mx += px[i]; my += py[i]; }
  mx /= N; my /= N;
  let vv = 0;
  for (let i = 0; i < N; i++) vv += (px[i] - mx) ** 2 + (py[i] - my) ** 2;
  const sigma = Math.sqrt(vv / (2 * N));
  assertAlmostEquals(sigma, 4.4341, 0.001); // layout per-axis σ

  const toks = nodeArray.map((n: unknown, i: number) =>
    groupNames.map((gn: string) => new Set(tokensForGroup(n, adjGroups[i], gn, numericBins))));
  const eps2 = (0.1 * sigma) ** 2;
  let inEps = 0, falseIn = 0;
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = px[i] - px[j], dy = py[i] - py[j];
      if (dx * dx + dy * dy > eps2) continue;
      inEps++;
      let J = 0;
      for (let gi = 0; gi < G; gi++) J += wg[gi] * jac(toks[i][gi], toks[j][gi]);
      if (J < TAU) falseIn++;
    }
  }

  assertEquals(inEps, 1731);
  assertEquals(falseIn, 317); // 317/1731 = 18.3%
  assert(falseIn / inEps > 0.18 && falseIn / inEps < 0.19);
});
