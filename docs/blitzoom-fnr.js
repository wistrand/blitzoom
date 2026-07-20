// blitzoom-fnr.js — Semi-analytic false-neighbor rate estimator.
//
// Theory (validated in agent_docs/RESEARCH-false-neighbor-validation.md):
// per property group, z-scored MinHash signatures u,v with correlation
// r = ⟨u,v⟩/k give a projected pair difference that is 2D Gaussian with
// per-coordinate variance 2k(1−r) averaged over projection randomness. The
// blended variance is s² = Σ_g (w_g/W)²·2k(1−r_g), and the collision kernel
// P(d ≤ ε) = 1 − exp(−ε²/(2s²)). Integrating the kernel against the sampled
// pairwise-similarity distribution yields a predicted false-neighbor rate:
// FNR(ε) = Σ_{dissimilar} P / Σ_{all} P, with "dissimilar" = weighted token
// Jaccard < τ. Validated within ~2.5pp on 6 of 8 datasets; over-predicts when
// wrong (conservative), including under reseeded matrices (Part 4).
//
// The estimator is seed-blind and α-blind: it describes the α = 0 property
// layout under a typical projection draw. Positions from topology smoothing
// (high α) are out of scope.
//
// Layer 2 module (imports algo + pipeline). blitzoom-utils.js (layer 1)
// cannot import this — the tuner receives the estimate through the
// `opts.fnrPenalty` callback instead.

import { MINHASH_K, computeMinHash, computeEffectiveWeights } from './blitzoom-algo.js';
import { tokenizeLabel, tokenizeNumeric, degreeBucket } from './blitzoom-pipeline.js';

const K = MINHASH_K;

// Token reconstruction — mirrors projectNode's per-group tokenization exactly
// (same mirror as the validation scripts; the sanity check there reproduces
// the shipped projBuf with zero error).
function tokensForGroup(node, neighborGroups, gname, numericBins) {
  const buf = new Array(64);
  if (gname === 'group') return ['group:' + node.group];
  if (gname === 'label') { const e = tokenizeLabel(node.label, node.id, buf, 0); return buf.slice(0, e); }
  if (gname === 'structure') return ['deg:' + degreeBucket(node.degree), 'leaf:' + (node.degree === 0)];
  if (gname === 'neighbors') return neighborGroups.length ? neighborGroups.map(x => 'ngroup:' + x) : ['ngroup:isolated'];
  if (gname === 'edgetype') return node.edgeTypes?.length ? node.edgeTypes.map(t => 'etype:' + t) : ['etype:none'];
  const val = node.extraProps && node.extraProps[gname];
  const e = tokenizeNumeric(gname, val, numericBins[gname], buf, 0);
  return buf.slice(0, e); // may be [] (empty/undefined → no tokens)
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

/**
 * Build a false-neighbor estimator from a deterministic node subsample.
 * The expensive part (signatures + per-pair variance/Jaccard tables) runs
 * once here; `estimate(strengths)` afterwards is O(pairs × groups) — cheap
 * enough to call per candidate config inside auto-tune.
 *
 * @param {Array} nodes - pipeline/canvas nodes ({ id, group, label, degree, edgeTypes, extraProps })
 * @param {object} opts
 * @param {string[]} opts.groupNames
 * @param {object}   [opts.numericBins={}]
 * @param {object}   [opts.adjList]        - { id: [neighborId] } for the 'neighbors' group
 * @param {object}   [opts.nodeIndexFull]  - { id: node } for neighbor lookup
 * @param {number}   [opts.maxSampleNodes=160] - ~12.7K pairs at the default
 * @param {object}   [opts.refStrengths]   - strengths defining the FIXED
 *        dissimilarity reference (weighted Jaccard < τ). Without it, each
 *        estimate() classifies pairs under its own candidate weights — fine
 *        for a diagnostic of one config, but WRONG for comparing configs: a
 *        config can hide mixing by down-weighting the group it mixes (the
 *        single-group-purity failure in Jaccard form). Auto-tune penalties
 *        must pass a reference (see defaultReferenceStrengths).
 * @returns {{ estimate: function, sampleSize: number, pairs: number }}
 */
export function createFNREstimator(nodes, opts) {
  const groupNames = opts.groupNames;
  const numericBins = opts.numericBins || {};
  const adjList = opts.adjList || null;
  const nodeIndexFull = opts.nodeIndexFull || null;
  const maxSample = opts.maxSampleNodes ?? 160;
  const G = groupNames.length;

  // Deterministic node subsample
  const N = nodes.length;
  const stride = Math.max(1, Math.ceil(N / maxSample));
  const sample = [];
  for (let i = 0; i < N; i += stride) sample.push(nodes[i]);
  const M = sample.length;

  // Per sample node per group: z-scored signature (null = no tokens) + token set
  const sigs = new Array(M), toks = new Array(M);
  for (let i = 0; i < M; i++) {
    const n = sample[i];
    const neighborGroups = adjList && nodeIndexFull
      ? (adjList[n.id] || []).map(nid => nodeIndexFull[nid]?.group || 'unknown')
      : [];
    sigs[i] = new Array(G); toks[i] = new Array(G);
    for (let gi = 0; gi < G; gi++) {
      const tk = tokensForGroup(n, neighborGroups, groupNames[gi], numericBins);
      toks[i][gi] = new Set(tk);
      sigs[i][gi] = tk.length === 0 ? null : zscore(computeMinHash(tk, tk.length));
    }
  }

  // Per-pair per-group tables: varC = per-coordinate variance contribution
  // before weighting (2k(1−r), or k one-empty, 0 both-empty), jac = exact
  // token Jaccard.
  const P = M * (M - 1) / 2;
  const varC = new Float64Array(P * G);
  const jac = new Float64Array(P * G);
  let p = 0;
  for (let i = 0; i < M; i++) {
    for (let j = i + 1; j < M; j++, p++) {
      for (let gi = 0; gi < G; gi++) {
        const u = sigs[i][gi], v = sigs[j][gi];
        let vc;
        if (u === null && v === null) vc = 0;
        else if (u === null || v === null) vc = K;
        else {
          let dot = 0;
          for (let q = 0; q < K; q++) dot += u[q] * v[q];
          vc = Math.max(0, 2 * K * (1 - dot / K));
        }
        varC[p * G + gi] = vc;
        jac[p * G + gi] = jaccard(toks[i][gi], toks[j][gi]);
      }
    }
  }

  // Optional fixed dissimilarity reference: weighted Jaccard per pair under
  // refStrengths, computed once. estimate() then classifies "false" against
  // this constant regardless of the candidate weights.
  let refJw = null;
  if (opts.refStrengths) {
    const { effW, totalW } = computeEffectiveWeights(groupNames, opts.refStrengths);
    const rw = new Float64Array(G);
    for (let gi = 0; gi < G; gi++) rw[gi] = effW[groupNames[gi]] / totalW;
    refJw = new Float64Array(P);
    for (let q = 0; q < P; q++) {
      let s = 0;
      for (let gi = 0; gi < G; gi++) s += rw[gi] * jac[q * G + gi];
      refJw[q] = s;
    }
  }

  /**
   * Predicted false-neighbor rate for a strengths config.
   * @param {object} strengths - { groupName: strength }
   * @param {object} [o] - { epsFrac=0.1 (of predicted layout σ), tau=0.10 }
   * @returns {{ fnr: number|null, base: number, vacuous: boolean, sigma: number }}
   *   fnr is null when vacuous (no sampled pair is dissimilar at τ — the
   *   threshold carries no signal, typically floor-weighted groups with
   *   universally shared baseline tokens).
   */
  const estimate = (strengths, o = {}) => {
    const epsFrac = o.epsFrac ?? 0.1;
    const tau = o.tau ?? 0.10;
    const { effW, totalW } = computeEffectiveWeights(groupNames, strengths);
    const wg = new Float64Array(G);
    for (let gi = 0; gi < G; gi++) wg[gi] = effW[groupNames[gi]] / totalW;

    // Pass 1: pair variances → predicted layout σ (E[s²] = 2σ² per coordinate)
    const s2 = new Float64Array(P);
    let s2sum = 0;
    for (let q = 0; q < P; q++) {
      let s = 0;
      for (let gi = 0; gi < G; gi++) { const w = wg[gi]; s += w * w * varC[q * G + gi]; }
      s2[q] = s; s2sum += s;
    }
    const sigma = Math.sqrt(s2sum / P / 2) || 1;
    const eps2 = (epsFrac * sigma) ** 2;

    // Pass 2: kernel-weighted collision mass, split by weighted-Jaccard τ
    let predIn = 0, predFalse = 0, falseCount = 0;
    for (let q = 0; q < P; q++) {
      let Jw;
      if (refJw) Jw = refJw[q];
      else {
        Jw = 0;
        for (let gi = 0; gi < G; gi++) Jw += wg[gi] * jac[q * G + gi];
      }
      const pk = s2[q] > 1e-12 ? 1 - Math.exp(-eps2 / (2 * s2[q])) : 1;
      predIn += pk;
      if (Jw < tau) { falseCount++; predFalse += pk; }
    }
    const vacuous = falseCount === 0;
    return {
      fnr: vacuous ? null : (predIn > 0 ? predFalse / predIn : 0),
      base: falseCount / P,
      vacuous,
      sigma,
    };
  };

  return { estimate, sampleSize: M, pairs: P };
}

/**
 * The dataset's default-style strengths — the FIXED dissimilarity reference
 * for config comparison. Mirrors the factory's default-strength rule
 * (blitzoom-factory.js _finalize): `group` at 3 when it has >1 distinct
 * value, else the first categorical extra property with 2-50 distinct values.
 * The reference anchors "false neighbor" to the dataset's primary
 * categorization, so a candidate config cannot hide mixing by down-weighting
 * the group it mixes.
 */
export function defaultReferenceStrengths(nodes, groupNames) {
  const groupVals = new Set();
  for (const n of nodes) { groupVals.add(n.group); if (groupVals.size > 1) break; }
  if (groupVals.size > 1) return { group: 3 };
  for (const g of groupNames) {
    if (g === 'group' || g === 'label' || g === 'structure' || g === 'neighbors' || g === 'edgetype') continue;
    const vals = new Set();
    for (const n of nodes) {
      vals.add(n.extraProps && n.extraProps[g]);
      if (vals.size > 50) break;
    }
    if (vals.size >= 2 && vals.size <= 50) return { [g]: 3 };
  }
  return { group: 3 };
}