# BlitZoom Architecture

This is the top-level architecture overview. Subsystems have their own docs:

- [ARCHITECTURE-data-import.md](ARCHITECTURE-data-import.md) — format parsers, `parseAny` dispatcher, object pipeline
- [ARCHITECTURE-auto-tune.md](ARCHITECTURE-auto-tune.md) — auto-tune algorithm, metric, phases, performance
- [ARCHITECTURE-webgl.md](ARCHITECTURE-webgl.md) — WebGL2 instanced renderer, dual-canvas layout, shaders
- [ARCHITECTURE-webgpu.md](ARCHITECTURE-webgpu.md) — WebGPU compute for projection and blend
- [ARCHITECTURE-svg.md](ARCHITECTURE-svg.md) — SVG export
- [ARCHITECTURE-bearings.md](ARCHITECTURE-bearings.md) — per-group rotation, blend math, sidebar dial, auto-tune
- [ARCHITECTURE-compass.md](ARCHITECTURE-compass.md) — `<bz-compass>` web component, viewer panel, declarative binding

## Overview

BlitZoom is a deterministic layout and hierarchical aggregation viewer for large property graphs. Nodes are positioned by property similarity using MinHash + Gaussian projection, with stable zoom levels derived from stored uint16 grid coordinates via bit shifts.

## Project Structure

```
docs/                    Web application (ES modules, served by Deno)
  index.html               Landing page
  viewer.html              Viewer HTML shell — header, loader, canvas, sidebar, detail panel
  about.html               How It Works — interactive explainer with embedded demos
  howto.html               Developer Guide — embedding API, data format, examples
  comparison.html          Layout algorithm comparison page
  webgl.html               WebGL Rendering feature page
  webgpu.html              WebGPU Acceleration feature page
  blitzoom.css              Styles — dark theme, responsive, loader, detail panel overlay
  blitzoom-algo.js          Pure algorithm functions and constants (no DOM)
  blitzoom-pipeline.js      SNAP parsers, buildGraph, runPipeline(GPU), runPipelineFromObjects(GPU)
  blitzoom-parsers.js       Format adapters — CSV, D3 JSON, JGF, GraphML, GEXF, Cytoscape, STIX dispatcher
  blitzoom-renderer.js      Canvas 2D rendering, heatmaps, hit testing (no state mutation)
  blitzoom-gl-renderer.js   WebGL2 instanced renderer — 7 shader programs
  blitzoom-canvas.js        Standalone embeddable component — canvas, interaction, rendering, event hub
  blitzoom-viewer.js        BlitZoom app (composes BlitZoomCanvas) — UI, workers, data loading, drop zones
  blitzoom-utils.js         Auto-tune optimizer (async, yield-based, AbortSignal + timeout)
  stix2snap.js              STIX 2.1 → object pipeline (parseSTIX, browser-compatible)
  blitzoom-svg.js           SVG export — exportSVG(bz, opts) + createSVGView() headless factory
  blitzoom-worker.js        Web Worker coordinator — uses pipeline, fans out projection
  blitzoom-proj-worker.js   Web Worker — imports from algo+pipeline, computes projections

docs/demo/                 Standalone demo and test pages
  example.html             Minimal example — two embedded graphs (SNAP + inline)
  bz-graph-demo.html       <bz-graph> + <bz-compass> + <bz-controls> declarative-binding examples
  incremental-api-demo.html Side-by-side Gaussian vs Norm incremental insertion demo
  unicode-incremental.html  Streaming demo — all assigned Unicode codepoints loaded via addNodes batches
  bundle-test.html          Smoke test for the dist bundle
  gpu-test.html             GPU vs CPU side-by-side visual comparison
  webgl-test.html           Side-by-side Canvas 2D vs WebGL2 visual comparison

tests/pipeline_test.ts     172 Deno tests: algo, pipeline, numeric, undefined, E2E, SVG, parsers, format dispatch, auto-tune

docs/data/                 SNAP graph datasets + D3/JGF/GEXF/Cytoscape/CSV samples (.gz compressed for large)
benchmarks/                Layout comparison vs ForceAtlas2, UMAP, t-SNE (Docker runner)
agent_docs/                Architecture and spec documentation
scripts/
  serve.ts                 Deno HTTP server (serves everything from docs/, no-cache headers)
  stix2snap.ts             STIX 2.1 JSON → SNAP (extracts platforms, kill chains, aliases)
  csv2snap.ts              OpenCTI CSV → SNAP (Jaccard co-reference container graph)
  src2snap.ts              Source code → SNAP call graph (files, functions, methods, calls)
deno.json                  Tasks: serve, test, stix2snap, csv2snap, src2snap
```

## Module System

All JS files use **ES modules** (`import`/`export`). Web Workers use `{ type: 'module' }`. Viewer loads `<script type="module" src="blitzoom-viewer.js">`.

The static import graph is a **strict DAG with zero cycles**, organized into layers. Each layer may only import from layers below it. New modules must fit into an existing layer or extend the top of the chain.

```
Layer 0 (no local deps):
  blitzoom-algo.js              pure functions + constants (MinHash, projection, blend, quantize, levels)
  blitzoom-colors.js            color schemes
  bz-compass.js                 web component (no imports — uses runtime-only access via _boundView)
  bz-controls.js                web component (no imports — uses runtime-only access via _boundView)
  stix2snap.js                  STIX 2.1 bundle → object pipeline shape

Layer 1 (→ algo only, plus colors for svg):
  blitzoom-pipeline.js          (algo)         SNAP parsers, runPipeline, projectNode, numericBins, adjGroups
  blitzoom-renderer.js          (algo)         Canvas2D draw, hit testing
  blitzoom-gl-renderer.js       (algo)         WebGL2 instanced renderer
  blitzoom-utils.js             (algo)         Auto-tune optimizer
  blitzoom-svg.js               (algo, colors) SVG export

Layer 2 (→ layer 1):
  blitzoom-mutations.js         (algo, pipeline, colors)        addNodes/removeNodes/updateNodes, fullRebuild, bootstrapEmptyGraph
  blitzoom-gpu.js               (algo, pipeline)                WebGPU compute
  blitzoom-parsers.js           (pipeline, stix2snap)           CSV/D3/JGF/GraphML/GEXF/Cytoscape/STIX dispatcher

Layer 3:
  blitzoom-canvas.js            (algo, colors, gpu, mutations, gl-renderer, renderer)   BlitZoomCanvas class

Layer 4:
  blitzoom-factory.js           (algo, colors, utils, pipeline, gpu, canvas)            createBlitZoomView, applyIncrementalPreset

Layer 5:
  bz-graph.js                   (factory, colors, parsers; side-effect bz-compass, bz-controls)   <bz-graph> custom element
  blitzoom-viewer.js            (algo, canvas, colors, utils, gpu, gl-renderer, svg, pipeline, parsers)   Viewer app

Layer 6 (entry point):
  blitzoom.js                   (canvas, factory, bz-graph, pipeline, utils, svg, gpu, gl-renderer, colors)   Public API re-exports

Workers (separate top-level — loaded via `new Worker()`, not by main code):
  blitzoom-worker.js            (pipeline)             Coordinator
  blitzoom-proj-worker.js       (algo, pipeline)       Per-shard projection
```

### Static import DAG invariant

The graph above is **load-bearing**, not just descriptive. The following invariants must hold for any change to the codebase:

1. **No cycles.** No module may import (directly or transitively) anything that imports it. Enforced by [tests/import_cycle_test.ts](../tests/import_cycle_test.ts).
2. **Layered access.** A module may only import from strictly lower layers. Cross-layer access from a higher layer to a lower one is by **parameter passing** (the lower module receives an instance, state object, or plain values from above), never by importing the upper module.
3. **Tight runtime coupling, one-way static imports.** The runtime coupling between `canvas`, `mutations`, and `renderer` is intentionally tight — they share `BlitZoomCanvas` instance state via a `view`/`bz` parameter. The static imports remain one-directional: `canvas` imports `mutations`/`renderer`/`gl-renderer`; the others never import `canvas`. The functions in `mutations` and `renderer` take a `view` parameter and accept whatever shape the canvas hands them.
4. **Companion components stay leaf modules.** `bz-compass.js` and `bz-controls.js` have **zero imports** on purpose. They access the bound view via runtime properties (`this._boundView.someMethod()`) and dispatch DOM events. Adding an import to either component is a regression — the right pattern is to add a public method on `BlitZoomCanvas` that the companions call (see `forwardKeyEvent` for an example).
5. **Workers are separate roots.** `blitzoom-worker.js` and `blitzoom-proj-worker.js` are loaded via `new Worker(..., { type: 'module' })` from the main thread, not via `import`. They form their own DAG roots and may only import from layers 0-1 (algo, pipeline) since they run in a context with no DOM, canvas, or factory.

These rules are not stylistic — they preserve a property that makes the project reasoner-friendly: **any module can be understood by reading itself plus the strict subset of code below it in the layer chain.** A `bz-compass` author never needs to read `blitzoom-canvas.js` to understand what they're working with. A `mutations.js` author reads `algo`, `pipeline`, `colors`, and the public surface of the `view` parameter — nothing more. Cycles destroy this property by making the "below" set unbounded.

No code duplication. GC-optimized MinHash variants (`computeMinHashInto`, `_sig`, `projectInto`, typed-array `HASH_PARAMS_A/B`) live once in [blitzoom-algo.js](../docs/blitzoom-algo.js). `BlitZoom` composes `BlitZoomCanvas` (`this.view`) — all graph state, rendering, and interaction primitives live on the canvas component.

## Data Format (SNAP)

**`.edges`** (required): tab-delimited, `#` comment lines.
- 2-column: `FromNodeId\tToNodeId`
- 3-column: `FromNodeId\tToNodeId\tEdgeType`

**`.nodes`** (optional): tab-delimited.
- Header: `# NodeId\tLabel\tGroup[\tExtraProp1\tExtraProp2...]`
- Extra columns become additional MinHash property groups.
- **Numeric columns**: auto-detected (>=80% of non-empty values parseable). Tokenized at 3 resolution levels (coarse: 5 bins, medium: 50, fine: 500) for smooth Jaccard similarity.
- **Undefined values**: empty field between tabs → 0 tokens emitted → neutral `[0,0]` projection. No false clustering.

## Module Responsibilities

### [blitzoom-algo.js](../docs/blitzoom-algo.js) (623 lines)

Pure functions, no DOM. Single source of truth for MinHash/projection/quantization.

- **Constants**: `MINHASH_K=128`, `GRID_BITS=16`, `GRID_SIZE=65536`, `ZOOM_LEVELS[1..14]`, `RAW_LEVEL=14`, `LEVEL_LABELS`, `STRENGTH_FLOOR_RATIO=0.10`, `STRENGTH_FLOOR_MIN=0.10`
- **MinHash** (GC-optimized): `HASH_PARAMS_A/B` (Int32Array), `computeMinHashInto` → reusable `_sig` Float64Array (NaN sentinel for empty tokens), `computeMinHash` (allocating wrapper). Universal hash via Mersenne fast-mod (`hashSlot` + `mersMod`) — split 16-bit halves to stay within safe integer range.
- **Projection** (GC-optimized): `projectInto(sig, ROT, buf, offset)` → writes to buffer, `projectWith` (convenience wrapper returning `[px, py]`). NaN sentinel check: `sig[0] !== sig[0]`.
- **Blend**: `unifiedBlend(nodes, groupNames, propStrengths, smoothAlpha, adjList, nodeIndexFull, passes, quantMode, quantStats, propBearings)`
- **Quantization**: `normalizeAndQuantize(nodes)` (rank-based, O(n log n)), `gaussianQuantize(nodes, stats)` (Φ(z) via precomputed lookup table, O(n)), `normQuantize(nodes, groupNames, propStrengths)` (projection-matrix norms as σ, zero data dependency — stable for incremental updates). Norm cache: `_normSqCache` maps seed → `[||R[0]||², ||R[1]||²]`.
- **Grid**: `cellIdAtLevel(gx, gy, level)`
- **Level building**: `buildLevelNodes` (phase 1: bucket nodes into supernodes, O(n)) + `buildLevelEdges` (phase 2: aggregate edges, O(|E|), numeric key packing for levels 1-13, string keys for level 14) + `buildLevel` (combined wrapper). Caches `cachedColor`/`cachedLabel` on supernodes.
- **Helpers**: `maxCountKey` (O(k) max), `getNodePropValue`, `getSupernodeDominantValue`

### [blitzoom-pipeline.js](../docs/blitzoom-pipeline.js) (509 lines)

SNAP parsing, graph building, tokenization, pipeline entry points. Imports from algo. No DOM.

- **SNAP Parsers**: `parseEdgesFile` (streaming line-by-line, flat arrays, accepts null/empty for nodes-only graphs), `parseNodesFile` (header detection, extra columns, preserves empty tabs)
- **Graph building**: `buildGraph` — nodes, edges, adjacency, neighbor groups, numeric column auto-detection (`numericBins`). Unions node ids from `parsed.nodeIds` AND `nodesMap.keys()` so nodes-only inputs and orphaned metadata rows are preserved.
- **Tokenization**: `degreeBucket`, `tokenizeLabel` (inline word scanner), `tokenizeNumeric` (3-level for numeric, categorical fallback, 0 tokens for empty/undefined)
- **Signature**: `computeNodeSig(node)` — on-demand signature computation (signatures not stored on nodes)
- **Per-node projection**: `projectNode(node, neighborGroups, groupProjections, groupNames, hasEdgeTypes, extraPropNames, numericBins)` — projects a single node for incremental adds. Uses module-level `_tokenBuf` (non-reentrant, same pattern as `_sig`).
- **Shared utilities**: `computeNumericBins(nodeArray, extraPropNames)` — detects numeric columns, computes bin boundaries. `computeAdjGroups(nodeArray, adjList, nodeIndex)` — builds per-node neighbor group arrays. Both used by `buildGraph`, `createBlitZoomFromGraph`, and `_fullRebuild` — single implementation, no duplication.
- **Text pipeline**: `computeProjections` (delegates to `projectNode` per node), `runPipeline(edgesText, nodesText)`, `runPipelineGPU(edgesText, nodesText, computeProjectionsGPU)` — accept null `edgesText` for nodes-only graphs
- **Object pipeline**: `runPipelineFromObjects(nodesMap, edges, extraPropNames)`, `runPipelineFromObjectsGPU(...)` — bypass text parsing for CSV/D3/JGF/GraphML/GEXF/Cytoscape/STIX loads. Shares `buildGraph` + `computeProjections` with the text pipeline.

### [blitzoom-mutations.js](../docs/blitzoom-mutations.js) (527 lines)

Incremental graph mutation functions. Standalone functions that operate on a BlitZoomCanvas instance. Extracted from blitzoom-canvas.js.

- **`addNodes(view, nodes, edges, opts)`** — project new nodes, register, extend colors, blend, animate. Queues concurrent calls; drains queue after completion. Triggers `_fullRebuild` after 10% cumulative growth.
- **`removeNodes(view, ids, opts)`** — filter edges, clean adjList, recompute maxDegree, blend, animate.
- **`updateNodes(view, updates, opts)`** — merge properties, re-project only changed nodes, extend colors, blend, animate.
- **`fullRebuild(view)`** — recompute numeric bins + adjGroups + all projections. Animated transition.
- **`snapshotPositions(view)`** — capture supernode/node positions keyed by bid/id.
- **`animateTransition(view, prevPositions, durationMs)`** — lerp existing items, fade in new items. Stores cleanup function on `view._animCleanup` for cancellation.
- **Shared helpers**: `cancelAnimation`, `waitForMutex`, `extendColorMaps`, `blendAndAnimate`.
- **`_yieldFrame()`**: yields to the browser between mutation calls so streaming loops (`for await (const batch of batches) await g.addNodes(batch, ...)`) stay interactive. Two-stage yield: `requestAnimationFrame` (paint opportunity) + `scheduler.yield()` if available (Chrome 129+) or `setTimeout(0)` fallback (real macrotask boundary so the browser can dispatch queued input events). Headless environments (Deno tests, jsdom-without-rAF) collapse to a resolved promise.

### [blitzoom-parsers.js](../docs/blitzoom-parsers.js) (965 lines)

Format adapters and content-based dispatcher. Imports `parseNodesFile` from pipeline and `parseSTIX` from `stix2snap.js`. All parsers return the unified shape `{nodes: Map, edges: Array|null, extraPropNames: string[]}` consumable by `runPipelineFromObjects`. See [ARCHITECTURE-data-import.md](ARCHITECTURE-data-import.md) for full details.

- **CSV**: `parseCSV` (state-machine, quoted fields, CRLF, BOM, delimiter auto-detect), `csvRowsToNodes` (header sniffing with role precedence + uniqueness check), `parseCSVToNodes`
- **JSON variants**: `parseD3` (D3 force JSON with numeric-index links), `parseJGF` (array or dict-form nodes), `parseCytoscape` (grouped + flat forms)
- **XML formats**: `parseXML` (hand-rolled SAX subset, no deps), `parseGraphML` (key registry), `parseGEXF` (attribute registry)
- **Dispatch**: `detectFormat(text, filenameHint?)` content sniffer, `parseAny(text, filenameHint?)` unified entry. Exports `OBJECT_FORMATS`, `TEXT_FORMATS`, `FILE_EXTENSIONS`, `FILE_ACCEPT_ATTR`, and classification helpers `isObjectFormat`/`isTextFormat`/`isSpecialFormat` so the viewer has no hardcoded format lists.

### [blitzoom-renderer.js](../docs/blitzoom-renderer.js) (1233 lines)

Canvas 2D rendering. Reads BlitZoom instance, no state mutation (except `n.x`/`n.y` in layout).
When WebGL2 is active (`bz._gl` set), `render()` skips geometry drawing (grid, edges, heatmap,
circles) and only draws text (labels, counts, legend, reset button) on the transparent overlay.

**GC caches**: `_rgbCache`, `_fontCache`, `_rgbaCache`, persistent density heatmap buffers.
Persistent typed-array buffers for instance data (zero per-frame GC after warmup). Cached
`visibleCount`/`maxSizeVal` avoid recomputation. Shared heatmap weight computation between
Canvas 2D and WebGL paths.

**FPS counter**: toggled with F key or click on top-left corner. Displays fps, frame time (ms),
and rendering mode (CPU/GPU/Auto).

**5-layer render order** (Canvas 2D draws all 5; WebGL2 draws layers 1-4, Canvas 2D overlay
draws layer 5):
1. Normal edges (sampled, distance-faded, behind heatmap)
2. Heatmap (splat or density)
3. Highlighted edges (selected/hovered, on top of heatmap)
4. Node circles (opacity-scaled by importance)
5. Labels/counts (topmost, never occluded — always Canvas 2D)

**Adaptive rendering** (based on visible supernode count):
- <=50 visible: all counts, all labels (if cellPx >= 20)
- 51-100: all counts, labels on large nodes (importance > 0.7, cellPx >= 20)
- 101-150: counts on large (importance > 0.7), labels on large (importance > 0.7, cellPx >= 20)
- 151-200: counts on large (importance > 0.7), labels hover/select only
- 200+: all hover/select only. Node opacity scales with `0.3 + 0.7 * sqrt(size/maxSize)` when >50 visible.

**Label truncation**: non-highlighted labels are truncated to `maxChars = max(3, snappedCellPx / charW)` where `snappedCellPx` is quantized to 4px steps to prevent jitter during smooth zoom. Selected, hovered, and zoom-target nodes always show the full untruncated label.

**Zoom target highlight**: during scroll-wheel zoom-in, the nearest node/supernode that attracts the zoom (`zoomTargetId`) is rendered with the same highlight treatment as hovered nodes (full label, glow, full opacity). Cleared by `_zoomTargetTimer` — a 300ms debounce timer reset on every wheel tick. When wheel events stop arriving (the DOM has no `wheelend` event), the timer fires once and drops the highlight + re-renders. Also cleared by an explicit zoom-out wheel tick (which sets `nearest = null`).

**Edge sampling**: `maxEdgesToDraw = min(5000, max(200, nodeCount × 3))`. Short-edge bias in probabilistic sampling.

**Other**: cubic bezier edges, Gaussian splat heatmap (additive), KDE density heatmap (1/4 resolution, persistent buffers), hit testing.

**KDE density heatmap normalization**: per-cell weight is normalized against the **95th percentile** of non-zero cell weights (`_densityNorm`), not the absolute maximum. The percentile is computed via a 256-bin histogram pass alongside the existing maxW scan, walked from the top to find the bin containing 5% of non-zero cells. Cells at or above p95 saturate to full color; cells below render at intensity proportional to `weight / p95`. Adapts to distribution shape: at fine levels with sharp peaks, p95 << max so densest cores still pop; at coarse levels with few uniformly-spread supernodes, p95 ≈ max so saturation stays restricted to the genuine top ~5% instead of blanket-coloring most of the cluster footprint. Lerped over a 200ms time constant. Cache key includes `_blendGen` so incremental adds invalidate the cached normalization base.

### [blitzoom-gl-renderer.js](../docs/blitzoom-gl-renderer.js) (~1235 lines)

WebGL2 instanced renderer. 7 shader programs compiled at `initGL()`. Geometry only — text stays
on Canvas 2D overlay. See [`ARCHITECTURE-webgl.md`](ARCHITECTURE-webgl.md) for full details.

- **Programs**: circle (SDF fill+stroke), glow (selection halo), edge line, edge curve (GPU
  Bezier tessellation, 16 segments), heatmap splat (to RGBA16F FBO), heatmap resolve (fullscreen
  quad), grid (procedural lines)
- **GPU Bezier curves**: vertex shader evaluates cubic Bezier at 16 `t` values from a static
  curve strip VBO (34 vertices). No per-frame CPU tessellation.
- **Two-pass heatmap density**: additive splat to quarter-res RGBA16F FBO, then resolve to screen.
  Requires `EXT_color_buffer_half_float`.
- **Instance data**: circles (11 floats), edges (8 floats), rebuilt per frame into shared
  `_instanceVBO` with `DYNAMIC_DRAW`.
- **Exports**: `initGL(gl)`, `renderGL(gl, bz)`, `destroyGL(gl)`, `isWebGL2Available()`

### [blitzoom-canvas.js](../docs/blitzoom-canvas.js) (1822 lines)

Standalone embeddable canvas component. No external DOM dependencies beyond a `<canvas>` element.

**`BlitZoomCanvas`**: holds all graph state (nodes, edges, adjList, groupNames, propStrengths, propColors), view state (zoom, pan, level, selection), property caching, level building, rendering delegates. Always owns its event handlers (`_bindEvents`). Constructor accepts `onRender`, `showLegend`, `showResetBtn`, `webgl`, `autoGPU`, `colorBy`, `clickDelay` (ms, for single/double-click disambiguation), `keyboardTarget` (default canvas element), and extension callbacks (`onSelect`, `onHover`, `onDeselect`, `onLevelChange`, `onZoomToHit`, `onSwitchLevel`, `onKeydown`).

**Incremental API**: `addNodes(nodes, edges, opts)`, `removeNodes(ids, opts)`, `updateNodes(updates, opts)` — thin delegators to [blitzoom-mutations.js](../docs/blitzoom-mutations.js). Constructor stores `_numericBins`, `_extraPropNames`, `_insertsSinceRebuild`, `_rebuildThreshold` for the mutation functions.

**Fast-mode interaction API**: `fastRebuild()` and `endFastRebuild()` — public methods used by drag-style interactions (compass/controls sliders) to subsample the layout/render path for large graphs (> `BlitZoomCanvas.FAST_NODE_THRESHOLD = 50_000` nodes). `fastRebuild()` re-blends with the adaptive (reduced topology pass) variant, then if above the threshold swaps `view.nodes` for a cached spatial-grid subsample (`_sampleNodes`, ~20K–50K nodes) and runs `layoutAll()` + `render()` on the swapped set before restoring. `endFastRebuild()` drops the cache and runs a full-quality blend + render. The two are serialized via `_fastRebuildPromise` so they can't interleave on shared state. Sample staleness (after streaming `addNodes`/`removeNodes` calls) is detected by tracking `_sampleNodesN` (the node count when the sample was built); a length mismatch triggers a rebuild on the next `fastRebuild`. Companions (`<bz-compass>`, `<bz-controls>`, `<bz-graph>` panels) call these via rAF-coalesced `input` handlers and cancel any pending rAF in `change` handlers before invoking `endFastRebuild()`.

**`colorBy`**: getter/setter overrides which property group controls node colors. Default `null` = auto (highest-weight group). Setting to a valid group name pins coloring to that group; setting to `null` returns to auto. In the viewer, clicking a group name label toggles colorBy (underlined = active). `<bz-graph>` supports the `color-by` attribute.

**WebGL2 integration**: `_initWebGL()` creates a wrapper div, inserts a GL canvas behind the original (transparent overlay), and calls `initGL()`. `_destroyWebGL()` unwraps and restores. `useWebGL` getter/setter toggles at runtime. `resize()` uses `canvas.clientWidth`/`clientHeight` (content box, excludes border) for measurement.

**Dual canvas layout**: wrapper div (position: relative) → GL canvas (geometry, `pointer-events: none`) + original canvas (text, events, `background: transparent`). All mouse/touch events stay on the original canvas. Canvas has `touch-action: none` to prevent browser gesture interference on mobile.

**Level crossfade**: `_snapshotForCrossfade()` captures the current canvas into an absolutely-positioned overlay that fades out over 350ms, providing a smooth visual transition between zoom levels. The overlay is positioned at the canvas's `offsetTop`/`offsetLeft` within its parent container (not fixed at `top:0;left:0`) so it aligns correctly regardless of layout — e.g., in grid layouts where the canvas is not at the container origin.

**Public API**: `setStrengths()`, `setBearing()`, `setAlpha()`, `setOptions()`, `addNodes()`, `removeNodes()`, `updateNodes()`, `fastRebuild()`, `endFastRebuild()`, `forwardKeyEvent()`, `destroy()`. Callbacks: `onSelect`, `onHover`, `onDeselect`, `onLevelChange`, `onZoomToHit`, `onSwitchLevel`, `onKeydown`.

### [blitzoom-factory.js](../docs/blitzoom-factory.js) (215 lines)

Factory functions for creating BlitZoomCanvas instances. Extracted from blitzoom-canvas.js.

- **`createBlitZoomView(canvas, edgesText, nodesText, opts)`** — parses SNAP data via `runPipeline`, hydrates nodes, constructs a `BlitZoomCanvas`. Initial blend kicks off async (GPU probe → blend → render).
- **`createBlitZoomFromGraph(canvas, rawNodes, rawEdges, opts)`** — builds graph from JS objects, computes projections, constructs a `BlitZoomCanvas`. No SNAP parsing.
- **`hydrateAndLink(nodeArray, projBuf, groupNames, edges)`** — hydrates nodes with projections from projBuf, builds adjList. Exported for reuse by demos.
- **Shared tail `_finalize`** — computes default strengths (group=3 if multi-valued, first useful categorical extra prop otherwise), builds color maps, constructs the view, kicks off async GPU probe + optional auto-tune + initial blend.

### [blitzoom-viewer.js](../docs/blitzoom-viewer.js) (2446 lines)

`BlitZoom` class — composes `BlitZoomCanvas` as `this.view`. Adds application UI and orchestration.

**Composition**: all graph/view state accessed via `this.view.*`. BlitZoom owns app-only state (dataLoaded, presets, workers, hash timers). All canvas-element events (mouse, touch, wheel, keyboard, resize) are handled by `BlitZoomCanvas`; the viewer extends via callbacks passed at construction. Viewer-only keys (a, s, S) are handled in `_handleViewerKeys` via the `onKeydown` callback.

**Navigation**: `switchLevel` (called via `onSwitchLevel` callback from canvas keyboard `,`/`.` — adds UI updates, animates supernodes when both old and new levels have <80 nodes), `zoomToNode` (called via `onZoomToHit` on dblclick — animated 350ms with reselection after level change). Level-change UI updates (`_updateStepperUI`, `_deferUIUpdate`) fire via the `onLevelChange` callback. `wheelZoom` prefers `hitTest` for zoom target (respects visual label placement), falls back to `_nearestItem` by distance. On level change during zoom, the dominant member of the old supernode is tracked to the new level.

**Multi-select**: Ctrl+click toggles `view.selectedIds`. Edges highlight for all selected nodes.

**Data loading**: module workers with transferable Float64Array. `DATASETS[]` presets. Hash state restore on load. Loader screen stays visible until blend + layout + render complete — sidebar and canvas revealed together to prevent flash of unblended (0,0) positions or sidebar-without-canvas.

**URL hash**: compact positional format. View: `d`, `l`, `z`, `x`, `y`, `bl`, `s`. Settings (all-or-nothing): `st=5,0,8` (strengths by group order), `b=28.6,0,0` (bearings in degrees, 2 decimals), `a=0.5` (alpha, 3 decimals), `cb=1` (colorBy index, -1=auto), `lp=0,2` (label prop indices). Strengths at 3 decimal precision. Updates via `replaceState` on each render (via `onRender` callback). On restore, positional array lengths sanity-checked against `groupNames.length`; stale hashes silently ignored. All settings applied atomically with full blend + layout + render. Matches both curated datasets (`d=name`) and URL-loaded datasets (`edges=url`).

**UI**: dynamic weight sliders, preset buttons, label checkboxes, size-by toggle (members/edges), quantization mode toggle (gaussian/rank), heatmap mode cycle (off/splat/density), edge mode cycle (curves/lines/none), GL toggle button (WebGL2 on/off, shows "N/A" when unavailable), GPU tri-state button (Auto → GPU → CPU, cycles on click), FPS counter (F key or click top-left), detail panel (slide-in overlay with grouped linked nodes), single-click delayed 250ms for dblclick disambiguation. Cancel button on load screen (visible when data already loaded) returns to current view. GL wrapper div hidden/shown with loader screen. Mobile: compact toolbar, hidden hint section. Press **S** to download SVG export.

**Color-by UI**: clicking a group name label in the sidebar sets `view.colorBy` to that group (underline indicates active). Clicking again returns to auto (highest-weight group). This overrides coloring without affecting layout weights.

### [blitzoom-svg.js](../docs/blitzoom-svg.js) (~601 lines)

SVG export. Two entry points:
- `exportSVG(bz, opts)` — renders the current view (BlitZoomCanvas or headless view) as an SVG string. Produces background, grid, edges, density heatmap contours, circles, labels, and legend.
- `createSVGView(nodes, edges, opts)` — builds a lightweight view from plain pipeline data, no DOM required. Suitable for headless/server-side SVG export and testing.

Density heatmap uses kernel density estimation on a coarse grid, global normalization across all color groups (matching the canvas renderer), Moore neighborhood contour tracing, RDP simplification, and Chaikin smoothing. Imports from `blitzoom-algo.js` (levels, constants) and `blitzoom-colors.js` (color schemes).

### Workers (142 + 95 lines)

**[blitzoom-worker.js](../docs/blitzoom-worker.js)**: coordinator. Imports parsers from pipeline. Fans out to up to 3 sub-workers. Merges Float64Array chunks. Passes `numericBins` for numeric tokenization.

**[blitzoom-proj-worker.js](../docs/blitzoom-proj-worker.js)**: imports from algo + pipeline — zero duplicated code. Receives node slice + neighbor groups, computes all projections.

## Key Data Flow

Two entry paths into the shared `buildGraph` → `computeProjections` → blend → quantize chain:

```
SNAP text pipeline (worker-backed for large inputs):
  SNAP files (.edges, .nodes)
    → blitzoom-worker.js: parse (streaming), build graph, detect numeric columns
      → blitzoom-proj-worker.js (×3): tokenize → MinHash → project → Float64Array
    → main thread: unpack → hydrate → unifiedBlend → quantize → render

Object pipeline (main-thread for CSV/D3/JGF/GraphML/GEXF/Cytoscape/STIX):
  text → detectFormat → parseAny → {nodes: Map, edges: Array|null, extraPropNames}
    → runPipelineFromObjects(GPU)?: buildGraph → computeProjections → unifiedBlend → quantize
    → _applyWorkerResult → render
    → _finalizeLoad → pickInitialLevel (data-aware) → auto-tune (if no preset settings)

Weight/alpha change (either pipeline):
  → _refreshPropCache → invalidate levels → unifiedBlend → layoutAll → render

GPU/CPU mode switch:
  → _reloadCPU / _applyGPUToCurrentData → re-project → rebuildProjections
    (preserves strengths/bearings/alpha/level/zoom, no auto-tune)

Zoom/pan:
  → render (levels cached, just transform + draw)
  → if WebGL2: renderGL (rebuild instance buffers from screen coords) + Canvas 2D text overlay

Level change (auto or manual):
  → adjusts zoom to preserve renderZoom → lazy getLevel → buildLevelNodes → layoutAll → render
    (buildLevelEdges runs async after initial render)
```

## Key Invariants

- Per-node projections computed once at load, never change.
- Weight changes trigger blend + quantize only — no re-projection.
- Bit-prefix containment: level L cell is always a sub-cell of level L-1.
- Supernode `cachedColor`/`cachedLabel` set at `buildLevel` time, not per frame.
- Level cache invalidated when weights, labels, or topology alpha change.
- `renderZoom` compensates for level offset — visual scale never jumps.
- `switchLevel` adjusts logical zoom so renderZoom stays constant.
- Renderer never mutates BlitZoom state (except `n.x`/`n.y` in `layoutAll`).
- `getLevel()` calls `layoutAll()` after building a new level.
- Empty/undefined property values emit 0 tokens — no false clustering.
- Numeric columns tokenized at 3 resolution levels for smooth similarity.

## Design Decisions & Rationale

### Per-group projections (why not a single MinHash?)

An early design used a single MinHash with token multiplicity for weights. Changing weight from 3→4 caused 98% of nodes to change their L4 cell — catastrophic reorganization. MinHash is not smooth in token counts.

**Fix**: independent MinHash per property group, each projected to 2D. Final position is a weighted linear combination of fixed vectors. Weight changes produce smooth proportional movement. No rehashing. O(n) per change.

### Unified blend (property + topology in one formula)

```
px_i = (1 − α) · (Σ_g w_g · p_g(i) / W)  +  α · avg_{j∈N(i)}(px_j)
```

Equivalent to one layer of a degree-normalized GCN (Kipf & Welling 2017). Known failure: oversmoothing at high α.

### Neighborhood tokens removed

Early design included 1-hop and 2-hop neighbor tokens in MinHash. These became redundant with topology smoothing (α parameter). Removing them made the signals orthogonal: α=0 = pure property, α→1 = topology.

### Multi-resolution numeric tokenization

Numeric values emit 3 tokens (coarse/medium/fine bins). Nearby values share coarse tokens → smooth Jaccard. Non-numeric falls back to categorical. Empty values emit nothing.

### WebGL2 optional rendering layer

Geometry rendering (grid, edges, heatmap, circles) can run on WebGL2 via
[blitzoom-gl-renderer.js](../docs/blitzoom-gl-renderer.js). Text (labels, counts, legend) stays on
Canvas 2D because GPU text rendering adds complexity with no visual benefit at BlitZoom's scale.

The dual canvas architecture (GL behind, transparent Canvas 2D on top) keeps all event handling
unchanged and allows toggling at runtime without re-binding listeners. The GL canvas uses
`pointer-events: none`; hit testing uses the existing CPU spatial index.

See [`ARCHITECTURE-webgl.md`](ARCHITECTURE-webgl.md) for shader details, instance layouts, and
buffer management.

### Adaptive GPU/CPU selection

GPU tri-state in viewer: **Auto** (default, adaptive thresholds) → **GPU** (always) → **CPU**
(never). Button cycles on click. `autoGPU` option in `createBlitZoomView` auto-enables WebGPU
when N×G > 2000 (default true).

| Operation  | Auto GPU when                      | Reason                                        |
| ---------- | ---------------------------------- | --------------------------------------------- |
| Projection | N × G > 2000 and quantMode != rank | GPU crossover ~400 nodes; rank needs float64  |
| Blend      | N > 50,000                         | GPU has ~13ms fixed overhead; faster at scale |
| Auto-tune  | always CPU (via `blendFn` default) | 50-80 blend evals faster on CPU except Amazon |

## Known Limitations

- Jaccard on discretised tokens is crude for continuous/ordinal properties.
- 2D projection doesn't preserve distances — provides ordering signal, not metric embedding.
- Rank quantization (when selected) destroys density information; Gaussian quantization tends to preserve it better but assumes approximately normal marginals.
- Gaussian quantization boundaries (μ,σ) recompute on every blend-triggering change (strengths, bearings, alpha). This makes layouts path-independent — same final settings always produce the same grid positions — enabling reliable URL hash restore.
- Low-entropy and undefined-value collapse mitigated by adaptive strength floor (`STRENGTH_FLOOR_RATIO = 0.10`, `STRENGTH_FLOOR_MIN = 0.10`). Empty fields → neutral [0,0] projection; low-entropy properties → few distinct projections. The floor ensures zero-strength high-entropy groups always contribute 10% spreading. At 10% with 3 zero-strength groups, the dominant group controls ~83% of layout. No special all-zero case: the floor produces equal blend naturally, with smooth transitions as strengths change.
- Supernode centroids use post-quantization display coordinates, not the original continuous blended coordinates. The nonlinear quantization transform (rank or Φ) means centroids in quantized space differ from centroids in blended space. The discrepancy is typically small at fine zoom levels and can be more noticeable at coarse levels (L1-L3).
- Strength stability is piecewise constant after quantization.
- Oversmoothing at high α with many passes.
- Layout quality depends entirely on tokenisation quality.

## What Is Novel

Individual components (MinHash, random projection, hierarchical grids, graph smoothing) are known. The contribution is the combination:

1. Per-group projected anchors — fixed, reusable across weight configurations
2. Interactive linear reweighting — smooth, proportional, no recomputation
3. Unified blend — property weights and topology in one normalization
4. Exact bit-prefix zoom hierarchy — all levels from two stored uint16 coordinates
5. Multi-resolution numeric tokenization — smooth similarity for continuous properties
6. Gaussian quantization as default — reasonable CDF fit for roughly bell-shaped blended coordinates
7. Adaptive density rendering — visibility thresholds based on visible node count
8. Optional WebGL2 instanced rendering with GPU Bezier tessellation and two-pass FBO heatmap

## Test Coverage (48 tests)

**Algo** (13): hashToken, computeMinHash/Into, computeMinHash with tokenCount, jaccardEstimate, buildGaussianProjection(seed, cols), projectWith/Into, cellIdAtLevel, maxCountKey, generateGroupColors, MinHash Jaccard convergence.

**Pipeline** (18): parsers (2-col, 3-col, comments, headers, trailing empties), buildGraph, degreeBucket, tokenizeLabel (words, fallback, offset), computeProjections, runPipeline, normalizeAndQuantize, buildLevelNodes, buildLevelEdges.

**Numeric** (9): multi-resolution tokens, nearby/distant sharing, categorical fallback, Jaccard smoothness, detection threshold.

**Undefined** (6): empty/null emit 0 tokens, neutral projection, no false clustering, parser preservation, numeric detection ignoring empties.

**E2E** (2): Epstein full pipeline + multi-level + bit-prefix verification. Topology alpha comparison.

---

## Incremental Updates

BlitZoom supports runtime graph mutation via three methods on `BlitZoomCanvas`:

- **`addNodes(nodes, edges, opts)`** — insert new nodes and edges
- **`removeNodes(ids, opts)`** — remove nodes and their edges
- **`updateNodes(updates, opts)`** — change existing nodes' properties

All three are also available on `<bz-graph>`.

### addNodes Pipeline

0. **Bootstrap empty graph** (only on first add to a graph with `view.nodes.length === 0 && view._extraPropNames.length === 0`) — `bootstrapEmptyGraph(view, newNodes)` derives `_extraPropNames` from the **first batch's fields** (excluding `id`/`group`/`label`), extends `groupNames`, builds projection matrices for the new groups (deterministic seeds at `PROJECTION_SEED_BASE + index`), computes `_numericBins` from the batch, applies factory-style strength defaults if the user hasn't already set strengths, and resets `_originalN` to the bootstrap batch size. **Schema is fixed at this point**: property keys not present in the first batch are silently dropped on subsequent batches. For schemas where every node has the same fields (the typical case) this is invisible; if you'll need a field later, include at least one representative node in the first batch.
1. **Project** each new node on the fly via `projectNode()` — uses cached `numericBins` and `groupProjections` from initial load (or bootstrap). O(K) per node per group.
2. **Register** — append to `nodes`, `nodeIndexFull`, `adjList`. Update degrees for new edges.
3. **Extend color maps** — only generate colors for new property values; existing value→color mappings are never changed (stable colors across insertions).
4. **Blend + quantize** — re-run `unifiedBlend` on the full (now larger) node array.
5. **Animate** — lerp existing supernodes/nodes from old to new positions, fade in new items.
6. **Periodic rebuild** — when cumulative inserts exceed `_rebuildThreshold × _originalN`, `_fullRebuild()` re-runs `computeProjections` on all nodes to refresh stale numeric bins and topology tokens. The `incremental` preset disables this entirely (`Infinity`).

### removeNodes Pipeline

1. **Filter edges** — remove edges touching removed nodes, decrement `degree` on surviving endpoints.
2. **Clean adjList** — remove removed IDs from all neighbors' adjacency lists.
3. **Remove** from `nodes`, `nodeIndexFull`, `adjList`. Recompute `maxDegree`.
4. **Blend + animate** — supernodes that lose all members disappear; others lerp to new positions.
5. **Dispatch** `nodesremoved` event.

### updateNodes Pipeline

1. **Merge** changed properties (`group`, `label`, extra props) into existing node objects.
2. **Re-project only changed nodes** via `projectNode()` — unchanged nodes keep their projections.
3. **Extend color maps** for any new property values.
4. **Blend + animate** — affected supernodes lerp to new positions.
5. **Dispatch** `nodesupdated` event.

### Norm Quantization (`quantMode: 'norm'`)

`normQuantize` in [blitzoom-algo.js](docs/blitzoom-algo.js) uses projection matrix norms as σ instead of data-derived μ/σ. Each node's grid position depends only on its own blended `px/py` and fixed algorithm parameters. Adding nodes never changes existing nodes' `gx/gy` — zero displacement.

Scale derivation: `σ = √(Σ w²_g × ||R_g[row]||²) / W`, where `R_g` is the seeded Gaussian projection matrix for group g. The norm cache (`_normSqCache`) computes `||R_g[row]||²` once per seed and reuses it.

Tradeoff: norm mode has ~5-30% worse grid utilization than gaussian on datasets where property diversity is low (single-valued group, edge-only graphs). Works well on property-rich datasets (within 5% of gaussian).

### Animation

`_animateTransition(prevPositions, durationMs)` matches items before/after update by `bid` (supernodes) or `id` (raw nodes):
- **Existing items** (key found): cubic ease-out lerp from old to new screen position
- **New items** (key not found): fade in at final position via `_animProgress` on the bz object
- Renderer checks `_isNew && bz._animProgress` in both `renderNodes` and `renderSupernodes` circle passes
- Uses `renderNow()` (synchronous) in the animation loop to avoid rAF coalescing with the deferred `render()`

### `<bz-graph>` Integration

```html
<bz-graph id="g" edges="data/base.edges" nodes="data/base.nodes" incremental>
</bz-graph>
<script>
  g.addEventListener('ready', async () => {
    await g.addNodes([{id: 'n1', group: 'analyst', label: 'New'}]);
    await g.updateNodes([{id: 'n1', group: 'manager'}]);
    await g.removeNodes(['n1']);
  });
</script>
```

The `incremental` attribute is a bundled preset (see `applyIncrementalPreset` in [blitzoom-factory.js](../docs/blitzoom-factory.js)) that sets `quantMode='norm'`, `rebuildThreshold=Infinity` (no periodic rebuild), and `autoTune=false`. Each setting can be overridden by passing it explicitly via the matching attribute (`quant=`, `rebuild-threshold=`) — the user value wins per-field while the rest of the preset still applies. Equivalent JS option: `{ incremental: true }` on `createBlitZoomView` / `createBlitZoomFromGraph`.

**Empty graphs**: `<bz-graph>` with no `edges` URL and no inline data (no `<script type="application/json">` child, no raw text content) builds an empty canvas via `createBlitZoomFromGraph(canvas, [], [], opts)`. Strengths and other attributes are stored on the canvas at construction time even though no nodes exist yet. The first `addNodes` call into the empty graph runs the bootstrap step (see addNodes Pipeline above) to derive the property-group schema from the incoming nodes. Useful when the graph is populated entirely via streaming with no static seed.

### Concurrency

All three mutation methods share a guard (`_addNodesRunning`). If a call arrives while one is in progress, `addNodes` merges the new nodes/edges into a queue and drains it after the current operation completes. `removeNodes` and `updateNodes` return immediately if busy. In-flight animations are cancelled (snapped to final positions) when a new mutation starts.

### Data Flow

```
addNodes(rawNodes, edges)             removeNodes(ids)                updateNodes(updates)
  → projectNode() per node              → filter edges, update degrees    → merge properties
  → register in nodes/adjList           → clean adjList                   → re-project changed nodes
  → extend propColors                   → remove from nodes/index         → extend propColors
  → snapshot positions                  → recompute maxDegree             → snapshot positions
  → _blend() → layoutAll()             → snapshot → _blend() → layout    → _blend() → layoutAll()
  → _animateTransition()               → _animateTransition()            → _animateTransition()
  → dispatch 'nodesadded'              → dispatch 'nodesremoved'         → dispatch 'nodesupdated'
  → check _rebuildThreshold
```
