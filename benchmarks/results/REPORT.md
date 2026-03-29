# BitZoom Layout Comparison Report

## 1. Summary

Four graph datasets were laid out using BitZoom (at multiple topology weights),
ForceAtlas2 (2000 iterations, Barnes-Hut), UMAP, and t-SNE. All methods received
the same input graphs. Layouts were evaluated on both topology preservation (edge
length, neighborhood overlap) and property-similarity preservation (whether nodes
with similar attributes end up nearby).

The results confirm that these methods optimize for different objectives. ForceAtlas2
produces the tightest topological layouts. UMAP and t-SNE preserve neighborhood
structure from adjacency. BitZoom positions nodes by property similarity, completes
in milliseconds, and produces a hierarchical zoom structure.

On the MITRE ATT&CK dataset (the only dataset with rich node properties), BitZoom
with tuned property weights scores 2.6x higher than ForceAtlas2 on property-similarity
preservation (PropNbrP 0.034 vs 0.013). On edge-only datasets, property-similarity
scores are uniformly low across all methods because auto-generated tokens provide
little differentiation.

| Dataset     | Nodes | Edges  | BitZoom config | Time    | FA2 time | TopoNbrP ratio | PropNbrP ratio |
| ----------- | ----: | -----: | -------------- | ------: | -------: | --------------: | -------------: |
| Email-EU    | 1,005 | 16,706 | α=1.0          |    1 ms |      54s |           0.87x |          0.87x |
| Facebook    | 4,039 | 88,234 | α=1.0          |    6 ms |     172s |           0.74x |          0.79x |
| Power Grid  | 4,941 |  6,594 | α=0.75         |    8 ms |     152s |           0.01x |          0.68x |
| MITRE       | 4,736 | 25,856 | α=0 weighted   |    8 ms |     178s |           0.37x |          2.57x |

Ratios are BitZoom / ForceAtlas2. Higher = better for both NbrP columns.

---

## 2. Methodology

### 2.1 Algorithms

**BitZoom.** MinHash property signatures projected to 2D via Gaussian random matrices,
blended with iterative topology smoothing (5 passes), quantized to a uint16 grid.
Tested at topology weights α = 0, 0.5, 0.75, and 1.0, with and without property
weights.

**ForceAtlas2.** [`fa2-modified`](https://pypi.org/project/fa2-modified/) with
Barnes-Hut optimization (θ=1.2), 2000 iterations, scalingRatio=2, gravity=1.
O(n log n) per iteration. Replaces NetworkX `spring_layout` from the initial version
of this benchmark.

**UMAP.** umap-learn, Jaccard metric on binary adjacency rows, 2 components, seed=42.
Only run on Email-EU (1K nodes). Skipped on larger datasets due to the cost of
computing on dense n x n adjacency matrices.

**t-SNE.** scikit-learn TSNE on binary adjacency rows, 2 components, seed=42,
perplexity = min(30, n-1).

### 2.2 Metrics

**EdgeLen (mean / median).** Normalized Euclidean distance between connected nodes.
Lower means connected nodes are placed closer. Distances normalized by layout span
(max coordinate range across both axes) for cross-algorithm comparability.

**TopoNbrP.** Topology neighborhood preservation. Jaccard overlap between each node's
k=10 nearest graph neighbors and k=10 nearest layout neighbors (Euclidean distance,
KD-tree). Higher means the layout reflects graph connectivity in spatial proximity.

**PropNbrP.** Property-similarity neighborhood preservation. For each node, find its
k=10 most property-similar nodes (by Jaccard on token sets) and its k=10 nearest
layout neighbors. Compute Jaccard overlap. Higher means nodes with similar properties
end up near each other. Sampled at 500 nodes for datasets larger than 500 nodes.

**Silhouette.** Silhouette score of layout positions against ground-truth community
labels. Ranges from -1 to +1. Only available for Email-EU (42 departments).

**Time.** Wall-clock seconds. BitZoom times include full pipeline execution in the
export script. ForceAtlas2, UMAP, and t-SNE times measure layout computation only.

### 2.3 Datasets

| Dataset    | Nodes | Edges  | Source        | Properties                    | Ground truth   |
| ---------- | ----: | -----: | ------------- | ----------------------------- | -------------- |
| Email-EU   | 1,005 | 16,706 | Stanford SNAP | none (edge-only)              | 42 departments |
| Facebook   | 4,039 | 88,234 | Stanford SNAP | none (edge-only)              | none           |
| Power Grid | 4,941 |  6,594 | KONECT        | none (edge-only)              | none           |
| MITRE      | 4,736 | 25,856 | MITRE ATT&CK  | platforms, kill chain, aliases | none           |

Edge counts reflect undirected edges after deduplication. Email-EU ground truth labels
are from the SNAP companion file `email-Eu-core-department-labels.txt`.

### 2.4 Pipeline and reproducibility

1. **Export BitZoom layouts** (Deno, native). [`export-layout.ts`](../export-layout.ts)
   runs the full pipeline (parse, tokenize, MinHash, project, blend, quantize) and
   writes node positions as TSV plus a companion `.tokens` file with per-node token
   sets for property-similarity evaluation.

2. **Compute competing layouts** (Python 3.12, Docker).
   [`compare-layouts.py`](../compare-layouts.py) loads the same edge file, computes
   ForceAtlas2 / UMAP / t-SNE, imports BitZoom exports, and evaluates all layouts
   on the same metrics. Runs inside a Docker container
   ([`Dockerfile`](../Dockerfile): `python:3.12-slim` with networkx, scikit-learn,
   umap-learn, scipy, fa2-modified).

3. **Evaluate metrics** on all layouts against the same edge list, token sets, and
   ground-truth labels where available.

```sh
# Reproduce from repository root (requires Deno and Docker):
bash benchmarks/run-comparison.sh
```

See [`run-comparison.sh`](../run-comparison.sh) for the full orchestration script.

Total runtime is approximately 15 minutes, dominated by ForceAtlas2 on the 4-5K node
datasets.

---

## 3. Results

### 3.1 Email-EU

European research institution email network.
1,005 nodes, 16,706 edges, 42 department ground-truth labels.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | TopoNbrP | PropNbrP | Silhouette | Note                                           |
| ------------------ | -------: | -----------: | ----------: | -------: | -------: | ---------: | ---------------------------------------------- |
| BitZoom α=0        |    0.002 |       0.4663 |      0.4614 |   0.0058 |   0.0073 |    -0.4710 | No topology signal; near-random layout         |
| BitZoom α=0.5      |    0.002 |       0.4480 |      0.4419 |   0.0074 |   0.0077 |    -0.4537 | Marginal improvement from topology             |
| BitZoom α=0.75     |    0.002 |       0.4348 |      0.4283 |   0.0079 |   0.0080 |    -0.4570 | Limited by 5-pass smoothing                    |
| BitZoom α=1.0      |    0.001 |       0.2212 |      0.1839 |   0.0559 |   0.0065 |    -0.2916 | Best BitZoom for topology                      |
| ForceAtlas2        |   53.578 |       0.0075 |      0.0064 |   0.0642 |   0.0075 |    -0.4048 | Shortest edges; 2000 iterations                |
| UMAP (Jaccard)     |   11.164 |       0.1822 |      0.0826 |   0.1066 |   0.0096 |     0.0108 | Only positive silhouette                       |
| t-SNE              |    2.780 |       0.1536 |      0.1040 |   0.1086 |   0.0093 |    -0.1184 | Highest topology neighborhood preservation     |

- Edge-only dataset: auto-generated tokens (group, label, structure, neighbors) provide
  little differentiation, so PropNbrP is uniformly low across all methods (0.006-0.010).
- UMAP and t-SNE recover department structure better than ForceAtlas2 or BitZoom
  (highest TopoNbrP, only positive silhouette from UMAP).
- BitZoom at α=1.0 is in the same TopoNbrP range as ForceAtlas2 (0.056 vs 0.064).

### 3.2 Facebook

Combined Facebook ego networks.
4,039 nodes, 88,234 edges. No ground-truth labels. UMAP skipped.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | TopoNbrP | PropNbrP | Note                                      |
| ------------------ | -------: | -----------: | ----------: | -------: | -------: | ----------------------------------------- |
| BitZoom α=0        |    0.006 |       0.4775 |      0.4618 |   0.0019 |   0.0016 | No topology; no meaningful structure      |
| BitZoom α=0.75     |    0.006 |       0.3861 |      0.3672 |   0.0050 |   0.0032 | Moderate smoothing; edges still long      |
| BitZoom α=1.0      |    0.006 |       0.0633 |      0.0320 |   0.1103 |   0.0026 | Similar TopoNbrP to FA2; edges 6x longer  |
| ForceAtlas2        |  171.659 |       0.0108 |      0.0071 |   0.1498 |   0.0033 | Shortest edges; highest TopoNbrP          |
| t-SNE              |   15.397 |       0.0714 |      0.0385 |   0.1764 |   0.0027 | Highest topology neighborhood preservation|

- Dense ego-network structure responds well to topology smoothing: BitZoom at α=1.0
  reaches 74% of ForceAtlas2's TopoNbrP (0.110 vs 0.150).
- PropNbrP is uniformly low (edge-only dataset).
- t-SNE produces the highest TopoNbrP (0.176), likely because its neighborhood-focused
  objective aligns well with dense community structure.

### 3.3 US Power Grid

Western US power grid (Watts-Strogatz small-world network).
4,941 nodes, 6,594 edges. No ground-truth labels. UMAP skipped.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | TopoNbrP | PropNbrP | Note                                           |
| ------------------ | -------: | -----------: | ----------: | -------: | -------: | ---------------------------------------------- |
| BitZoom α=0        |    0.007 |       0.5044 |      0.4888 |   0.0004 |   0.0014 | No structure captured                          |
| BitZoom α=0.75     |    0.008 |       0.2709 |      0.2478 |   0.0029 |   0.0015 | Best BitZoom; outperforms α=1.0                |
| BitZoom α=1.0      |    0.007 |       0.3801 |      0.3372 |   0.0034 |   0.0026 | Oversmoothing; worse than α=0.75               |
| ForceAtlas2        |  152.413 |       0.0054 |      0.0026 |   0.1968 |   0.0022 | Traces long chains via global forces           |
| t-SNE              |   25.859 |       0.1775 |      0.1191 |   0.0412 |   0.0018 | Also limited by sparse adjacency               |

- ForceAtlas2 dominates. Its global optimization traces the long chain structures
  (diameter ~46) that define the power grid.
- BitZoom's 5-pass smoothing cannot propagate signal along long chains. α=0.75
  outperforms α=1.0 because pure topology with few passes oversmooths hubs while
  leaving chains unresolved.
- PropNbrP is uniformly low (edge-only dataset).

### 3.4 MITRE ATT&CK

MITRE ATT&CK knowledge base (techniques, tactics, mitigations, relationships).
4,736 nodes, 25,856 edges. Node properties: platforms, kill chain phases, aliases.
UMAP skipped.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | TopoNbrP | PropNbrP | Note                                           |
| ------------------ | -------: | -----------: | ----------: | -------: | -------: | ---------------------------------------------- |
| BitZoom α=0        |    0.010 |       0.4612 |      0.4303 |   0.0013 |   0.0068 | Auto-generated tokens only                     |
| BitZoom α=0 wt     |    0.008 |       0.5335 |      0.5097 |   0.0015 |   0.0339 | Property weights: best PropNbrP of all methods |
| BitZoom α=0.5 wt   |    0.008 |       0.4821 |      0.4569 |   0.0016 |   0.0335 | Adding topology barely changes PropNbrP        |
| ForceAtlas2        |  177.867 |       0.2032 |      0.1836 |   0.0041 |   0.0132 | Shorter edges; topology doesn't help much      |
| t-SNE              |   23.083 |       0.2924 |      0.2882 |   0.0037 |   0.0259 | Second-highest PropNbrP                        |

- **BitZoom with property weights scores highest on PropNbrP** (0.034), 2.6x higher
  than ForceAtlas2 (0.013) and 1.3x higher than t-SNE (0.026). This directly measures
  BitZoom's core design goal: positioning nodes by property similarity.
- Without property weights (α=0), BitZoom's PropNbrP drops to 0.007 — comparable to
  the other methods. The property weights are what provide the signal.
- All methods score low on TopoNbrP. This graph has heterogeneous node types connected
  by typed relationships. Graph neighbors are often semantically different types.
- ForceAtlas2 produces shorter edges but does not group similar properties together.
- t-SNE scores second on PropNbrP (0.026), likely because adjacency correlates somewhat
  with property similarity in this dataset.

---

## 4. Analysis

### 4.1 Strengths and weaknesses by method

| Aspect                | ForceAtlas2                 | UMAP / t-SNE              | BitZoom                         |
| --------------------- | --------------------------- | ------------------------- | ------------------------------- |
| Edge length           | Best (optimizes for this)   | Moderate                  | Improves with α                 |
| Topology preservation | Strong; global forces       | Best overall (t-SNE)      | Comparable to FA2 on dense      |
| Property grouping     | Not measured; incidental    | Moderate (via adjacency)  | Best with property weights      |
| Sparse graph handling | Strong (global forces)      | Limited                   | Limited (local smoothing)       |
| Speed                 | Minutes (O(n log n)/iter)   | Seconds                   | Milliseconds (O(n))             |
| Hierarchical zoom     | No                          | No                        | 14 levels from 4 bytes/node     |
| Determinism           | Seed-dependent              | Seed-dependent            | Fully deterministic             |

### 4.2 Key findings

**Property-similarity preservation validates BitZoom's design goal.** On MITRE ATT&CK,
BitZoom with tuned property weights places property-similar nodes 2.6x closer together
than ForceAtlas2 and 1.3x closer than t-SNE. This is the first quantitative evidence
that BitZoom's property-first layout produces measurably better property grouping than
topology-optimized methods.

**The signal comes from property weights, not from topology.** BitZoom without property
weights (α=0, equal weights) scores 0.007 on PropNbrP — no better than ForceAtlas2.
With tuned weights (group=5, platforms=6, killchain=4), it scores 0.034. The α
parameter has minimal effect on PropNbrP: α=0 and α=0.5 produce nearly identical
property grouping (0.034 vs 0.034).

**Edge-only datasets show no property differentiation.** On Email-EU, Facebook, and
Power Grid, PropNbrP is uniformly low (0.001-0.013) across all methods. Auto-generated
tokens (group, label, structure, neighbors) do not provide enough signal for meaningful
property-based grouping. These datasets are topology benchmarks.

**Dense graphs respond well to topology smoothing.** On Facebook (88K edges, avg
degree 44), BitZoom at α=1.0 reaches 74% of ForceAtlas2's TopoNbrP. The dense
connectivity allows 5 smoothing passes to propagate signal effectively.

**Sparse graphs expose the limits of local smoothing.** On the power grid (diameter
~46), 5 passes cannot propagate signal along long chains. ForceAtlas2 handles this
through global repulsion/attraction. α=0.75 outperforms α=1.0 because pure topology
with few passes oversmooths hubs while leaving chains unresolved.

---

## 5. Limitations

- **Property-similarity metric limitations.** PropNbrP uses token-set Jaccard as the
  ground-truth similarity measure — the same similarity that BitZoom's MinHash
  approximates. This is circular to some extent: BitZoom optimizes a noisy version
  of the same objective it is measured against. A fully independent property-similarity
  metric (e.g., domain-expert labels) would be stronger evidence.

- **UMAP coverage.** UMAP was only run on Email-EU (1K nodes). On MITRE ATT&CK,
  UMAP on node properties (rather than adjacency) might score higher on PropNbrP than
  the adjacency-based UMAP tested here.

- **Fixed smoothing passes.** BitZoom uses 5 topology smoothing passes. More passes
  would improve topology preservation, particularly on sparse graphs, at increased
  computation cost. This tradeoff was not explored.

- **Small scale.** All datasets are under 5K nodes. At larger scales, ForceAtlas2
  requires longer runtimes while BitZoom's O(n) pipeline scales linearly. The relative
  characteristics may differ at 100K+ nodes.

- **Single run.** ForceAtlas2, UMAP, and t-SNE were run once per dataset. Variance
  across random seeds was not measured.

- **PropNbrP sampling.** Property neighborhood preservation is computed on a sample
  of 500 nodes for datasets larger than 500 nodes. Sampling introduces variance but
  keeps computation tractable (each query node requires O(n) pairwise Jaccard).
