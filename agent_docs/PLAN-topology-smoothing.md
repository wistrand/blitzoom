# Topology Smoothing Improvements

**Status: PPR and symmetric normalization both attempted and reverted.**

- PPR with teleport requires meaningful seed positions. For edge-only datasets,
  property anchors are noise; PPR teleport injects that noise every iteration,
  erasing topology structure. The original convex combination with partial convergence
  (5 passes) preserves intermediate topology structure that full PPR convergence
  destroys on well-connected graphs.
- Symmetric degree normalization (1/√d_j weighting) tested as self-normalizing
  variant. Did not visibly improve layout quality. Reverted to simple neighbor mean.

Analysis of spec-compatible changes to improve topology preservation, based on
benchmark results from the layout comparison (benchmarks/results/REPORT.md).

## Problem statement

The benchmarks expose two topology weaknesses:

1. **Sparse-graph propagation.** On the US Power Grid (diameter ~46), 5 passes of
   neighbor averaging propagate signal at most 5 hops. TopoNbrP: BlitZoom 0.003 vs
   ForceAtlas2 0.197. This is the largest gap in the comparison.

2. **Correlated-dataset property grouping.** On BlitZoom Source, topology-based methods
   outscore BlitZoom on PropNbrP (0.21-0.24 vs 0.18) because call-graph adjacency
   encodes file/kind similarity. BlitZoom cannot exploit this correlation as effectively
   with only 5 smoothing passes.

Both problems trace to the same root cause: fixed-pass simple neighbor averaging has
a hard propagation horizon at the pass count.

## A. Personalized PageRank propagation

Replace the current blend topology term with PPR iteration.

### Current (spec section "Unified blend")

```
px_i^(t+1) = (1-α) · property_i + α · mean_j∈N(i)(px_j^(t))
```

5 passes. Effective reach: 5 hops.

### Proposed

```
px_i^(t+1) = β · property_i + (1-β) · Σ_j (A_ij / √(d_i · d_j)) · px_j^(t)
```

10-15 passes. β = teleport probability (0.15 default). Effective reach: O(1/β) hops.

### Why it fits the spec

- Still a weighted combination of property anchors and topology signal.
- The α parameter maps to β (teleport = property retention fraction).
- α=0 is pure property; α=1 is pure topology. Same semantics.
- Fixed projections, weight system, quantization, zoom hierarchy all untouched.
- Deterministic. No randomness introduced.
- Same asymptotic complexity: O(passes × (n + E)).

### What it fixes

- **Propagation reach.** With β=0.15, signal from ~40 hops contributes (exponentially
  decaying). With β=0.05, reach extends to ~60 hops. Covers the power grid diameter.
- **Oversmoothing prevention.** The β · property_i residual guarantees every node
  retains at least β fraction of its property position at convergence. No matter how
  many passes, nodes cannot collapse to a uniform value. This allows safely increasing
  passes from 5 to 12-15.
- **Convergence.** PPR power iteration converges in O(log(1/ε)) steps regardless of
  graph diameter. 10-15 iterations suffice for ε=1e-4.

### Estimated performance impact

Benchmark predictions (based on PPR theory and comparable GNN results):

| Dataset    | Current TopoNbrP | Estimated TopoNbrP | Current PropNbrP | Estimated PropNbrP |
| ---------- | ---------------: | -----------------: | ---------------: | -----------------: |
| Power Grid | 0.003            | 0.02-0.06          | 0.002            | 0.002              |
| Facebook   | 0.110            | 0.12-0.14          | 0.003            | 0.003              |
| Email-EU   | 0.056            | 0.06-0.08          | 0.007            | 0.007              |
| MITRE      | 0.002            | 0.003-0.005        | 0.034            | 0.034              |
| BZ Source  | 0.032            | 0.04-0.07          | 0.179            | 0.18-0.20          |

Power grid sees the largest improvement because the propagation horizon is the
binding constraint. Dense graphs (Facebook) see moderate gains from more passes without
oversmoothing. Property-dominated datasets (MITRE, Synth) are unaffected because
property weights dominate and topology contributes minimally.

BZ Source PropNbrP may improve because better topology capture helps when properties
and connectivity correlate.

### Implementation cost

~10 lines changed in `unifiedBlend` (blitzoom-algo.js). Precompute `invSqrtDeg` array
once (O(n)). Change inner loop from simple mean to PPR step with symmetric
normalization. Increase default passes from 5 to 12.

Wall-clock cost increase: passes go from 5 to 12 (~2.4x). Each pass adds one
multiply per edge (invSqrtDeg). On the Amazon dataset (988K edges), current blend
takes ~15ms for 5 passes. Estimated: ~40ms for 12 passes. Still sub-100ms, orders
of magnitude faster than ForceAtlas2.

### Reference

Klicpera et al., "Predict then Propagate: Graph Neural Networks meet Personalized
PageRank" (APPNP, ICLR 2019). Showed PPR propagation with K=10 power iteration steps
outperforms K-layer GNNs because PPR's effective receptive field is much larger than
K hops.

## B. Symmetric degree normalization

Replace D⁻¹A (random walk / simple mean) with D⁻¹/²AD⁻¹/² (symmetric normalization).

### Current

```javascript
nx /= validCount;  // simple mean of neighbors
```

A degree-1 node's value is 100% determined by its single neighbor. A degree-100 hub
barely moves per pass.

### Proposed

```javascript
// Precompute once:
const invSqrtDeg = new Float64Array(n);
for (let i = 0; i < n; i++)
  invSqrtDeg[i] = 1 / Math.sqrt(Math.max(1, degree[i]));

// In inner loop:
s += invSqrtDeg[i] * invSqrtDeg[j] * px[j];
```

### Why it fits the spec

The spec says "closely related to degree-normalised graph smoothing" without
specifying which normalization. Symmetric normalization is the standard choice in
spectral graph theory with better convergence properties (eigenvalues in [-1, 1]).

### What it fixes

- Balances influence between high-degree and low-degree nodes.
- Prevents hub domination: a degree-100 hub's outgoing influence is downweighted by
  1/√100 = 0.1 per neighbor, rather than contributing equally to each.
- Better spectral behavior for convergence analysis.

### Estimated performance impact

Primarily helps on graphs with high degree variance (MITRE: degree range 1-300+,
Facebook: ego hubs with degree 300+). Prevents smoothing artifacts where hubs pull
their entire neighborhood to a single point. Expected improvement: 5-15% on TopoNbrP
for high-variance graphs. Negligible effect on uniform-degree graphs (power grid:
mostly degree 2-4).

### Implementation cost

3 lines: precompute array + change inner loop multiply. O(n) precompute, O(1)
additional cost per edge per pass. No measurable wall-clock impact.

## C. Adaptive pass count

### Current

Fixed 5 passes for all datasets.

### Proposed

```javascript
const passes = Math.min(15, Math.max(5, Math.ceil(Math.log2(nodes.length) * 1.5)));
```

Or based on graph structure: `min(15, ceil(estimatedDiameter / 3))` where
estimatedDiameter can be approximated from average degree and node count.

### Why it fits the spec

The spec says "run synchronously for k passes" without fixing k. It is already a
parameter (currently hardcoded to 5 in the caller). Making the default adaptive
does not change the algorithm.

### Dependency

Only safe in combination with A (PPR residual). Without the residual connection,
more passes at high α causes oversmoothing. With PPR, oversmoothing is prevented
by construction, so more passes are always safe.

### Estimated performance impact

For 433-node BZ Source: passes 5 → 8. Cost increase ~1.6x (~negligible at this scale).
For 4941-node Power Grid: passes 5 → 12. Cost increase ~2.4x (15ms → ~36ms).
For 367K-node Amazon: passes 5 → 13. Cost increase ~2.6x (15ms → ~39ms).

All remain sub-100ms. The topology improvement on sparse graphs justifies the cost.

## What not to change

- **MinHash + Gaussian projection.** The property-similarity results validate this
  pipeline. MITRE PropNbrP 0.034 with tuned weights is real signal.
- **Independent group projections and weight system.** PropNbrP changes 5x with weight
  tuning (0.007 → 0.034 on MITRE). The system works as designed.
- **Quantization modes.** Gaussian vs rank is already a toggle. Gaussian helps 4-11%
  on BZ Source. Both serve their purpose.
- **Adaptive weight floor.** Solves low-entropy collapse without breaking weight
  semantics.

## Priority

A (PPR) is the highest-impact change. It directly addresses the largest benchmark
gap (power grid) while being fully compatible with the spec. B (symmetric norm) is
a small improvement that pairs well with A. C (adaptive passes) only makes sense
after A is implemented.

Combined estimated implementation: ~20 lines changed, ~2.4x blend cost increase
(still sub-100ms for all tested datasets).
