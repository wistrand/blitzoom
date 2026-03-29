# BitZoom Layout Comparison Report

## 1. Summary

Six graph datasets were laid out using BitZoom (at multiple topology weights),
ForceAtlas2 (2000 iterations, Barnes-Hut), UMAP, and t-SNE. All methods received
the same input graphs. Layouts were evaluated on both topology preservation (edge
length, neighborhood overlap) and property-similarity preservation (whether nodes
with similar attributes end up nearby).

Three datasets have rich node properties (MITRE ATT&CK, Synth Packages, BitZoom
Source); three are edge-only (Email-EU, Facebook, Power Grid). The results confirm
that these methods optimize for different objectives.

On datasets where property similarity and graph connectivity diverge (MITRE, Synth
Packages), BitZoom with property weights scores highest on PropNbrP. On BitZoom Source,
where call-graph edges correlate with file/kind similarity, topology-based methods
score higher on PropNbrP because adjacency already captures property structure.

| Dataset        | Nodes | Edges  | Properties | BitZoom config          | PropNbrP ratio | TopoNbrP ratio |
| -------------- | ----: | -----: | ---------- | ----------------------- | -------------: | -------------: |
| MITRE          | 4,736 | 25,856 | rich       | α=0 weighted, rank      |          2.57x |          0.37x |
| Synth Packages | 1,868 |  4,044 | rich       | α=0 weighted, rank      |          6.02x |          0.31x |
| BZ Source      |   433 |    940 | rich       | α=0.5 weighted, gaussian |          0.95x |          0.28x |
| Email-EU       | 1,005 | 16,706 | edge-only  | α=1.0                  |          0.87x |          0.87x |
| Facebook       | 4,039 | 88,234 | edge-only  | α=1.0                  |          0.79x |          0.74x |
| Power Grid     | 4,941 |  6,594 | edge-only  | α=0.75                 |          0.68x |          0.01x |

Ratios are BitZoom / ForceAtlas2. Higher = better for both columns.

---

## 2. Methodology

### 2.1 Algorithms

**BitZoom.** MinHash property signatures projected to 2D via Gaussian random matrices,
blended with iterative topology smoothing (5 passes), quantized to a uint16 grid.
Tested at topology weights α = 0, 0.5, 0.75, and 1.0, with and without property
weights.

**ForceAtlas2.** [`fa2-modified`](https://pypi.org/project/fa2-modified/) with
Barnes-Hut optimization (θ=1.2), 2000 iterations, scalingRatio=2, gravity=1.
O(n log n) per iteration.

**UMAP.** umap-learn, Jaccard metric on binary adjacency rows, 2 components, seed=42.
Run on Email-EU (1K nodes) and BitZoom Source (433 nodes). Skipped on larger datasets
due to the cost of computing on dense n x n adjacency matrices.

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

| Dataset        | Nodes | Edges  | Source        | Properties                         | Ground truth   |
| -------------- | ----: | -----: | ------------- | ---------------------------------- | -------------- |
| MITRE          | 4,736 | 25,856 | MITRE ATT&CK  | platforms, kill chain, aliases      | none           |
| Synth Packages | 1,868 |  4,044 | synthetic     | group, downloads, license, version  | none           |
| BZ Source      |   433 |    940 | this repo     | kind, file, lines, bytes, age       | none           |
| Email-EU       | 1,005 | 16,706 | Stanford SNAP | none (edge-only)                   | 42 departments |
| Facebook       | 4,039 | 88,234 | Stanford SNAP | none (edge-only)                   | none           |
| Power Grid     | 4,941 |  6,594 | KONECT        | none (edge-only)                   | none           |

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

## 3. Results: property-rich datasets

### 3.1 MITRE ATT&CK

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

### 3.2 Synth Packages

Synthetic package registry graph with designed group structure.
1,868 nodes, 4,044 edges. Properties: group, downloads, license, version, depcount.
UMAP skipped.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | TopoNbrP | PropNbrP | Note                                           |
| ------------------ | -------: | -----------: | ----------: | -------: | -------: | ---------------------------------------------- |
| BitZoom α=0        |    0.002 |       0.4695 |      0.4566 |   0.0028 |   0.0099 | No property weights                            |
| BitZoom α=0 wt     |    0.002 |       0.3868 |      0.3454 |   0.0056 |   0.0494 | Property weights: best PropNbrP                |
| BitZoom α=0.5 wt   |    0.003 |       0.3064 |      0.2644 |   0.0106 |   0.0388 | Adding topology trades PropNbrP for TopoNbrP   |
| ForceAtlas2        |  150.533 |       0.0303 |      0.0271 |   0.0183 |   0.0082 | Shortest edges; low PropNbrP                   |
| t-SNE              |    8.653 |       0.2177 |      0.2089 |   0.0014 |   0.0119 | Low on both metrics                            |

- BitZoom with weights scores 6x higher than ForceAtlas2 on PropNbrP (0.049 vs 0.008).
  Property similarity and graph connectivity diverge in this dataset (edges are
  co-reference links, not property-based).
- Adding topology (α=0.5) improves TopoNbrP (0.006 → 0.011) at the cost of PropNbrP
  (0.049 → 0.039), showing the α parameter directly trades between the two objectives.
- t-SNE scores low on both metrics, suggesting the adjacency matrix provides little
  structure for embedding.

### 3.3 BitZoom Source

Call graph of this project's source code.
433 nodes, 940 edges. Properties: kind, file, lines, bytes, age.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | TopoNbrP | PropNbrP | Note                                           |
| ------------------ | -------: | -----------: | ----------: | -------: | -------: | ---------------------------------------------- |
| BitZoom α=0        |    0.001 |       0.4875 |      0.4671 |   0.0102 |   0.0502 | No property weights                            |
| BitZoom α=0 wt     |    0.001 |       0.4197 |      0.3543 |   0.0188 |   0.1718 | Property weights help significantly             |
| BitZoom α=0.5 wt   |    0.002 |       0.2673 |      0.2233 |   0.0316 |   0.1785 | Best BitZoom; topology + properties            |
| ForceAtlas2        |   12.463 |       0.0307 |      0.0246 |   0.1269 |   0.2077 | Shortest edges; high PropNbrP via adjacency    |
| UMAP               |   13.134 |       0.1148 |      0.0280 |   0.0822 |   0.2437 | Highest PropNbrP                               |
| t-SNE              |    2.960 |       0.2776 |      0.1852 |   0.0475 |   0.2039 | High PropNbrP via adjacency                    |

- ForceAtlas2, UMAP, and t-SNE all score higher than BitZoom on PropNbrP (0.20-0.24
  vs 0.17-0.18). In this call-graph dataset, functions that call each other tend to
  be in the same file with similar properties, so topology preserves property structure
  incidentally. This is an honest result: when adjacency correlates with property
  similarity, topology-based methods capture both.
- BitZoom α=0.5 with weights reaches 0.179 PropNbrP — within 14% of ForceAtlas2.
  Adding topology helps here because the correlation is real.
- UMAP scores highest on PropNbrP (0.244), likely because Jaccard on adjacency rows
  captures file-level clustering effectively.

## 4. Results: edge-only datasets

### 4.1 Email-EU

European research institution email network.
1,005 nodes, 16,706 edges, 42 department ground-truth labels.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | TopoNbrP | PropNbrP | Silhouette | Note                                           |
| ------------------ | -------: | -----------: | ----------: | -------: | -------: | ---------: | ---------------------------------------------- |
| BitZoom α=0        |    0.002 |       0.4663 |      0.4614 |   0.0058 |   0.0073 |    -0.4710 | No topology signal; near-random layout         |
| BitZoom α=1.0      |    0.001 |       0.2212 |      0.1839 |   0.0559 |   0.0065 |    -0.2916 | Best BitZoom for topology                      |
| ForceAtlas2        |   53.578 |       0.0075 |      0.0064 |   0.0642 |   0.0075 |    -0.4048 | Shortest edges                                 |
| UMAP (Jaccard)     |   11.164 |       0.1822 |      0.0826 |   0.1066 |   0.0096 |     0.0108 | Only positive silhouette                       |
| t-SNE              |    2.780 |       0.1536 |      0.1040 |   0.1086 |   0.0093 |    -0.1184 | Highest TopoNbrP                               |

- PropNbrP is uniformly low (0.006-0.010) across all methods. Auto-generated tokens
  provide little differentiation.
- UMAP and t-SNE recover department structure best (highest TopoNbrP, only positive
  silhouette from UMAP).
- BitZoom at α=1.0 is in the same TopoNbrP range as ForceAtlas2 (0.056 vs 0.064).

### 4.2 Facebook

Combined Facebook ego networks.
4,039 nodes, 88,234 edges. No ground-truth labels. UMAP skipped.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | TopoNbrP | PropNbrP | Note                                      |
| ------------------ | -------: | -----------: | ----------: | -------: | -------: | ----------------------------------------- |
| BitZoom α=1.0      |    0.006 |       0.0633 |      0.0320 |   0.1103 |   0.0026 | 74% of FA2's TopoNbrP                     |
| ForceAtlas2        |  171.659 |       0.0108 |      0.0071 |   0.1498 |   0.0033 | Shortest edges                            |
| t-SNE              |   15.397 |       0.0714 |      0.0385 |   0.1764 |   0.0027 | Highest TopoNbrP                          |

- Dense ego-network structure responds well to topology smoothing.
- PropNbrP is uniformly low (edge-only dataset).

### 4.3 US Power Grid

Western US power grid (Watts-Strogatz small-world network).
4,941 nodes, 6,594 edges. No ground-truth labels. UMAP skipped.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | TopoNbrP | PropNbrP | Note                                           |
| ------------------ | -------: | -----------: | ----------: | -------: | -------: | ---------------------------------------------- |
| BitZoom α=0.75     |    0.008 |       0.2709 |      0.2478 |   0.0029 |   0.0015 | Best BitZoom; α=1.0 is worse                   |
| ForceAtlas2        |  152.413 |       0.0054 |      0.0026 |   0.1968 |   0.0022 | Traces long chains via global forces           |
| t-SNE              |   25.859 |       0.1775 |      0.1191 |   0.0412 |   0.0018 | Limited by sparse adjacency                    |

- ForceAtlas2 dominates. Its global optimization traces long chains (diameter ~46)
  that 5-pass local smoothing cannot reach.
- α=0.75 outperforms α=1.0: pure topology with few passes oversmooths hubs while
  leaving chains unresolved.

---

## 5. Analysis

### 5.1 Strengths and weaknesses by method

| Aspect                | ForceAtlas2                 | UMAP / t-SNE              | BitZoom                         |
| --------------------- | --------------------------- | ------------------------- | ------------------------------- |
| Edge length           | Best (optimizes for this)   | Moderate                  | Improves with α                 |
| Topology preservation | Strong; global forces       | Best overall (t-SNE)      | Comparable to FA2 on dense      |
| Property grouping     | Incidental; depends on adj. | Moderate (via adjacency)  | Best when props ≠ topology      |
| Sparse graph handling | Strong (global forces)      | Limited                   | Limited (local smoothing)       |
| Speed                 | Minutes (O(n log n)/iter)   | Seconds                   | Milliseconds (O(n))             |
| Hierarchical zoom     | No                          | No                        | 14 levels from 4 bytes/node     |
| Determinism           | Seed-dependent              | Seed-dependent            | Fully deterministic             |

### 5.2 Key findings

**BitZoom leads on property grouping when properties diverge from topology.** On MITRE
ATT&CK (PropNbrP 0.034 vs FA2's 0.013, 2.6x) and Synth Packages (0.049 vs 0.008,
6x), BitZoom with property weights places property-similar nodes substantially closer
together. These datasets have weak correlation between graph connectivity and property
similarity — edges connect different types (technique→mitigation) or are co-reference
links unrelated to package attributes.

**Topology-based methods win when adjacency correlates with properties.** On BitZoom
Source, ForceAtlas2 (0.208) and UMAP (0.244) both outscore BitZoom (0.179) on PropNbrP.
Functions that call each other tend to be in the same file with similar properties, so
topology captures property structure incidentally. BitZoom still reaches 86% of FA2's
PropNbrP when combining weights with topology (α=0.5).

**The signal comes from property weights.** BitZoom without property weights scores
near baseline on PropNbrP across all datasets. With tuned weights it scores 2-6x higher
than ForceAtlas2 on MITRE and Synth Packages. The α parameter has minimal effect on
PropNbrP: it trades between topology and property objectives.

**Edge-only datasets show no property differentiation.** On Email-EU, Facebook, and
Power Grid, PropNbrP is uniformly low (0.001-0.013) across all methods. Auto-generated
tokens do not provide enough signal for meaningful property grouping.

**Dense graphs respond well to topology smoothing.** On Facebook (88K edges, avg
degree 44), BitZoom at α=1.0 reaches 74% of ForceAtlas2's TopoNbrP. The dense
connectivity allows 5 smoothing passes to propagate signal effectively.

**Sparse graphs expose the limits of local smoothing.** On the power grid (diameter
~46), 5 passes cannot propagate signal along long chains. ForceAtlas2 handles this
through global repulsion/attraction. α=0.75 outperforms α=1.0 because pure topology
with few passes oversmooths hubs while leaving chains unresolved.

### 5.3 Quantization mode: rank vs gaussian

BitZoom supports two quantization modes: rank (uniform occupancy) and Gaussian
(fixed CDF boundaries preserving density). All main results above use rank
quantization. Gaussian quantization was tested on the two property-rich datasets:

| Dataset        | Config      | Quant    | TopoNbrP | PropNbrP | Change       |
| -------------- | ----------- | -------- | -------: | -------: | ------------ |
| BZ Source      | α=0 wt     | rank     |   0.0188 |   0.1718 |              |
| BZ Source      | α=0 wt     | gaussian |   0.0190 |   0.1790 | PropNbrP +4% |
| BZ Source      | α=0.5 wt   | rank     |   0.0316 |   0.1785 |              |
| BZ Source      | α=0.5 wt   | gaussian |   0.0354 |   0.1983 | PropNbrP +11% |
| Synth Packages | α=0 wt     | rank     |   0.0056 |   0.0494 |              |
| Synth Packages | α=0 wt     | gaussian |   0.0054 |   0.0500 | PropNbrP +1% |
| Synth Packages | α=0.5 wt   | rank     |   0.0106 |   0.0388 |              |
| Synth Packages | α=0.5 wt   | gaussian |   0.0102 |   0.0381 | PropNbrP -2% |

On BitZoom Source, Gaussian quantization improves PropNbrP by 4-11%, with the larger
gain at α=0.5. This is consistent with the spec: Gaussian quantization preserves
density structure, concentrating resolution where nodes cluster rather than spreading
them uniformly. For this dataset, the best BitZoom configuration (α=0.5 weighted,
Gaussian) reaches PropNbrP 0.198 — within 5% of ForceAtlas2's 0.208.

On Synth Packages, the difference is negligible (±2%). The post-blend distribution
in this dataset is closer to uniform, so the density-preserving advantage of Gaussian
quantization does not manifest.

The effect is dataset-dependent. Gaussian quantization helps when the post-blend
coordinate distribution has meaningful density variation (clusters of varying tightness).
When the distribution is approximately uniform, the two modes produce similar results.

---

## 6. Limitations

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
