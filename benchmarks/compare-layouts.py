#!/usr/bin/env python3
"""
Compare BitZoom layout against force-directed, UMAP, and t-SNE.

Usage:
  python benchmarks/compare-layouts.py \
    --edges docs/data/email-eu.edges \
    --bitzoom benchmarks/layouts/email-eu-a075.tsv \
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

def parse_bitzoom(path):
    """Parse BitZoom export TSV. Returns dict {id: (px, py)}."""
    pos = {}
    with open(path) as f:
        for line in f:
            if line.startswith('#'):
                continue
            parts = line.strip().split('\t')
            pos[parts[0]] = (float(parts[1]), float(parts[2]))
    return pos

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
    """Force-directed layout (Fruchterman-Reingold)."""
    import networkx as nx
    t0 = time.time()
    pos = nx.spring_layout(G, iterations=500, seed=42)
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

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Compare graph layouts')
    parser.add_argument('--edges', required=True, help='SNAP edge file')
    parser.add_argument('--bitzoom', required=True, nargs='+', help='BitZoom export TSV(s)')
    parser.add_argument('--ground-truth', help='Ground truth labels file')
    parser.add_argument('--out', help='Output file (default: stdout)')
    parser.add_argument('--skip-umap', action='store_true', help='Skip UMAP (requires umap-learn)')
    parser.add_argument('--skip-tsne', action='store_true', help='Skip t-SNE')
    parser.add_argument('--skip-fd', action='store_true', help='Skip force-directed')
    args = parser.parse_args()

    edges = parse_edges(args.edges)
    G = build_graph(edges)
    gt = parse_ground_truth(args.ground_truth) if args.ground_truth else None

    print(f'Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges')
    if gt:
        print(f'Ground truth: {len(gt)} labels, {len(set(gt.values()))} classes')
    print()

    layouts = {}

    # BitZoom layouts
    for bz_path in args.bitzoom:
        name = Path(bz_path).stem
        t0 = time.time()
        pos = parse_bitzoom(bz_path)
        elapsed = time.time() - t0
        layouts[f'BitZoom:{name}'] = (pos, elapsed)

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
    header = f'{"Layout":<30} {"Time(s)":>8} {"EdgeLen(mean)":>14} {"EdgeLen(med)":>13} {"NbrPreserv":>11}'
    if gt:
        header += f' {"Silhouette":>11}'
    lines = [header, '-' * len(header)]

    for name, (pos, elapsed) in layouts.items():
        mean_el, med_el = edge_length_stats(pos, edges)
        nbr = neighborhood_preservation(pos, G, k=10)
        row = f'{name:<30} {elapsed:>8.3f} {mean_el:>14.4f} {med_el:>13.4f} {nbr:>11.4f}'
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
            if gt:
                f.write(f'# Ground truth: {len(gt)} labels, {len(set(gt.values()))} classes\n')
            f.write(f'#\n')
            f.write(result + '\n')
        print(f'\nSaved to {args.out}')

if __name__ == '__main__':
    main()
