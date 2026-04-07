# Precompute Pipeline Optimizations

Analysis of published techniques applicable to the BlitZoom precomputation pipeline at 30M+ node scale.

## Current Bottleneck Profile (30M nodes, 9M edges, 6 groups)

| Stage              | Cost                    | Time (est.) |
| ------------------ | ----------------------- | ----------- |
| MinHash (k=128)    | 461B hash slot evals    | ~2 hours    |
| Topology smoothing | 5 × O(n+\|E\|)         | ~5 min      |
| Level building     | 14 × O(n) + 14 × O(\|E\|) | ~5 min  |
| Projection         | 256 mults/node/group    | ~2 min      |
| Quantization       | O(n log n) rank sort    | ~15s        |
| Parsing            | O(file) memory          | ~30s        |

MinHash dominates at 90%+ of total compute.

---

## 1. One Permutation Hashing (128x hash reduction)

**Source:** Li, Owen, Zhang. "One Permutation Hashing." NIPS 2012.

**Current:** k=128 independent hash functions, each evaluated per token. Cost: O(k × |S|) per node per group.

**OPH:** Use a single hash function. Partition output range into k bins. Keep minimum per bin. Cost: O(|S|).

**Problem:** Empty bins when |S| < k (common in BlitZoom: 3-10 tokens per set).

**Fix:** Densified OPH (Shrivastava, Li. ICML 2014). Fills empty bins by rehashing occupied values. Preserves unbiased Jaccard estimation.

**Impact:** 128x fewer hash evaluations. Pipeline drops from ~2 hours to ~1 minute for MinHash stage.

**Implementation change:**
```
// Current: 128 hash evals per token
for j in 0..128: sig[j] = min(sig[j], hashSlot(A[j], tv, B[j]))

// OPH: 1 hash eval per token
h = hashSlot(A[0], tv, B[0])
bin = h % 128
sig[bin] = min(sig[bin], h / 128)
// + DOPH fill pass after all tokens processed
```

---

## 2. Very Sparse Random Projection (11x fewer multiplies)

**Source:** Li, Hastie, Church. "Very Sparse Random Projections." KDD 2006. Building on Achlioptas. "Database-friendly Random Projections." JCSS 2003.

**Current:** Dense Gaussian matrix R ∈ ℝ^(2×128). 256 multiply-adds per projection.

**Sparse:** Entries are {+√s, 0, -√s} with probabilities {1/(2s), 1-1/s, 1/(2s)} where s = √k ≈ 11.3. ~91% of entries are zero. ~23 nonzero per projection.

**Preserves JL distance guarantees.** Proven equivalent to dense Gaussian for dimensionality reduction.

**Implementation:** Store as sparse list of (index, sign) pairs. No PRNG per entry; hash seed+index to decide nonzero/sign.

---

## 3. Columnar Node Storage (7x memory reduction)

**Technique:** Struct-of-Arrays (SoA). Standard in HPC, database columnar stores.

**Current:** JS objects with ~200 bytes V8 overhead each. 30M objects = ~6GB overhead alone. Total ~15-20GB.

**SoA:** Parallel typed arrays:
```
px = new Float64Array(N)      // 8B × N
py = new Float64Array(N)      // 8B × N
gx = new Uint16Array(N)       // 2B × N
gy = new Uint16Array(N)       // 2B × N
degree = new Uint32Array(N)   // 4B × N
groupIdx = new Uint8Array(N)  // 1B × N
projBuf = new Float64Array(N*G*2) // already exists
```

**~26 bytes/node. Total ~780MB instead of 15GB.** Also improves cache locality for loops that touch one field across all nodes.

---

## 4. Histogram Rank Quantization (O(n) instead of O(n log n))

**Technique:** Equi-depth histogram. Standard in database query optimization.

**Steps:**
1. Build 65536-bin histogram of px values: O(n)
2. Cumulative sum: O(65536)
3. Assign gx by cumulative lookup: O(n)

**Exact within ±1 grid cell.** Indistinguishable from sort-based rank for BlitZoom.

Gaussian quantization already O(n) via Φ lookup. This optimizes rank mode only.

---

## 5. Bottom-Up Level Construction (10x faster)

**Technique:** Quadtree bottom-up merge. Morton 1966.

**Current:** Each level scans all n nodes independently. 14 × O(n) = 420M iterations at 30M nodes.

**Bottom-up:** Build L14 from nodes: O(n). Each coarser level merges child supernodes: O(|children|).

```
Total = O(n) + O(n/4) + O(n/16) + ... = O(n × 4/3)
```

**~10x fewer iterations.** Coarse levels (L1-L4) merge hundreds of supernodes instead of scanning millions.

---

## 6. Single-Pass Edge Distribution (14x fewer edge scans)

**Technique:** Morton code XOR + leading zero count.

**Current:** For each level, iterate ALL edges. 14 × O(|E|).

**Single-pass:** For each edge, compute the coarsest level where endpoints are in different cells:
```
splitLevel = 16 - clz32(cellId_u XOR cellId_v)
```

Distribute each edge to its split level in one pass: O(|E|). Each level's edges are those with splitLevel ≤ L. Sort once, binary search per level.

**Total: O(|E| log |E|) once, versus 14 × O(|E|).**

---

## 7. Coarse-to-Fine Topology Smoothing (20x faster)

**Technique:** Algebraic multigrid V-cycle. Brandt 1977; Ruge-Stuben 1987.

**Current:** 5 passes over full graph: 5 × O(n + |E|). At 30M nodes + 90M edges = 600M ops/pass.

**Coarse-to-fine:**
1. Build L8 supernodes (50K nodes, ~500K edges)
2. Smooth supernode graph: 5 × (50K + 500K) = 2.75M ops
3. Interpolate to individual nodes: (1-α) × own_anchor + α × supernode_average
4. Single pass: O(n)

**Total: O(n) instead of O(passes × (n + |E|)).** Visually indistinguishable for layout purposes.

**Alternative: Adaptive termination.** Converges geometrically at rate α. For α=0.3, 3 passes gives residual 0.027. Monitor max delta per pass, stop when < threshold. Saves 1-2 passes (20-40%).

---

## 8. Streaming Parse (constant memory)

**Current:** `text.split('\n')` duplicates entire file. 2GB edges file → ~6GB peak for parsing.

**Streaming:** Read in 64MB chunks, scan for newlines, process lines without full array. Deno: `Deno.open` + readable stream + `TextDecoderStream`.

**Memory: O(chunk_size) instead of O(file_size).** Saves ~4GB at 30M nodes.

---

## Combined Impact

| Optimization            | Stage       | Speedup | Source                      |
| ----------------------- | ----------- | ------- | --------------------------- |
| One Permutation Hashing | MinHash     | 128x    | Li, Owen, Zhang 2012        |
| Densified OPH           | MinHash     | (fix)   | Shrivastava, Li 2014        |
| Very Sparse Projection  | Project     | 11x     | Li, Hastie, Church 2006     |
| Columnar storage        | Memory      | 7x      | Standard SoA                |
| Histogram rank          | Quantize    | ~2x     | Standard equi-depth         |
| Bottom-up levels        | Level build | 10x     | Morton 1966                 |
| Single-pass edges       | Edge build  | 14x     | Bit-prefix XOR              |
| Coarse-to-fine smooth   | Topology    | 20x     | Multigrid (Brandt 1977)     |
| Streaming parse         | Parse       | mem     | Standard                    |

**Estimated total at 30M nodes:**
- Current pipeline: ~2-3 hours
- With all optimizations: ~5-15 minutes
- OPH alone accounts for most of the improvement (MinHash is 90% of current cost)
