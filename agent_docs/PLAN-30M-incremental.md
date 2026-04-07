# Plan: Incremental Loading for 30M+ Node Graphs

## Context

The current viewer loads all nodes into browser memory, runs the full pipeline client-side, and renders from RAM. This works up to ~500K nodes. Beyond that, memory and compute become prohibitive. At 30M nodes the dataset is ~17GB in memory, the pipeline takes hours, and Canvas2D can't render millions of circles.

The bit-shift hierarchy provides a natural solution: at any zoom level, the viewer only needs the supernodes for visible cells, not all 30M individual nodes. A precomputation step generates tile files; the viewer fetches only what's visible.

## Architecture

```
┌──────────────────────────────────────────────┐
│  CLI: bz-precompute                          │
│  (Deno, runs once per dataset)               │
│                                              │
│  SNAP files → pipeline → blend → quantize    │
│  → generate tile files per level             │
│  → store in docs/tiles/<dataset>/            │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Tile files (static, served by any HTTP)     │
│                                              │
│  tiles/<dataset>/                            │
│    manifest.json                             │
│    level-1.json    ... level-14.json         │
│    raw/                                      │
│      tile-0-0.json ... tile-255-255.json     │
│    ego/                                      │
│      <bid>.json    (on-demand, optional)     │
└──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Viewer: BlitzoomTiled                        │
│  (browser, <500MB memory)                    │
│                                              │
│  Fetches tiles by level + viewport           │
│  Renders supernodes as usual                 │
│  Ego subgraph on click                       │
└──────────────────────────────────────────────┘
```

## Phase 1: Precomputation CLI

### Script: `scripts/bz-precompute.ts`

**Input:** `.edges` + `.nodes` files (or `.gz`), output directory, options.

**Steps:**
1. Parse SNAP files (streaming line-by-line, not loading full text)
2. Build graph (same as `buildGraph` but writing nodes to a flat binary buffer instead of JS objects to reduce peak memory)
3. Compute projections (reuse existing `computeProjections`, process in chunks)
4. Blend + quantize (reuse `unifiedBlend`)
5. For each level 1-14:
   - Run `buildLevelNodes` → serialize supernodes to JSON
   - Run `buildLevelEdges` → serialize super-edges, keep only top-N by weight per level for overview (N=10000)
   - Write `level-{L}.json`
6. For RAW level: partition nodes into 256×256 spatial tiles by `gx >> 8, gy >> 8`
   - Each tile is a JSON file with individual nodes in that region
   - Only write non-empty tiles
7. Write `manifest.json` with dataset metadata

**Precomputed weight configurations:**
- Run blend+quantize for 3-5 preset weight configurations
- Store each as a separate tile set subdirectory: `tiles/<dataset>/balanced/`, `tiles/<dataset>/group-8/`, etc.
- The viewer switches between precomputed configurations instantly

### manifest.json

```json
{
  "name": "Amazon Co-purchase",
  "nodeCount": 367000,
  "edgeCount": 988000,
  "groupNames": ["group", "label", "structure", "neighbors", "category"],
  "presets": {
    "balanced": { "weights": {"group":3,"label":1}, "dir": "balanced" },
    "category": { "weights": {"category":8}, "dir": "category-8" }
  },
  "levels": [1,2,3,4,5,6,7,8,9,10,11,12,13,14],
  "rawTileGrid": 256,
  "rawTileCount": 18432
}
```

### Tile format: `level-{L}.json`

```json
{
  "supernodes": [
    {"bid":0,"cx":0,"cy":0,"ax":-0.95,"ay":-0.87,"members":142,"totalDegree":580,
     "domGroup":"electronics","color":"#dd5f5f","label":"electronics"},
    ...
  ],
  "edges": [
    {"a":0,"b":5,"weight":34},
    ...
  ]
}
```

At L4 with 30M nodes: ~256 supernodes, ~10K edges. ~50KB JSON.
At L8: ~50K supernodes, ~200K edges. ~5MB JSON. Consider gzip.

### RAW tile format: `raw/tile-{tx}-{ty}.json`

```json
{
  "nodes": [
    {"id":"ASIN_B001","label":"Widget","group":"electronics","degree":47,
     "px":0.234,"py":-0.156,"gx":41234,"gy":28901},
    ...
  ]
}
```

Average 460 nodes per tile at 30M total. ~20KB per tile.

## Phase 2: Tile Loader Module

### File: `docs/blitzoom-tiles.js`

New module, no DOM dependencies. Manages tile fetching, caching, and viewport tracking.

```
export class TileManager {
  constructor(baseUrl, manifest)

  // Fetch supernodes + edges for a level (cached)
  async getLevel(levelIdx) → { supernodes, snEdges }

  // Fetch RAW nodes visible in viewport
  async getRawTiles(gxMin, gxMax, gyMin, gyMax) → nodes[]

  // Fetch ego subgraph for a supernode
  async getEgo(bid, level) → { nodes, edges }

  // Invalidate cache (on preset switch)
  setPreset(presetName)

  // Memory management
  evictOldTiles(maxBytes)
}
```

**Caching strategy:**
- LRU cache keyed by `preset/level-{L}` and `preset/raw/tile-{tx}-{ty}`
- Evict when total cached bytes exceed 300MB
- Levels 1-6 are small enough to keep permanently
- RAW tiles evicted on pan

**Fetch strategy:**
- Levels 1-8: fetch entire level file (small enough)
- Levels 9-14: viewport-filtered — compute visible cell range, fetch only those tiles
- RAW: always viewport-filtered, 3×3 tile neighborhood around viewport center

### Integration with BlitzoomCanvas

`BlitzoomCanvas` currently expects all data in memory via constructor opts. For tiled mode:

Option A: Create `BlitzoomTiled` that composes `BlitzoomCanvas` with `TileManager`.
- On level change: fetch tile → construct supernodes array → pass to canvas
- Canvas doesn't know about tiles — it just gets supernodes like before

Option B: Modify `BlitzoomCanvas.getLevel()` to accept an async provider.
- More invasive, but cleaner long-term

**Recommendation: Option A.** Keep `BlitzoomCanvas` synchronous. `BlitzoomTiled` handles async fetching and feeds data to the canvas.

## Phase 3: Tiled Viewer

### File: `docs/blitzoom-tiled.js`

```
class BlitzoomTiled {
  constructor(canvas, manifest, opts)

  // Owns a BlitzoomCanvas internally
  this.view = new BlitzoomCanvas(canvas, { skipEvents: true, ... })

  // Handles events, delegates to view
  // On level change: fetch tile, update view data, re-render
  // On pan at RAW level: fetch new tiles, merge into view
  // On click: fetch ego subgraph, show detail
}
```

**Level switch flow:**
1. User scrolls → auto-level triggers L4 → L5
2. `BlitzoomTiled` calls `tileManager.getLevel(5)`
3. Fetch returns (or cache hit): 1024 supernodes, 50K edges
4. Construct `view.nodes`, `view.edges`, `view.nodeIndexFull` from tile data
5. Call `view.layoutAll()`, `view.render()`
6. Total latency: cache hit <1ms, network ~50-200ms

**RAW level viewport flow:**
1. User zooms to RAW level
2. `BlitzoomTiled` computes visible tile range from viewport coordinates
3. Fetches 4-9 tile files (each ~20KB, ~460 nodes)
4. Merges into `view.nodes`, builds adjList from available edges
5. Renders ~2-4K individual nodes
6. On pan: evict off-screen tiles, fetch new ones

**Ego subgraph flow:**
1. User clicks supernode (bid=42) at L6
2. `BlitzoomTiled` fetches `ego/42.json` (precomputed or on-demand)
3. Contains all member nodes + their 1-hop neighbors + internal edges
4. Creates a nested `createBlitzoomFromGraph(detailCanvas, egoNodes, egoEdges)`
5. Shows in detail panel or overlay

## Phase 4: Weight Changes

### Approach: precomputed presets + client-side supernode reblend

**For coarse levels (L1-L8):** The supernode centroids at each level already encode the per-group average projections. Store these in the tile:

```json
{
  "bid": 42,
  "projections": {
    "group": [0.23, -0.45],
    "category": [0.89, 0.12],
    "structure": [-0.34, 0.67]
  },
  "ax": 0.45, "ay": -0.12,
  ...
}
```

When the user changes weights, recompute supernode positions client-side:
```
ax = Σ (w_g × proj_g[0]) / W
ay = Σ (w_g × proj_g[1]) / W
```

This is O(supernodes × G), which is <1ms for 4K supernodes. Then re-quantize supernodes and re-render. The layout changes immediately. The positions are approximate (supernode centroid projections, not re-aggregated from members) but visually close.

**For RAW level:** The individual node projections are already in the tile files. Client-side reblend works exactly as it does now, but only on the ~2-4K visible nodes. <10ms.

**For exact results:** Switch to a precomputed preset that matches the desired weights. The tile set was pre-blended with those exact weights.

### Topology smoothing (α)

Not practical at 30M nodes client-side. Options:
- Precompute 2-3 α values as separate tile sets
- Apply α only to the ego subgraph (few thousand nodes)
- Disable α for tiled mode — show property-only layout

## File Structure

```
scripts/
  bz-precompute.ts        Precomputation CLI
docs/
  blitzoom-tiles.js         TileManager (fetch, cache, evict)
  blitzoom-tiled.js         BlitzoomTiled (viewer for tiled datasets)
  tiled.html               Tiled viewer HTML (minimal, like viewer.html)
  tiles/                   Precomputed tile output directory
    <dataset>/
      manifest.json
      balanced/
        level-1.json ... level-14.json
        raw/
          tile-0-0.json ...
      category-8/
        level-1.json ... level-14.json
        raw/
          tile-0-0.json ...
```

## Implementation Order

1. **bz-precompute.ts** — streaming parser, chunked projection, tile generation
   - Reuses: `parseEdgesFile`, `parseNodesFile`, `buildGraph`, `computeProjections`, `unifiedBlend`, `buildLevelNodes`, `buildLevelEdges`
   - New: streaming parser variant for >1GB files, tile serialization, manifest generation
   - Verify: run on MITRE (4.7K nodes) first, compare tiles with in-memory buildLevel output

2. **blitzoom-tiles.js** — TileManager with LRU cache
   - Pure fetch + cache, no DOM
   - Verify: unit test fetching manifest + level tiles

3. **blitzoom-tiled.js** — composes BlitzoomCanvas + TileManager
   - Same visual result as regular viewer for small datasets
   - Verify: load MITRE via tiles, compare with direct load

4. **tiled.html** — minimal viewer page
   - Dataset picker loads from manifest
   - Verify: visual comparison with viewer.html

5. **Scale test** — run bz-precompute on a 1M+ node synthetic dataset
   - Verify: memory stays under 4GB during precomputation
   - Verify: viewer loads and navigates in <2s

6. **Weight reblend** — client-side supernode centroid reblend
   - Store per-group projections in tiles
   - Verify: weight slider produces approximate but reasonable layout changes

7. **Ego subgraph** — on-click detail fetch
   - Verify: clicking a supernode loads and displays member detail

## Memory Budget

| Component | Loaded | Memory |
| --- | --- | --- |
| Manifest | Always | <1KB |
| L1-L4 tiles | Always | <100KB |
| L5-L8 current level | One at a time | <10MB |
| L9-L14 visible tiles | Viewport only | <50MB |
| RAW visible tiles | Viewport only | <20MB |
| Ego subgraph | One at a time | <100MB |
| Tile cache (LRU) | Managed | <300MB |
| **Total** | | **<500MB** |

## What Stays Unchanged

- `blitzoom-algo.js` — all algorithms (used by precompute + client-side reblend)
- `blitzoom-pipeline.js` — parsers + tokenization (used by precompute)
- `blitzoom-renderer.js` — rendering (receives supernodes, doesn't care about source)
- `blitzoom-canvas.js` — canvas component (used by tiled viewer same as regular)
- `blitzoom.css` — styles
- Regular viewer (`viewer.html` + `blitzoom-viewer.js`) — unchanged, still works for <500K node datasets

## Open Questions

1. **Ego subgraph generation:** Precompute all ego subgraphs (expensive storage) or generate on-demand via a server endpoint?
2. **Edge tiles at L9+:** Store as per-cell pair files or as a single sorted edge file with byte offset index?
3. **Gzip tiles:** Serve `.json.gz` tiles and decompress client-side (reuse existing `DecompressionStream` pattern)?
4. **Progressive rendering:** Show L4 immediately while L6 loads, then crossfade?
5. **Diff-based weight changes:** When switching presets, only re-fetch tiles where supernodes moved significantly?
