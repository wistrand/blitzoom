// blitzoom-algo.js — Pure algorithm functions and constants.
// No DOM, no canvas, no state. Shared by main thread and conceptually by worker.

// Find key with highest count in an object {key: count} — O(k) instead of sort O(k log k)
// Tie-break: first key in insertion order (stable across runs for same input)
export function maxCountKey(counts) {
  let bestKey = '', bestCount = -1;
  for (const k in counts) {
    if (counts[k] > bestCount) { bestCount = counts[k]; bestKey = k; }
  }
  return bestKey;
}

export const MINHASH_K = 128;
export const LARGE_PRIME = 2147483647;
export const GRID_BITS = 16;
export const GRID_SIZE = 1 << GRID_BITS; // 65536
export const ZOOM_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const RAW_LEVEL = 14; // index into LEVEL_LABELS for the raw (individual node) level
export const LEVEL_LABELS = ['L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12','L13','L14','RAW'];
export const STRENGTH_FLOOR_RATIO = 0.10; // adaptive floor: 10% of max strength — prevents low-entropy collapse
export const STRENGTH_FLOOR_MIN = 0.10;   // absolute minimum floor — gives equal blend when all strengths are zero
export const PROJECTION_SEED_BASE = 2001; // seed offset for per-group Gaussian projection matrices


// ─── PRNG ────────────────────────────────────────────────────────────────────

export function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);
export const HASH_PARAMS_A = new Int32Array(MINHASH_K);
export const HASH_PARAMS_B = new Int32Array(MINHASH_K);
for (let i = 0; i < MINHASH_K; i++) {
  HASH_PARAMS_A[i] = Math.floor(rng() * (LARGE_PRIME - 1)) + 1;
  HASH_PARAMS_B[i] = Math.floor(rng() * (LARGE_PRIME - 1));
}

// ─── MinHash (GC-optimized, 32-bit safe) ─────────────────────────────────────

// #5a: Use unsigned right shift to ensure non-negative result without Math.abs edge case
export function hashToken(token) {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (Math.imul(31, h) + token.charCodeAt(i)) | 0;
  }
  return h >>> 0; // unsigned 32-bit, always non-negative
}

// Reusable signature buffer — avoids allocating per call.
// Stores integer MinHash values in [0, p). Sentinel: -1 (empty token set).
// Callers must read/copy _sig before the next call to computeMinHashInto.
export const _sig = new Int32Array(MINHASH_K);

// #5b: True universal hash: (a * tv + b) mod p, computed without overflow.
// a < 2^31, tv < 2^32. Split tv into 16-bit halves so each partial product
// stays under 2^47, well within the 2^53 safe integer range.
// Mersenne fast-mod: p = 2^31 - 1 admits x mod p = (x & p) + (x >>> 31),
// followed by a conditional subtract if result >= p.
function mersMod(x) {
  x = (x & LARGE_PRIME) + ((x / 0x80000000) | 0); // x >>> 31 via float division for values > 2^32
  return x >= LARGE_PRIME ? x - LARGE_PRIME : x;
}
function hashSlot(a, tv, b) {
  const tvHi = (tv >>> 16), tvLo = tv & 0xFFFF;
  const hi = mersMod(a * tvHi);
  return mersMod(hi * 0x10000 + a * tvLo + b);
}

// #6: Compute MinHash into the reusable _sig buffer.
// Uses OPH+DOPH (Li et al. 2012, Shrivastava & Li 2014) when tokenCount >= 12,
// falls back to standard k-hash MinHash for small sets where OPH's densification
// overhead exceeds the savings from fewer hashes.
// If tokenCount is 0, fills with -1 (sentinel for empty token set).

const _occupied = new Uint8Array(MINHASH_K); // reusable for OPH

export function computeMinHashInto(tokens, tokenCount) {
  if (tokenCount === 0) {
    for (let i = 0; i < MINHASH_K; i++) _sig[i] = -1;
    return;
  }

  if (tokenCount < 12) {
    // Standard MinHash: k hash evaluations per token. Better for small sets.
    for (let i = 0; i < MINHASH_K; i++) _sig[i] = LARGE_PRIME;
    for (let t = 0; t < tokenCount; t++) {
      const tv = hashToken(tokens[t]);
      for (let j = 0; j < MINHASH_K; j++) {
        const hv = hashSlot(HASH_PARAMS_A[j], tv, HASH_PARAMS_B[j]);
        if (hv < _sig[j]) _sig[j] = hv;
      }
    }
    return;
  }

  // OPH: single hash per token, then densify empty bins.
  for (let i = 0; i < MINHASH_K; i++) { _sig[i] = LARGE_PRIME; _occupied[i] = 0; }
  for (let t = 0; t < tokenCount; t++) {
    const tv = hashToken(tokens[t]);
    const hv = hashSlot(HASH_PARAMS_A[0], tv, HASH_PARAMS_B[0]);
    const bin = hv % MINHASH_K;
    const val = (hv / MINHASH_K) | 0;
    if (val < _sig[bin]) { _sig[bin] = val; _occupied[bin] = 1; }
  }
  for (let i = 0; i < MINHASH_K; i++) {
    if (_occupied[i]) continue;
    let donor = ((i * 2654435761) >>> 0) % MINHASH_K;
    let attempts = 0;
    while (!_occupied[donor] && attempts < MINHASH_K) {
      donor = ((donor * 2654435761 + 1) >>> 0) % MINHASH_K;
      attempts++;
    }
    if (_occupied[donor]) _sig[i] = _sig[donor];
  }
}

// Allocating version — returns a new Int32Array copy of the signature.
export function computeMinHash(tokens, tokenCount) {
  if (tokenCount === undefined) tokenCount = tokens.length;
  computeMinHashInto(tokens, tokenCount);
  const result = new Int32Array(MINHASH_K);
  result.set(_sig);
  return result;
}

export function jaccardEstimate(sigA, sigB) {
  // -1 sentinel: two empty sigs are identical; empty vs non-empty are disjoint
  const aEmpty = sigA[0] === -1, bEmpty = sigB[0] === -1;
  if (aEmpty || bEmpty) return (aEmpty && bEmpty) ? 1 : 0;
  let matches = 0;
  for (let i = 0; i < MINHASH_K; i++) if (sigA[i] === sigB[i]) matches++;
  return matches / MINHASH_K;
}

// ─── Gaussian projection ─────────────────────────────────────────────────────

// Seed for a group's projection matrix: the per-group override if present,
// else PROJECTION_SEED_BASE + group index. Overrides come from the seed
// search (collision-mass minimization over candidate seeds — see
// agent_docs/RESEARCH-false-neighbor-validation.md); they must flow to every
// matrix build site AND to normQuantize/radialQuantize, whose σ is derived
// from the same seeds.
export function projectionSeedForGroup(gi, groupName, projSeeds) {
  const s = projSeeds && projSeeds[groupName];
  return (s !== undefined && s !== null) ? s : PROJECTION_SEED_BASE + gi;
}

// Always produces a 2×cols matrix (128D → 2D projection).
export function buildGaussianProjection(seed, cols) {
  const u = mulberry32(seed);
  const R = [new Float64Array(cols), new Float64Array(cols)];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < cols; j += 2) {
      const u1 = Math.max(1e-10, u());
      const u2 = u();
      const mag = Math.sqrt(-2 * Math.log(u1));
      R[i][j]     = mag * Math.cos(2 * Math.PI * u2);
      if (j+1 < cols) R[i][j+1] = mag * Math.sin(2 * Math.PI * u2);
    }
  }
  return R;
}

// #6: Write projection directly into output buffer at offset.
// If signature is -1 (empty token sentinel), writes [0,0] (neutral).
export function projectInto(sig, ROT, buf, offset) {
  if (sig[0] === -1) {
    buf[offset] = 0;
    buf[offset + 1] = 0;
    return;
  }
  let mean = 0;
  for (let i = 0; i < MINHASH_K; i++) mean += sig[i];
  mean /= MINHASH_K;
  let variance = 0;
  for (let i = 0; i < MINHASH_K; i++) { const d = sig[i] - mean; variance += d * d; }
  const std = Math.sqrt(variance / MINHASH_K) || 1;
  const R0 = ROT[0], R1 = ROT[1];
  let px = 0, py = 0;
  for (let i = 0; i < MINHASH_K; i++) {
    const v = (sig[i] - mean) / std;
    px += v * R0[i];
    py += v * R1[i];
  }
  buf[offset] = px;
  buf[offset + 1] = py;
}

// Convenience: allocating version that returns [px, py].
export function projectWith(sig, ROT) {
  const buf = [0, 0];
  projectInto(sig, ROT, buf, 0);
  return buf;
}

// ─── Grid & zoom ─────────────────────────────────────────────────────────────

export function cellIdAtLevel(gx, gy, level) {
  const shift = GRID_BITS - level;
  const cx = gx >> shift;
  const cy = gy >> shift;
  return (cx << level) | cy;
}

// ─── Color generation ────────────────────────────────────────────────────────

// ─── Unified blend ───────────────────────────────────────────────────────────

// #2: Deterministic tie-break by node ID in rank quantization
export function normalizeAndQuantize(nodes) {
  const n = nodes.length;
  const orderX = nodes.map((nd, i) => ({i, v: nd.px, id: nd.id}))
    .sort((a,b) => a.v - b.v || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (let r = 0; r < n; r++) {
    nodes[orderX[r].i].gx = Math.min(GRID_SIZE - 1, Math.floor(r / n * GRID_SIZE));
    nodes[orderX[r].i].px = (r / n) * 2 - 1;
  }
  const orderY = nodes.map((nd, i) => ({i, v: nd.py, id: nd.id}))
    .sort((a,b) => a.v - b.v || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (let r = 0; r < n; r++) {
    nodes[orderY[r].i].gy = Math.min(GRID_SIZE - 1, Math.floor(r / n * GRID_SIZE));
    nodes[orderY[r].i].py = (r / n) * 2 - 1;
  }
}

// Gaussian quantization — precomputed Φ(z) lookup table.
// Maps z ∈ [-4, 4] → grid coord via table index. No erf at runtime.
const PHI_TABLE_SIZE = 8192;
const PHI_TABLE = new Float64Array(PHI_TABLE_SIZE + 1);
{
  // Abramowitz & Stegun 7.1.26 erf approximation — max error 5e-4
  const erfApprox = (x) => {
    const a = 0.278393, b = 0.230389, c = 0.000972, d = 0.078108;
    const ax = Math.abs(x);
    const t = 1 / (1 + a*ax + b*ax*ax + c*ax*ax*ax + d*ax*ax*ax*ax);
    const y = 1 - t*t*t*t;
    return x >= 0 ? y : -y;
  };
  for (let i = 0; i <= PHI_TABLE_SIZE; i++) {
    const z = (i / PHI_TABLE_SIZE) * 8 - 4; // [-4, 4]
    PHI_TABLE[i] = 0.5 * (1 + erfApprox(z * Math.SQRT1_2));
  }
}

function phiLookup(z) {
  // z clamped to [-4,4] → table index with linear interpolation
  const t = (z + 4) * (PHI_TABLE_SIZE / 8); // [0, PHI_TABLE_SIZE]
  const i = t | 0; // floor
  if (i >= PHI_TABLE_SIZE) return PHI_TABLE[PHI_TABLE_SIZE];
  if (i < 0) return PHI_TABLE[0];
  const f = t - i;
  return PHI_TABLE[i] + f * (PHI_TABLE[i + 1] - PHI_TABLE[i]);
}

// stats: mutable object for fixed Gaussian boundaries per the spec.
// First call computes μ,σ from data and stores them in stats.
// Subsequent calls reuse stored values — boundaries don't shift on
// strength/alpha changes. Reset stats to {} on new data load.
export function gaussianQuantize(nodes, stats) {
  const n = nodes.length;
  if (n === 0) return;

  let mx, my, sx, sy;
  if (stats && stats._initialized) {
    mx = stats.mx; my = stats.my; sx = stats.sx; sy = stats.sy;
  } else {
    let mxS = 0, myS = 0;
    for (let i = 0; i < n; i++) { mxS += nodes[i].px; myS += nodes[i].py; }
    mx = mxS / n; my = myS / n;
    let vxS = 0, vyS = 0;
    for (let i = 0; i < n; i++) {
      const dx = nodes[i].px - mx, dy = nodes[i].py - my;
      vxS += dx * dx; vyS += dy * dy;
    }
    sx = Math.sqrt(vxS / n) || 1; sy = Math.sqrt(vyS / n) || 1;
    if (stats) { stats.mx = mx; stats.my = my; stats.sx = sx; stats.sy = sy; stats._initialized = true; }
  }

  for (let i = 0; i < n; i++) {
    const ux = phiLookup((nodes[i].px - mx) / sx);
    const uy = phiLookup((nodes[i].py - my) / sy);
    nodes[i].gx = Math.min(GRID_SIZE - 1, Math.floor(ux * GRID_SIZE));
    nodes[i].gy = Math.min(GRID_SIZE - 1, Math.floor(uy * GRID_SIZE));
    nodes[i].px = ux * 2 - 1;
    nodes[i].py = uy * 2 - 1;
  }
}

// ─── Polar (radial) quantization ────────────────────────────────────────────
// Maps the 2D continuous (px, py) distribution onto an inscribed disk inside
// the uint16 grid, instead of folding x and y onto the grid via two
// independent 1D CDFs (the way gaussianQuantize/normQuantize do).
//
// Why: separable per-axis quantization gives nodes a non-circular
// distribution in grid space, with pile-ups at the four corners and
// asymmetric "breathing" when bearings rotate (a continuous-space rotation
// is not a grid-space rotation under separable Φ). Polar quant maps the
// radius and angle jointly, so a continuous-space rotation IS a grid-space
// rotation around the origin. Bearing dragging feels mechanical instead of
// warpy, and outliers form a smooth ring around the disk's edge instead of
// jamming into corners.
//
// The radial scale comes from projection matrix norms — same trick
// normQuantize uses for its per-axis scales. This makes polar mode:
//   - **Insertion-stable**: addNodes/removeNodes/updateNodes never shifts
//     existing nodes' (gx, gy). The radial scale depends only on (effW,
//     projection seeds), not on the current node distribution. Same
//     guarantee as `quantMode='norm'`, just radial.
//   - **Centroid-free**: origin = (0, 0) by convention, matching
//     normQuantize. The blend's output is mean-zero by construction
//     (Gaussian projection matrices are zero-mean), so no centroid scan
//     is needed.
//   - **Compatible with the incremental preset**: stream nodes in batches,
//     drag bearings, never see drift.
//
// Method: Rayleigh CDF on the radius. For an isotropic 2D Gaussian with
// per-axis variance σ², the radial distance r ~ Rayleigh(σ), with CDF
// `1 - exp(-r² / (2σ²))`. Compute σ_x² and σ_y² from projection norms
// (varX + varY = E[r²] = 2σ² under isotropy), apply the CDF to get a
// percentile in [0, 1), then map to disk radius via sqrt for area-uniform
// spread on the unit disk. The four grid corners are unused; at the grid
// scale (~4B cells) the 21% loss is invisible.
export function radialQuantize(nodes, groupNames, effW, totalW, projSeeds = null) {
  // Compute σ_x² and σ_y² from projection matrix norms (same as
  // normQuantize), then sum: 2σ²_radial = σ_x² + σ_y² for isotropic blend.
  let varX = 0, varY = 0;
  for (let gi = 0; gi < groupNames.length; gi++) {
    const norms = projNormSq(projectionSeedForGroup(gi, groupNames[gi], projSeeds));
    const w = effW[groupNames[gi]];
    varX += w * w * norms[0];
    varY += w * w * norms[1];
  }
  const twoSigmaSq = (varX + varY) / (totalW * totalW) || 1;

  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    const dx = nodes[i].px;  // origin = (0, 0); no centroid subtraction
    const dy = nodes[i].py;
    const r2 = dx * dx + dy * dy;
    // Rayleigh CDF: u = 1 - exp(-r²/(2σ²)) ∈ [0, 1)
    const u = 1 - Math.exp(-r2 / twoSigmaSq);
    // Area-uniform mapping: r_disk = sqrt(u). Reuse (dx, dy) direction
    // instead of atan2/cos/sin: scale = r_disk / r.
    let px, py;
    if (r2 > 1e-30) {
      const r = Math.sqrt(r2);
      const scale = Math.sqrt(u) / r;
      px = dx * scale;
      py = dy * scale;
    } else {
      px = 0; py = 0;
    }
    // Map [-1, 1] disk coordinates → [0, GRID_SIZE) grid coordinates.
    nodes[i].gx = Math.min(GRID_SIZE - 1, Math.floor((px * 0.5 + 0.5) * GRID_SIZE));
    nodes[i].gy = Math.min(GRID_SIZE - 1, Math.floor((py * 0.5 + 0.5) * GRID_SIZE));
    nodes[i].px = px;
    nodes[i].py = py;
  }
}

// ─── Norm-based quantization (order-independent) ────────────────────────────
// Uses projection matrix norms as scale — no data scan needed.
// Each node's grid position depends only on its own blended (px, py) and the
// fixed algorithm parameters (seeds, weights). Adding or removing other nodes
// never changes an existing node's (gx, gy).
//
// Scale derivation: for group g with projection matrix R_g (seeded),
// Var(proj_g) ≤ ||R_g[row]||² when the input signature is unit-variance.
// The blend variance upper bound is Σ w²_g × ||R_g[row]||² / W².
// We use this as σ for the Φ(px/σ) mapping. μ=0 by construction.

// Precomputed norm cache: normSqCache[seed] = [||R[0]||², ||R[1]||²]
const _normSqCache = new Map();
function projNormSq(seed) {
  if (_normSqCache.has(seed)) return _normSqCache.get(seed);
  const R = buildGaussianProjection(seed, MINHASH_K);
  let n0 = 0, n1 = 0;
  for (let j = 0; j < MINHASH_K; j++) { n0 += R[0][j] * R[0][j]; n1 += R[1][j] * R[1][j]; }
  const result = [n0, n1];
  _normSqCache.set(seed, result);
  return result;
}

/**
 * Norm-based quantization using pre-computed effective weights from unifiedBlend.
 * @param {Array} nodes
 * @param {string[]} groupNames
 * @param {object} effW - { groupName: effectiveWeight } (from unifiedBlend's floor logic)
 * @param {number} totalW - sum of effective weights
 * @param {object|null} [projSeeds] - per-group seed overrides { groupName: seed }
 */
export function normQuantize(nodes, groupNames, effW, totalW, projSeeds = null) {
  // Compute σ from projection matrix norms
  let varX = 0, varY = 0;
  for (let gi = 0; gi < groupNames.length; gi++) {
    const norms = projNormSq(projectionSeedForGroup(gi, groupNames[gi], projSeeds));
    const w = effW[groupNames[gi]];
    varX += w * w * norms[0];
    varY += w * w * norms[1];
  }
  const sx = Math.sqrt(varX) / totalW || 1;
  const sy = Math.sqrt(varY) / totalW || 1;

  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    const ux = phiLookup(nodes[i].px / sx);
    const uy = phiLookup(nodes[i].py / sy);
    nodes[i].gx = Math.min(GRID_SIZE - 1, Math.floor(ux * GRID_SIZE));
    nodes[i].gy = Math.min(GRID_SIZE - 1, Math.floor(uy * GRID_SIZE));
    nodes[i].px = ux * 2 - 1;
    nodes[i].py = uy * 2 - 1;
  }
}

/** Compute effective weights with adaptive floor. Shared by unifiedBlend and GPU blend.
 *  @returns {{ effW: object, totalW: number }} */
export function computeEffectiveWeights(groupNames, propStrengths) {
  let maxW = 0;
  for (const g of groupNames) { const raw = propStrengths[g] || 0; if (raw > maxW) maxW = raw; }
  const floor = Math.max(maxW * STRENGTH_FLOOR_RATIO, STRENGTH_FLOOR_MIN);
  const effW = {};
  let totalW = 0;
  for (const g of groupNames) {
    effW[g] = Math.max(propStrengths[g] || 0, floor);
    totalW += effW[g];
  }
  return { effW, totalW };
}

// Iterative topology smoothing via convex combination of property anchors and neighbor mean.
// At α=0: pure property. At α=1: pure topology (for nodes with neighbors).
// Each pass blends (1-α)*property + α*neighbor_mean using current positions.
// Partial convergence after k passes preserves intermediate topology structure.
// Module-level Float64Array buffers, grown on demand and reused across
// unifiedBlend calls. Auto-tune runs the blend 25-100+ times per session; at
// N=367K each call allocates 4×N×8 bytes = ~12MB, which shreds GC. Reusing
// buffers cuts allocation pressure to near zero for repeat calls at the same
// node count. The blend is sequential (not reentrant) so sharing is safe.
let _blendBuffers = null;
function getBlendBuffers(N) {
  if (!_blendBuffers || _blendBuffers.propPx.length < N) {
    _blendBuffers = {
      propPx: new Float64Array(N),
      propPy: new Float64Array(N),
      newPx: new Float64Array(N),
      newPy: new Float64Array(N),
    };
  }
  return _blendBuffers;
}

/**
 * Pack legacy per-node `projections` objects ({ groupName: [x, y] }) into a
 * flat projection buffer, setting each node's `projIdx` to its array index.
 * Missing groups read as [0, 0]. Drops the per-node objects. For callers that
 * build nodes by hand; the pipeline already produces the flat layout.
 * @returns {Float64Array} buffer with row stride groupNames.length * 2
 */
export function packProjections(nodes, groupNames) {
  const G = groupNames.length, S = G * 2;
  const buf = new Float64Array(nodes.length * S);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i], p = n.projections;
    if (p) {
      for (let gi = 0; gi < G; gi++) {
        const v = p[groupNames[gi]];
        if (v) { buf[i * S + gi * 2] = v[0]; buf[i * S + gi * 2 + 1] = v[1]; }
      }
    }
    n.projIdx = i;
    n.projections = undefined;
  }
  return buf;
}

/**
 * Sum per-group 2D projections into a blended (px, py), then optionally smooth
 * across neighbors, then quantize onto the uint16 grid.
 *
 * @param {object[]} nodes - nodes with `projIdx` (row into projBuf)
 * @param {Float64Array} projBuf - flat projections: group gi of row r at
 *   [(r * groupNames.length + gi) * 2], [+1]
 * @param {string[]} groupNames
 * @param {object} propStrengths - per-group scalar strength
 * @param {object|null} propBearings - per-group rotation angle in radians, or null.
 *   When null, no rotation is applied (fast path preserved). When provided, each
 *   group's (p.x, p.y) is rotated by its bearing before the weighted sum —
 *   turns each group from a random-direction contribution into a steerable 2D
 *   vector. Groups without an entry default to 0 rad. Rotation is applied during
 *   blend (not persisted in the node projections), so it's fully reversible and
 *   compositionally cheap.
 */
export function unifiedBlend(nodes, projBuf, groupNames, propStrengths, smoothAlpha, adjList, nodeIndexFull, passes, quantMode, quantStats, propBearings = null, projSeeds = null) {
  const w = propStrengths;
  // Adaptive strength floor: max(10% of max strength, absolute minimum of 0.10).
  // Prevents low-entropy collapse: zero-strength high-entropy groups always contribute 10% spreading.
  const { effW, totalW: propTotal } = computeEffectiveWeights(groupNames, w);

  // Precompute per-group cos/sin for bearings. Fast path when no bearings: skip
  // both the precompute and the rotation branch in the per-node loop.
  const G = groupNames.length;
  const S = G * 2;
  const effWArr = new Float64Array(G);
  for (let gi = 0; gi < G; gi++) effWArr[gi] = effW[groupNames[gi]];
  let cosBearing = null, sinBearing = null, hasAnyBearing = false;
  if (propBearings) {
    for (const g of groupNames) {
      if (propBearings[g]) { hasAnyBearing = true; break; }
    }
    if (hasAnyBearing) {
      cosBearing = new Float64Array(G);
      sinBearing = new Float64Array(G);
      for (let gi = 0; gi < G; gi++) {
        const theta = propBearings[groupNames[gi]] || 0;
        cosBearing[gi] = Math.cos(theta);
        sinBearing[gi] = Math.sin(theta);
      }
    }
  }

  // Precompute per-node property anchors (cached across passes). Buffers are
  // reused across blend calls — see getBlendBuffers.
  const N = nodes.length;
  const { propPx, propPy, newPx, newPy } = getBlendBuffers(N);
  if (hasAnyBearing) {
    // Bearings present — rotate each group's contribution before summing.
    for (let i = 0; i < N; i++) {
      const nd = nodes[i];
      const base = nd.projIdx * S;
      let px = 0, py = 0;
      for (let gi = 0; gi < G; gi++) {
        const gx = projBuf[base + gi * 2], gy = projBuf[base + gi * 2 + 1];
        const c = cosBearing[gi], s = sinBearing[gi], wg = effWArr[gi];
        px += (gx * c - gy * s) * wg;
        py += (gx * s + gy * c) * wg;
      }
      propPx[i] = px / propTotal;
      propPy[i] = py / propTotal;
      nd.px = propPx[i];
      nd.py = propPy[i];
    }
  } else {
    // No bearings — fast path, no rotation.
    for (let i = 0; i < N; i++) {
      const nd = nodes[i];
      const base = nd.projIdx * S;
      let px = 0, py = 0;
      for (let gi = 0; gi < G; gi++) {
        const wg = effWArr[gi];
        px += projBuf[base + gi * 2] * wg;
        py += projBuf[base + gi * 2 + 1] * wg;
      }
      propPx[i] = px / propTotal;
      propPy[i] = py / propTotal;
      nd.px = propPx[i];
      nd.py = propPy[i];
    }
  }

  const doQuant = () => {
    if (quantMode === 'gaussian') gaussianQuantize(nodes, quantStats);
    else if (quantMode === 'norm') normQuantize(nodes, groupNames, effW, propTotal, projSeeds);
    else if (quantMode === 'polar') radialQuantize(nodes, groupNames, effW, propTotal, projSeeds);
    else normalizeAndQuantize(nodes);
  };
  if (smoothAlpha === 0 || passes === 0) { doQuant(); return; }

  const alpha = Math.max(0, Math.min(1, smoothAlpha)); // clamp to [0,1]

  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < N; i++) {
      const nd = nodes[i];
      const neighbors = adjList[nd.id];
      if (neighbors && neighbors.length > 0) {
        let nx = 0, ny = 0, validCount = 0;
        for (const nid of neighbors) {
          const nb = nodeIndexFull[nid];
          if (nb) { nx += nb.px; ny += nb.py; validCount++; }
        }
        if (validCount > 0) {
          nx /= validCount;
          ny /= validCount;
          newPx[i] = (1 - alpha) * propPx[i] + alpha * nx;
          newPy[i] = (1 - alpha) * propPy[i] + alpha * ny;
        } else {
          newPx[i] = propPx[i];
          newPy[i] = propPy[i];
        }
      } else {
        newPx[i] = propPx[i];
        newPy[i] = propPy[i];
      }
    }

    for (let i = 0; i < N; i++) {
      nodes[i].px = newPx[i];
      nodes[i].py = newPy[i];
    }
  }

  doQuant();
}

// ─── Level building (two-phase for large datasets) ──────────────────────────

// Phase 1: bucket nodes into supernodes. O(n). No edge processing.
// Returns a level object with snEdges:[] that can render circles/heatmap/labels immediately.
export function buildLevelNodes(level, nodes, colorValFn, labelValFn, colorLookup) {
  const bucketMap = new Map();
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const bid = cellIdAtLevel(n.gx, n.gy, level);
    let bucket = bucketMap.get(bid);
    if (!bucket) { bucket = []; bucketMap.set(bid, bucket); }
    bucket.push(n);
  }

  const supernodes = [];
  for (const [bid, members] of bucketMap) {
    const cx = bid >> level;
    const cy = bid & ((1 << level) - 1);

    const groupCounts = {};
    const colorCounts = {};
    const labelCounts = {};
    let sumDegree = 0;
    let sumPx = 0, sumPy = 0;
    let bestDegree = -1, bestNode = members[0];
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      sumPx += m.px; sumPy += m.py;
      groupCounts[m.group] = (groupCounts[m.group] || 0) + 1;
      if (colorValFn) {
        const cv = colorValFn(m);
        colorCounts[cv] = (colorCounts[cv] || 0) + 1;
      }
      if (labelValFn) {
        const lv = labelValFn(m);
        labelCounts[lv] = (labelCounts[lv] || 0) + 1;
      }
      sumDegree += m.degree;
      if (m.degree > bestDegree) { bestDegree = m.degree; bestNode = m; }
    }
    const ax = sumPx / members.length;
    const ay = sumPy / members.length;
    const domGroup = maxCountKey(groupCounts);
    const avgDegree = sumDegree / members.length;
    const totalDegree = sumDegree;
    const repName = bestNode.label || bestNode.id;

    const cachedColorVal = colorValFn ? maxCountKey(colorCounts) : domGroup;
    // Per-node `n.color` overrides the categorical palette lookup. The rep
    // member (highest degree) wins the supernode color — symmetric with how
    // `repName` picks the supernode label.
    const cachedColor = bestNode.color
      || (colorLookup ? (colorLookup(cachedColorVal) || '#888888') : '#888888');
    const cachedLabel = labelValFn ? maxCountKey(labelCounts) : repName;

    supernodes.push({ bid, members, ax, ay, domGroup, avgDegree, totalDegree, repName,
             cachedColorVal, cachedColor, cachedLabel, x:0, y:0, cx, cy });
  }

  return { supernodes, snEdges: [], level, _edgesReady: false };
}

// Phase 2: aggregate edges into super-edges. O(|E|). Mutates levelObj.snEdges in place.
// For levels 1-13, packs two cell IDs into one number (26 bits each, 52 < 53 safe bits).
// Level 14 uses string keys (28 bits each = 56 > 53).
export function buildLevelEdges(levelObj, edges, nodeIndexFull, level) {
  const canPack = level <= 13;
  const PACK_MUL = 0x4000000; // 2^26
  const snEdgeMap = new Map();
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    const srcNode = nodeIndexFull[e.src];
    const dstNode = nodeIndexFull[e.dst];
    if (!srcNode || !dstNode) continue;
    const sbid = cellIdAtLevel(srcNode.gx, srcNode.gy, level);
    const dbid = cellIdAtLevel(dstNode.gx, dstNode.gy, level);
    if (sbid !== dbid) {
      const lo = sbid < dbid ? sbid : dbid;
      const hi = sbid < dbid ? dbid : sbid;
      const key = canPack ? lo * PACK_MUL + hi : lo + ',' + hi;
      snEdgeMap.set(key, (snEdgeMap.get(key) || 0) + 1);
    }
  }

  const snEdges = new Array(snEdgeMap.size);
  let idx = 0;
  if (canPack) {
    for (const [key, weight] of snEdgeMap) {
      snEdges[idx++] = { a: key / PACK_MUL | 0, b: key % PACK_MUL, weight };
    }
  } else {
    for (const [key, weight] of snEdgeMap) {
      const comma = key.indexOf(',');
      snEdges[idx++] = { a: parseInt(key.slice(0, comma), 10), b: parseInt(key.slice(comma + 1), 10), weight };
    }
  }
  levelObj.snEdges = snEdges;
  levelObj._edgesReady = true;
}

// Combined wrapper for backward compatibility (tests, standalone BlitZoomCanvas).
export function buildLevel(level, nodes, edges, nodeIndexFull, colorValFn, labelValFn, colorLookup) {
  const lvl = buildLevelNodes(level, nodes, colorValFn, labelValFn, colorLookup);
  buildLevelEdges(lvl, edges, nodeIndexFull, level);
  return lvl;
}

// ─── Edge selection for rendering (Canvas 2D, WebGL, SVG) ───────────────────

/** Hash edge index to [0,1) — stable across renders for the same edge set. */
export function edgeHash(i) {
  const h = (i * 2654435761) >>> 0; // Knuth multiplicative hash
  return (h & 0x7fffffff) / 0x80000000;
}

/** Adaptive edge cap: scales with node count to avoid clutter on dense graphs. */
export function maxEdgesToDraw(nodeCount) {
  return Math.min(5000, Math.max(200, nodeCount * 3));
}

// Two-level cache for edgeEndpoints / incidentEdges: edge array → lookup
// source (nodeIndexFull, supernode map, level) → entry. Weak on both keys, so a
// replaced edge set or node set is freed with its entry, and two views that
// share an edge array but not node objects (e.g. two createSVGView calls on the
// same pipeline edges) never share endpoints.
function cacheFor(store, edges) {
  let bySource = store.get(edges);
  if (!bySource) { bySource = new WeakMap(); store.set(edges, bySource); }
  return bySource;
}

/** WeakMap-safe source key: falls back to the edge array for a non-object source. */
function sourceKey(source, edges) {
  return (source !== null && typeof source === 'object') ? source : edges;
}
const _endpointCache = new WeakMap();

/**
 * Endpoint objects for every edge: `a[i]` / `b[i]` are nodeA(edges[i]) /
 * nodeB(edges[i]) (undefined if unresolved), where nodeA/nodeB look up in
 * `source`. Cached per (edge array, source). Turns the per-frame endpoint
 * lookup — a string-keyed dictionary probe for raw edges — into an array
 * read. Valid while the pair keeps its endpoints: mutations that remove nodes
 * replace the edge array, updates keep node objects, and appends (addNodes
 * pushes into the same array) are resolved incrementally.
 * @returns {{a: Array, b: Array}}
 */
export function edgeEndpoints(edges, source, nodeA, nodeB) {
  const bySource = cacheFor(_endpointCache, edges);
  const key = sourceKey(source, edges);
  let c = bySource.get(key);
  if (!c || c.a.length > edges.length) {
    c = { a: [], b: [] };
    bySource.set(key, c);
  }
  for (let i = c.a.length; i < edges.length; i++) {
    const e = edges[i];
    c.a.push(nodeA(e));
    c.b.push(nodeB(e));
  }
  return c;
}

// Scratch for sampleEdges, grown on demand. Not reentrant: callers consume
// the returned indices before the next call.
let _candIdx = new Uint32Array(0);
let _candW = new Float32Array(0);

/**
 * Pick the edges to draw this frame. Pass 1 keeps candidates: both endpoints
 * resolve, screen length <= 1.2 viewport diagonals, and the segment's bounding
 * box (padded for curve bulge and stroke) intersects the viewport. Each gets a
 * weight w = 1 - 0.5·d²/maxLen² in [0.5, 1] (short edges preferred 2:1).
 * Pass 2, when candidates exceed maxEdges, keeps candidate i iff
 * edgeHash(i) < rate·w with rate = maxEdges / Σw, so the expected count is
 * maxEdges and every position in the edge array has the same chance —
 * no early cutoff that starves the tail of the array.
 *
 * @param {Array} edges
 * @param {{a: Array, b: Array}} ends - endpoint objects ({x, y}) per edge,
 *   from edgeEndpoints
 * @param {{x: number, y: number}} pan
 * @param {number} rz - render zoom (world → screen scale)
 * @param {number} W - viewport width in px
 * @param {number} H - viewport height in px
 * @param {number} maxEdges
 * @returns {{idx: Uint32Array, count: number}} ascending edge indices in
 *   idx[0..count); the array is shared scratch, valid until the next call
 */
export function sampleEdges(edges, ends, pan, rz, W, H, maxEdges) {
  const E = edges.length;
  const A = ends.a, B = ends.b;
  if (_candIdx.length < E) { _candIdx = new Uint32Array(E); _candW = new Float32Array(E); }
  const diag = Math.sqrt(W * W + H * H);
  const maxLenSq = (diag * 1.2) * (diag * 1.2);
  let n = 0, sumW = 0;
  for (let i = 0; i < E; i++) {
    const a = A[i], b = B[i];
    if (!a || !b) continue;
    const ax = a.x * rz + pan.x, ay = a.y * rz + pan.y;
    const bx = b.x * rz + pan.x, by = b.y * rz + pan.y;
    const dx = ax - bx, dy = ay - by;
    const distSq = dx * dx + dy * dy;
    if (distSq > maxLenSq) continue;
    // Curve control points sit at most 0.15·len off the chord, and
    // |dx| + |dy| >= len, so this pad covers the bulge; +2 covers the stroke.
    const pad = 0.15 * (Math.abs(dx) + Math.abs(dy)) + 2;
    if ((ax > bx ? ax : bx) < -pad || (ax < bx ? ax : bx) > W + pad) continue;
    if ((ay > by ? ay : by) < -pad || (ay < by ? ay : by) > H + pad) continue;
    const w = 1 - 0.5 * distSq / maxLenSq;
    _candIdx[n] = i;
    _candW[n] = w;
    sumW += w;
    n++;
  }
  if (n <= maxEdges) return { idx: _candIdx, count: n };
  const rate = maxEdges / sumW;
  let count = 0;
  for (let j = 0; j < n; j++) {
    const i = _candIdx[j];
    if (edgeHash(i) < rate * _candW[j]) _candIdx[count++] = i; // in-place: count <= j
  }
  return { idx: _candIdx, count };
}

const _incidenceCache = new WeakMap(); // see cacheFor

/**
 * Incident-edge index (CSR) so highlight passes visit only the edges of the
 * hovered/selected endpoints instead of scanning every edge per frame.
 * `rowOf(key)` maps an endpoint key (node id or supernode bid) to a dense row
 * in [0, rowCount), or -1 if unknown; edges with an unknown endpoint are not
 * indexed (renderers skip them anyway). Self-loops are listed once. Cached per
 * (edge array, source — the object rowOf reads) until the array's length or
 * rowCount changes.
 * @returns {{offsets: Uint32Array, list: Uint32Array}}
 */
export function incidentEdges(edges, source, srcKey, dstKey, rowOf, rowCount) {
  const bySource = cacheFor(_incidenceCache, edges);
  const key = sourceKey(source, edges);
  const c = bySource.get(key);
  if (c && c.len === edges.length && c.rows === rowCount) return c;
  const E = edges.length;
  const ends = new Int32Array(E * 2);
  const offsets = new Uint32Array(rowCount + 1);
  for (let i = 0; i < E; i++) {
    const e = edges[i];
    const a = rowOf(srcKey(e)), b = rowOf(dstKey(e));
    if (a < 0 || b < 0) { ends[2 * i] = -1; continue; }
    ends[2 * i] = a;
    ends[2 * i + 1] = b;
    offsets[a + 1]++;
    if (b !== a) offsets[b + 1]++;
  }
  for (let r = 0; r < rowCount; r++) offsets[r + 1] += offsets[r];
  const list = new Uint32Array(offsets[rowCount]);
  const fill = offsets.slice(0, rowCount);
  for (let i = 0; i < E; i++) {
    const a = ends[2 * i];
    if (a < 0) continue;
    const b = ends[2 * i + 1];
    list[fill[a]++] = i;
    if (b !== a) list[fill[b]++] = i;
  }
  const inc = { len: E, rows: rowCount, offsets, list };
  bySource.set(key, inc);
  return inc;
}

/**
 * Collect the indices of edges touching any key in `hitKeys`, via an
 * incidentEdges index. An edge between two hit endpoints is returned once.
 * @returns {number[]}
 */
export function edgesTouching(inc, edges, srcKey, dstKey, rowOf, hitKeys) {
  const out = [];
  const done = new Set();
  for (const key of hitKeys) {
    const r = rowOf(key);
    if (r < 0) continue;
    for (let j = inc.offsets[r]; j < inc.offsets[r + 1]; j++) {
      const i = inc.list[j];
      const e = edges[i];
      const s = srcKey(e);
      const other = s === key ? dstKey(e) : s;
      if (other !== key && done.has(other)) continue;
      out.push(i);
    }
    done.add(key);
  }
  return out;
}

/** Row lookups for incidentEdges: raw nodes by id (projIdx), supernodes by bid. */
export function rawEdgeRow(bz) {
  return id => { const n = bz.nodeIndexFull[id]; return n ? n.projIdx : -1; };
}
export function superEdgeRow(level) {
  if (!level._snRow) {
    level._snRow = new Map();
    for (let i = 0; i < level.supernodes.length; i++) level._snRow.set(level.supernodes[i].bid, i);
  }
  const m = level._snRow;
  return bid => { const r = m.get(bid); return r === undefined ? -1 : r; };
}

// ─── Node property helpers ───────────────────────────────────────────────────

// #16: Use hasOwnProperty for falsy-but-valid values (0, false, empty string)
export function getNodePropValue(n, prop, adjList) {
  if (prop === 'label') return n.label || n.id;
  if (prop === 'group') return n.group || 'unknown';
  if (prop === 'structure') return `deg:${n.degree}`;
  if (prop === 'neighbors') return `${(adjList[n.id] || []).length} nbrs`;
  if (prop === 'edgetype' && n.edgeTypes) {
    const types = Array.isArray(n.edgeTypes) ? n.edgeTypes : [...n.edgeTypes];
    return types.length > 0 ? types[0] : n.id;
  }
  if (n.extraProps && Object.prototype.hasOwnProperty.call(n.extraProps, prop)) {
    const v = n.extraProps[prop];
    return v !== null && v !== undefined ? String(v) : n.label || n.id;
  }
  return n.label || n.id;
}

export function getSupernodeDominantValue(sn, prop, adjList) {
  if (prop === 'label') return sn.repName;
  const counts = {};
  for (const m of sn.members) {
    const val = getNodePropValue(m, prop, adjList);
    counts[val] = (counts[val] || 0) + 1;
  }
  return maxCountKey(counts);
}
