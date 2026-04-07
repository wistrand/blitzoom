#!/usr/bin/env python3
"""
Compare Blitzoom layout against force-directed, UMAP, and t-SNE.

Usage:
  python benchmarks/compare-layouts.py \
    --edges docs/data/email-eu.edges \
    --blitzoom benchmarks/layouts/email-eu-a075.tsv \
    --ground-truth benchmarks/ground-truth/email-eu-departments.txt \
    --out benchmarks/results/email-eu.txt

Requirements:
  pip install networkx scikit-learn umap-learn numpy scipy
"""

import argparse
import time
import numpy as np
from pathlib import Path

def parse_edges(path):
    """Parse SNAP edge file. Returns list of (src, dst) tuples."""
    edges = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('\t')
            if len(parts) < 2:
                parts = line.split()
            edges.append((parts[0], parts[1]))
    return edges

def parse_blitzoom(path):
    """Parse Blitzoom export TSV. Returns dict {id: (px, py)}."""
    pos = {}
    with open(path) as f:
        for line in f:
            if line.startswith('#'):
                continue
            parts = line.strip().split('\t')
            pos[parts[0]] = (float(parts[1]), float(parts[2]))
    return pos

def parse_tokens(path):
    """Parse token sets file. Returns dict {id: set of tokens}."""
    tokens = {}
    with open(path) as f:
        for line in f:
            if line.startswith('#'):
                continue
            parts = line.strip().split('\t', 1)
            if len(parts) == 2:
                tokens[parts[0]] = set(parts[1].split())
            else:
                tokens[parts[0]] = set()
    return tokens

def parse_ground_truth(path):
    """Parse ground truth labels. Format: id<whitespace>label per line."""
    labels = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split()
            labels[parts[0]] = int(parts[1])
    return labels

def build_graph(edges):
    """Build NetworkX graph from edge list."""
    import networkx as nx
    G = nx.Graph()
    for src, dst in edges:
        G.add_edge(src, dst)
    return G

def layout_force_directed(G):
    """ForceAtlas2 layout (Barnes-Hut accelerated)."""
    from fa2_modified import ForceAtlas2
    fa2 = ForceAtlas2(barnesHutOptimize=True, barnesHutTheta=1.2,
                      scalingRatio=2.0, gravity=1.0, verbose=False)
    t0 = time.time()
    pos = fa2.forceatlas2_networkx_layout(G, iterations=2000)
    elapsed = time.time() - t0
    return {str(k): (float(v[0]), float(v[1])) for k, v in pos.items()}, elapsed

def layout_umap(G):
    """UMAP on adjacency matrix."""
    import umap
    nodes = sorted(G.nodes())
    node_idx = {n: i for i, n in enumerate(nodes)}
    n = len(nodes)

    # Use adjacency matrix rows as feature vectors
    adj = np.zeros((n, n), dtype=np.float32)
    for u, v in G.edges():
        i, j = node_idx[u], node_idx[v]
        adj[i, j] = 1
        adj[j, i] = 1

    t0 = time.time()
    embedding = umap.UMAP(n_components=2, random_state=42, metric='jaccard').fit_transform(adj)
    elapsed = time.time() - t0
    pos = {nodes[i]: (float(embedding[i, 0]), float(embedding[i, 1])) for i in range(n)}
    return pos, elapsed

def layout_tsne(G):
    """t-SNE on adjacency matrix."""
    from sklearn.manifold import TSNE
    nodes = sorted(G.nodes())
    node_idx = {n: i for i, n in enumerate(nodes)}
    n = len(nodes)

    adj = np.zeros((n, n), dtype=np.float32)
    for u, v in G.edges():
        i, j = node_idx[u], node_idx[v]
        adj[i, j] = 1
        adj[j, i] = 1

    t0 = time.time()
    embedding = TSNE(n_components=2, random_state=42, perplexity=min(30, n - 1)).fit_transform(adj)
    elapsed = time.time() - t0
    pos = {nodes[i]: (float(embedding[i, 0]), float(embedding[i, 1])) for i in range(n)}
    return pos, elapsed

# ─── Metrics ──────────────────────────────────────────────────────────────────

def edge_length_stats(pos, edges):
    """Mean and median layout distance for edges. Lower = better topology preservation."""
    dists = []
    for src, dst in edges:
        if src in pos and dst in pos:
            p0, p1 = pos[src], pos[dst]
            if not (np.isfinite(p0[0]) and np.isfinite(p0[1]) and np.isfinite(p1[0]) and np.isfinite(p1[1])):
                continue
            dx = p0[0] - p1[0]
            dy = p0[1] - p1[1]
            dists.append(np.sqrt(dx * dx + dy * dy))
    if not dists:
        return float('nan'), float('nan')
    dists = np.array(dists)
    # Normalize by layout span
    all_coords = np.array([p for p in pos.values() if np.isfinite(p[0]) and np.isfinite(p[1])])
    span = np.max(all_coords, axis=0) - np.min(all_coords, axis=0)
    norm = np.max(span) if np.max(span) > 0 else 1
    dists /= norm
    return float(np.mean(dists)), float(np.median(dists))

def cluster_quality(pos, ground_truth):
    """Silhouette score of layout positions vs ground truth labels."""
    from sklearn.metrics import silhouette_score
    common = [n for n in pos if n in ground_truth
              and np.isfinite(pos[n][0]) and np.isfinite(pos[n][1])]
    if len(common) < 10:
        return float('nan')
    X = np.array([[pos[n][0], pos[n][1]] for n in common])
    y = np.array([ground_truth[n] for n in common])
    # Need at least 2 labels
    if len(set(y)) < 2:
        return float('nan')
    return float(silhouette_score(X, y))

def neighborhood_preservation(pos, G, k=10):
    """
    For each node, check overlap between k nearest graph neighbors
    and k nearest layout neighbors. Reports mean Jaccard.
    """
    from scipy.spatial import KDTree
    import networkx as nx

    nodes = sorted(pos.keys())
    node_idx = {n: i for i, n in enumerate(nodes)}
    coords = np.array([[pos[n][0], pos[n][1]] for n in nodes])

    # Filter out NaN/inf from layouts that fail to place some nodes
    finite_mask = np.isfinite(coords).all(axis=1)
    if not finite_mask.all():
        valid_idx = np.where(finite_mask)[0]
        coords_clean = coords[valid_idx]
        remap = {old: new for new, old in enumerate(valid_idx)}
    else:
        coords_clean = coords
        remap = None

    tree = KDTree(coords_clean)
    # Query k+1 because the node itself is included
    _, indices = tree.query(coords_clean, k=min(k + 1, len(coords_clean)))

    scores = []
    for i, n in enumerate(nodes):
        if n not in G or (remap is not None and i not in remap):
            continue
        ci = remap[i] if remap else i
        # Graph neighbors
        graph_nbrs = set()
        for nbr in G.neighbors(n):
            ni = node_idx.get(nbr)
            if ni is not None and (remap is None or ni in remap):
                graph_nbrs.add(remap[ni] if remap else ni)
        if not graph_nbrs:
            continue
        # Layout neighbors (exclude self)
        layout_nbrs = set(indices[ci, 1:k+1])
        # Jaccard
        inter = len(graph_nbrs & layout_nbrs)
        union = len(graph_nbrs | layout_nbrs)
        if union > 0:
            scores.append(inter / union)

    return float(np.mean(scores)) if scores else float('nan')

def property_neighborhood_preservation(pos, token_sets, k=10, max_nodes=500):
    """
    For each node (sampled if n > max_nodes), check overlap between k most
    property-similar nodes (by Jaccard on token sets) and k nearest layout
    neighbors. Reports mean Jaccard overlap.
    """
    from scipy.spatial import KDTree

    common = [n for n in pos if n in token_sets
              and np.isfinite(pos[n][0]) and np.isfinite(pos[n][1])]
    if len(common) < k + 1:
        return float('nan')

    node_list = sorted(common)
    coords = np.array([[pos[n][0], pos[n][1]] for n in node_list])
    n = len(node_list)

    tree = KDTree(coords)
    _, layout_nn = tree.query(coords, k=min(k + 1, n))

    # Sample query nodes for O(n) instead of O(n^2)
    rng = np.random.RandomState(42)
    if n > max_nodes:
        sample_idx = rng.choice(n, max_nodes, replace=False)
    else:
        sample_idx = np.arange(n)

    scores = []
    for i in sample_idx:
        ts_i = token_sets[node_list[i]]
        if not ts_i:
            continue
        # Find k most similar nodes by Jaccard (still O(n) per query node)
        sims = []
        for j in range(n):
            if i == j:
                continue
            ts_j = token_sets[node_list[j]]
            if not ts_j:
                continue
            inter = len(ts_i & ts_j)
            union = len(ts_i | ts_j)
            sims.append((inter / union if union > 0 else 0, j))
        sims.sort(key=lambda x: -x[0])
        prop_nbrs = set(j for _, j in sims[:k])
        layout_nbrs = set(layout_nn[i, 1:k+1])
        inter = len(prop_nbrs & layout_nbrs)
        union = len(prop_nbrs | layout_nbrs)
        if union > 0:
            scores.append(inter / union)

    return float(np.mean(scores)) if scores else float('nan')

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Compare graph layouts')
    parser.add_argument('--edges', required=True, help='SNAP edge file')
    parser.add_argument('--blitzoom', required=True, nargs='+', help='Blitzoom export TSV(s)')
    parser.add_argument('--ground-truth', help='Ground truth labels file')
    parser.add_argument('--out', help='Output file (default: stdout)')
    parser.add_argument('--skip-umap', action='store_true', help='Skip UMAP (requires umap-learn)')
    parser.add_argument('--skip-tsne', action='store_true', help='Skip t-SNE')
    parser.add_argument('--skip-fd', action='store_true', help='Skip force-directed')
    parser.add_argument('--tokens', help='Token sets file for property-similarity metrics')
    args = parser.parse_args()

    edges = parse_edges(args.edges)
    G = build_graph(edges)
    gt = parse_ground_truth(args.ground_truth) if args.ground_truth else None
    ts = parse_tokens(args.tokens) if args.tokens else None

    print(f'Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')
    if gt:
        print(f'Ground truth: {len(gt)} labels, {len(set(gt.values()))} classes')
    if ts:
        print(f'Token sets: {len(ts)} nodes')
    print()

    layouts = {}

    # Blitzoom layouts
    for bz_path in args.blitzoom:
        name = Path(bz_path).stem
        t0 = time.time()
        pos = parse_blitzoom(bz_path)
        elapsed = time.time() - t0
        layouts[f'Blitzoom:{name}'] = (pos, elapsed)

    # Competing layouts
    if not args.skip_fd:
        print('Computing force-directed layout...')
        pos, elapsed = layout_force_directed(G)
        layouts['Force-Directed'] = (pos, elapsed)

    if not args.skip_umap:
        try:
            print('Computing UMAP layout...')
            pos, elapsed = layout_umap(G)
            layouts['UMAP'] = (pos, elapsed)
        except ImportError:
            print('  Skipping UMAP (install umap-learn)')

    if not args.skip_tsne:
        try:
            print('Computing t-SNE layout...')
            pos, elapsed = layout_tsne(G)
            layouts['t-SNE'] = (pos, elapsed)
        except ImportError:
            print('  Skipping t-SNE (install scikit-learn)')

    print()

    # Evaluate
    header = f'{"Layout":<30} {"Time(s)":>8} {"EdgeLen(mean)":>14} {"EdgeLen(med)":>13} {"TopoNbrP":>9}'
    if ts:
        header += f' {"PropNbrP":>9}'
    if gt:
        header += f' {"Silhouette":>11}'
    lines = [header, '-' * len(header)]

    for name, (pos, elapsed) in layouts.items():
        mean_el, med_el = edge_length_stats(pos, edges)
        nbr = neighborhood_preservation(pos, G, k=10)
        row = f'{name:<30} {elapsed:>8.3f} {mean_el:>14.4f} {med_el:>13.4f} {nbr:>9.4f}'
        if ts:
            print(f'  Computing PropNbrP for {name}...')
            pnbr = property_neighborhood_preservation(pos, ts, k=10)
            row += f' {pnbr:>9.4f}'
        if gt:
            sil = cluster_quality(pos, gt)
            row += f' {sil:>11.4f}'
        lines.append(row)

    result = '\n'.join(lines)
    print(result)

    if args.out:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        with open(args.out, 'w') as f:
            f.write(f'# Dataset: {args.edges}\n')
            f.write(f'# Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}\n')
            if ts:
                f.write(f'# Token sets: {len(ts)} nodes\n')
            if gt:
                f.write(f'# Ground truth: {len(gt)} labels, {len(set(gt.values()))} classes\n')
            f.write(f'#\n')
            f.write(result + '\n')
        print(f'\nSaved to {args.out}')

if __name__ == '__main__':
    main()
