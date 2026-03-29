# BitZoom Layout Comparison Report

## 1. Summary

Four graph datasets were laid out using BitZoom (at multiple topology weights),
force-directed (Fruchterman-Reingold, 500 iterations), UMAP, and t-SNE. All methods
received the same input graphs. Layouts were evaluated on edge length, neighborhood
preservation, and cluster quality.

The results reflect different design goals. Force-directed minimizes edge lengths and
produces the tightest topological layouts. UMAP and t-SNE preserve neighborhood
structure from the adjacency matrix. BitZoom provides deterministic property-similarity
positioning with hierarchical zoom levels and completes in milliseconds rather than
minutes.

| Dataset     | Nodes | Edges  | BitZoom config | Speedup vs FD | EdgeLen ratio | NbrPreserv ratio | Note                                      |
| ----------- | ----: | -----: | -------------- | ------------: | ------------: | ---------------: | ----------------------------------------- |
| Email-EU    | 1,005 | 16,706 | α=1.0          |      ~32,000x |            9x |             1.3x | Comparable neighborhood quality to FD     |
| Facebook    | 4,039 | 88,234 | α=1.0          |      ~55,000x |            6x |            0.95x | Dense community structure transfers well  |
| Power Grid  | 4,941 |  6,594 | α=0.75         |      ~53,000x |           43x |            0.02x | Sparse chains beyond smoothing reach      |
| MITRE       | 4,736 | 25,856 | α=0.5 weighted |      ~44,000x |            4x |            0.52x | All methods score low on this graph       |

Ratios are BitZoom / Force-Directed. Lower EdgeLen = better. Higher NbrPreserv = better.

---

## 2. Methodology

### 2.1 Algorithms

**BitZoom.** MinHash property signatures projected to 2D via Gaussian random matrices,
blended with iterative topology smoothing (5 passes), quantized to a uint16 grid.
Tested at topology weights α = 0, 0.5, 0.75, and 1.0, with and without property
weights.

**Force-Directed (Fruchterman-Reingold).** NetworkX `spring_layout`, 500 iterations,
seed=42. Repulsive forces between all node pairs, attractive forces along edges.

**UMAP.** umap-learn, Jaccard metric on binary adjacency rows, 2 components, seed=42.
Only run on Email-EU (1K nodes). Skipped on larger datasets due to the cost of
computing on dense n x n adjacency matrices.

**t-SNE.** scikit-learn TSNE on binary adjacency rows, 2 components, seed=42,
perplexity = min(30, n-1).

### 2.2 Metrics

**EdgeLen (mean / median).** Normalized Euclidean distance between connected nodes.
Lower means connected nodes are placed closer. Distances normalized by layout span
(max coordinate range across both axes) for cross-algorithm comparability.

**NbrPreserv.** Jaccard overlap between each node's k=10 nearest graph neighbors and
k=10 nearest layout neighbors (Euclidean distance, KD-tree). Higher means the layout
reflects graph connectivity in spatial proximity. A score of 1.0 would mean perfect
overlap.

**Silhouette.** Silhouette score of layout positions against ground-truth community
labels. Ranges from -1 to +1. Positive values indicate same-community nodes are closer
than different-community nodes. Only available for Email-EU (42 departments).

**Time.** Wall-clock seconds. BitZoom times include full pipeline execution in the
export script. Force-directed, UMAP, and t-SNE times measure layout computation only.

### 2.3 Datasets

| Dataset    | Nodes | Edges  | Source        | Properties                    | Ground truth   |
| ---------- | ----: | -----: | ------------- | ----------------------------- | -------------- |
| Email-EU   | 1,005 | 16,706 | Stanford SNAP | none (edge-only)              | 42 departments |
| Facebook   | 4,039 | 88,234 | Stanford SNAP | none (edge-only)              | none           |
| Power Grid | 4,941 |  6,594 | KONECT        | none (edge-only)              | none           |
| MITRE      | 4,736 | 25,856 | MITRE ATT&CK  | platforms, kill chain, aliases | none           |

Edge counts reflect undirected edges after deduplication by NetworkX. Email-EU ground
truth labels are from the SNAP companion file `email-Eu-core-department-labels.txt`.

### 2.4 Pipeline and reproducibility

1. **Export BitZoom layouts** (Deno, native). `benchmarks/export-layout.ts` runs the
   full pipeline (parse, tokenize, MinHash, project, blend, quantize) and writes node
   positions as TSV. Multiple configurations exported per dataset.

2. **Compute competing layouts** (Python 3.12, Docker). `benchmarks/compare-layouts.py`
   loads the same edge file, computes force-directed / UMAP / t-SNE, imports BitZoom
   exports, and evaluates all layouts on the same metrics. Runs inside a Docker
   container (`python:3.12-slim` with networkx, scikit-learn, umap-learn, scipy).

3. **Evaluate metrics** on all layouts against the same edge list and ground-truth
   labels where available.

```sh
# Reproduce from repository root (requires Deno and Docker):
bash benchmarks/run-comparison.sh
```

Total runtime is approximately 40 minutes, dominated by force-directed layout on
the 4-5K node datasets.

---

## 3. Results

### 3.1 Email-EU

European research institution email network.
1,005 nodes, 16,706 edges, 42 department ground-truth labels.

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | NbrPreserv | Silhouette | Note                                           |
| ------------------ | -------: | -----------: | ----------: | ---------: | ---------: | ---------------------------------------------- |
| BitZoom α=0        |    0.002 |       0.4663 |      0.4614 |     0.0058 |    -0.4710 | No topology signal; near-random layout         |
| BitZoom α=0.5      |    0.002 |       0.4480 |      0.4419 |     0.0074 |    -0.4537 | Marginal improvement from topology             |
| BitZoom α=0.75     |    0.002 |       0.4348 |      0.4283 |     0.0079 |    -0.4570 | Limited by 5-pass smoothing                    |
| BitZoom α=1.0      |    0.002 |       0.2212 |      0.1839 |     0.0559 |    -0.2916 | Best BitZoom; edges 9x longer than FD          |
| Force-Directed     |   63.932 |       0.0244 |      0.0218 |     0.0426 |    -0.3301 | Shortest edges; 500 iterations                 |
| UMAP (Jaccard)     |   17.511 |       0.1822 |      0.0826 |     0.1066 |     0.0108 | Only positive silhouette; best cluster quality |
| t-SNE              |    4.920 |       0.1536 |      0.1040 |     0.1086 |    -0.1184 | Highest neighborhood preservation              |

- Force-directed produces the shortest edges (it optimizes directly for this).
- UMAP and t-SNE produce the best neighborhood preservation and are the only methods
  with positive silhouette scores, recovering department structure from adjacency alone.
- BitZoom at α=1.0 halves edge lengths compared to α=0. Neighborhood preservation is
  in the same range as force-directed but below UMAP and t-SNE.

### 3.2 Facebook

Combined Facebook ego networks.
4,039 nodes, 88,234 edges. No ground-truth labels. UMAP skipped (dense matrix too slow).

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | NbrPreserv | Note                                      |
| ------------------ | -------: | -----------: | ----------: | ---------: | ----------------------------------------- |
| BitZoom α=0        |    0.010 |       0.4775 |      0.4618 |     0.0019 | No topology; no meaningful structure      |
| BitZoom α=0.75     |    0.010 |       0.3861 |      0.3672 |     0.0050 | Moderate smoothing; edges still long      |
| BitZoom α=1.0      |    0.010 |       0.0633 |      0.0320 |     0.1103 | Similar NbrP to FD; edges 6x longer       |
| Force-Directed     |  545.432 |       0.0112 |      0.0077 |     0.1157 | Shortest edges; 9 minutes computation     |
| t-SNE              |   21.708 |       0.0714 |      0.0385 |     0.1764 | Highest neighborhood preservation         |

- BitZoom at α=1.0 produces similar neighborhood preservation to force-directed
  (0.110 vs 0.116) with longer edges (0.063 vs 0.011).
- t-SNE produces the highest neighborhood preservation (0.176).
- The dense ego-network structure responds well to topology smoothing: 5 passes at
  α=1.0 capture most of the community structure.

### 3.3 US Power Grid

Western US power grid (Watts-Strogatz small-world network).
4,941 nodes, 6,594 edges. No ground-truth labels. UMAP skipped (dense matrix too slow).

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | NbrPreserv | Note                                           |
| ------------------ | -------: | -----------: | ----------: | ---------: | ---------------------------------------------- |
| BitZoom α=0        |    0.026 |       0.5044 |      0.4888 |     0.0004 | No structure captured                          |
| BitZoom α=0.75     |    0.014 |       0.2709 |      0.2478 |     0.0029 | Best BitZoom; outperforms α=1.0                |
| BitZoom α=1.0      |    0.013 |       0.3801 |      0.3372 |     0.0034 | Oversmoothing; worse than α=0.75               |
| Force-Directed     |  741.325 |       0.0063 |      0.0044 |     0.1874 | Traces long chains via global forces           |
| t-SNE              |   36.059 |       0.1775 |      0.1191 |     0.0412 | Limited by sparse adjacency (avg degree 2.7)   |

- Force-directed dominates. Its 500-iteration global optimization traces the long chain
  structures (diameter ~46) that define the power grid.
- BitZoom's 5-pass smoothing diffuses locally and cannot propagate signal along long
  chains. This is the expected limitation of iterative local smoothing.
- α=0.75 outperforms α=1.0: pure topology with only 5 passes causes oversmoothing in
  well-connected subgraphs while leaving long chains unresolved. The 25% property term
  provides beneficial spreading.
- t-SNE also scores low relative to force-directed. The adjacency matrix is extremely
  sparse (avg degree 2.67), offering little structure to embed.

### 3.4 MITRE ATT&CK

MITRE ATT&CK knowledge base (techniques, tactics, mitigations, relationships).
4,736 nodes, 25,856 edges. Node properties: platforms, kill chain phases, aliases.
No ground-truth labels. UMAP skipped (dense matrix too slow).

| Layout             | Time (s) | EdgeLen mean | EdgeLen med | NbrPreserv | Note                                           |
| ------------------ | -------: | -----------: | ----------: | ---------: | ---------------------------------------------- |
| BitZoom α=0        |    0.016 |       0.4612 |      0.4303 |     0.0013 | Groups by auto-generated properties            |
| BitZoom α=0 wt     |    0.016 |       0.5335 |      0.5097 |     0.0015 | Property weights increase edge length          |
| BitZoom α=0.5 wt   |    0.016 |       0.4821 |      0.4569 |     0.0016 | Topology helps slightly                        |
| Force-Directed     |  703.272 |       0.1185 |      0.0844 |     0.0031 | Shortest edges; all methods score low on NbrP  |
| t-SNE              |   25.683 |       0.2924 |      0.2882 |     0.0037 | Highest NbrP but still very low                |

- All methods score low on neighborhood preservation. MITRE ATT&CK has heterogeneous
  node types connected by typed relationships. Graph neighbors are often semantically
  different node types, not similar nodes.
- Property weights (group=5, platforms=6, killchain=4) increase edge length compared
  to unweighted. Property similarity and graph connectivity are weakly correlated in
  this dataset.
- BitZoom's property-first layout groups nodes by attributes (platform, kill chain
  phase) rather than graph distance. The topology-oriented metrics above do not
  capture this.

---

## 4. Analysis

### 4.1 Strengths and weaknesses by method

| Aspect                 | Force-Directed            | UMAP / t-SNE              | BitZoom                       |
| ---------------------- | ------------------------- | ------------------------- | ----------------------------- |
| Edge length            | Best (optimizes for this) | Moderate                  | Worst at low α; improves with α |
| Neighborhood preserv.  | Good on dense graphs      | Best overall              | Comparable to FD at high α    |
| Cluster separation     | Moderate                  | Best (positive silhouette)| Poor without property signal  |
| Sparse graph handling  | Strong (global forces)    | Limited                   | Limited (local smoothing)     |
| Speed                  | Minutes (O(n^2)/iter)     | Seconds                   | Milliseconds (O(n))           |
| Hierarchical zoom      | No                        | No                        | Yes (14 levels from 4 bytes)  |
| Property grouping      | No                        | Possible with features    | Primary design goal           |
| Determinism            | Seed-dependent            | Seed-dependent            | Fully deterministic           |

### 4.2 Key findings

**Dense graphs respond well to topology smoothing.** On Facebook (88K edges,
avg degree 44), BitZoom at α=1.0 produces neighborhood preservation within 5% of
force-directed. The dense connectivity allows 5 smoothing passes to propagate signal
effectively.

**Sparse graphs expose the limits of local smoothing.** On the power grid (6.6K edges,
avg degree 2.7, diameter ~46), 5 passes propagate information at most 5 hops.
Force-directed's global repulsion/attraction model handles this naturally. Increasing
the pass count would help at the cost of computation time.

**Property similarity and graph connectivity can diverge.** On MITRE ATT&CK, property
weights increase edge length because nodes connected by edges often have different
attributes (a technique connects to a mitigation, not to another similar technique).
All methods score low on neighborhood preservation for this graph.

**α=1.0 is not always optimal.** On the power grid, α=0.75 outperforms α=1.0 because
pure topology smoothing with few passes oversmooths well-connected subgraphs while
leaving long chains unresolved.

**These metrics do not measure property-similarity layout quality.** All three metrics
(edge length, neighborhood preservation, silhouette) evaluate topology preservation.
BitZoom's primary design goal is positioning nodes by property similarity, which
would require a separate metric (e.g., do nodes with similar properties end up
nearby?).

---

## 5. Limitations

- **Topology-only metrics.** All metrics evaluate how well the layout preserves graph
  connectivity. A property-similarity metric would provide a more complete picture but
  requires ground-truth property groupings not available for most datasets.

- **Force-directed implementation.** NetworkX `spring_layout` is pure Python and
  slow. A C or GPU implementation (e.g., ForceAtlas2 in Gephi) would be faster,
  narrowing the speed gap. Layout quality results would be similar.

- **UMAP input representation.** UMAP was run with Jaccard metric on binary adjacency
  rows. Graph-aware UMAP variants or node2vec embeddings might produce different
  results.

- **Fixed smoothing passes.** BitZoom uses 5 topology smoothing passes. More passes
  would improve topology preservation, particularly on sparse graphs, at increased
  computation cost. This tradeoff was not explored.

- **Small scale.** All datasets are under 5K nodes. At larger scales, force-directed
  requires Barnes-Hut approximation or GPU acceleration, while BitZoom's O(n) pipeline
  scales linearly. The relative performance characteristics may differ at 100K+ nodes.

- **Single run.** Force-directed, UMAP, and t-SNE were run once per dataset with a
  fixed seed. Variance across seeds was not measured.
