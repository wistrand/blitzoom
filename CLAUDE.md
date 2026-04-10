# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BlitZoom is a deterministic layout and hierarchical aggregation viewer for large property graphs. Nodes are positioned by property similarity (MinHash + Gaussian projection), with stable zoom levels derived from uint16 grid coordinates via bit shifts.

- [`agent_docs/SPEC.md`](agent_docs/SPEC.md) — algorithm theory, tradeoffs, complexity analysis
- [`agent_docs/ARCHITECTURE.md`](agent_docs/ARCHITECTURE.md) — implementation details, module responsibilities, data flow, caching, design rationale
- [`agent_docs/ARCHITECTURE-webgl.md`](agent_docs/ARCHITECTURE-webgl.md) — WebGL2 rendering layer: shaders, dual canvas, GPU tessellation
- [`agent_docs/ARCHITECTURE-webgpu.md`](agent_docs/ARCHITECTURE-webgpu.md) — WebGPU compute: projection, blend, adaptive GPU/CPU selection
- [`agent_docs/ARCHITECTURE-svg.md`](agent_docs/ARCHITECTURE-svg.md) — SVG export: density contours, edge rendering, coordinate mapping

## Running

```sh
deno task serve       # dev server at http://localhost:8000
deno task test        # run pipeline tests (177 tests)
deno task stix2snap   # STIX 2.1 JSON → SNAP converter
deno task csv2snap    # OpenCTI CSV → SNAP converter
deno task src2snap    # source code → SNAP call graph
```

## File Structure

```
docs/                    Web app (ES modules, no build step)
  index.html               Landing page with live demo
  viewer.html              Viewer HTML shell
  about.html               How It Works page
  howto.html               Developer Guide
  comparison.html          Layout algorithm comparison page
  webgl.html               WebGL Rendering feature page
  webgpu.html              WebGPU Acceleration feature page
  blitzoom.css              Styles
  blitzoom-algo.js          Pure algorithm functions, constants, normQuantize
  blitzoom-pipeline.js      SNAP parsers, buildGraph, runPipeline(GPU), projectNode, computeNumericBins, computeAdjGroups
  blitzoom-parsers.js       Format adapters — CSV, D3 JSON, JGF, GraphML, GEXF, Cytoscape; parseAny dispatcher, readFileText, classifyFiles
  stix2snap.js              STIX 2.1 bundle parser (parseSTIX, browser-compatible)
  blitzoom-renderer.js      Canvas 2D rendering, heatmaps, hit testing, FPS counter
  blitzoom-gl-renderer.js   WebGL2 rendering — shaders, instanced draw, GPU heatmap
  blitzoom-canvas.js        Standalone embeddable component — canvas, interaction, rendering, statechange/blend events
  blitzoom-mutations.js     Incremental graph mutations — addNodes, removeNodes, updateNodes, fullRebuild, animation, bootstrapEmptyGraph
  blitzoom-factory.js       Factory functions — createBlitZoomView, createBlitZoomFromGraph, applyIncrementalPreset, hydrateAndLink
  blitzoom-viewer.js        BlitZoom app (composes BlitZoomCanvas) — UI, workers, data loading, <bz-controls> sidebar, compass panel, auto-tune-on-load
  blitzoom-utils.js         Auto-tune optimizer — dual-pass search, bearing autotune, portable async, memoization
  blitzoom-svg.js           SVG export — exportSVG(bz, opts), createSVGView() for headless
  blitzoom-colors.js        Color schemes (vivid, viridis, plasma, etc.)
  blitzoom-gpu.js           WebGPU compute acceleration
  blitzoom-worker.js        Web Worker coordinator
  blitzoom-proj-worker.js   Web Worker projection
  bz-graph.js               <bz-graph> web component — data loading, drop zone, addNodes/removeNodes/updateNodes, incremental attribute, ready Promise
  bz-compass.js             <bz-compass> web component — radial strength/bearing/alpha control, colorBy label click
  bz-controls.js            <bz-controls> web component — strength sliders + bearing dials + label checkboxes
  blitzoom.js               Public API entrypoint (re-exports createBlitZoomView, exportSVG, createSVGView, autoTuneStrengths, projectNode, etc.)

docs/demo/                 Standalone demo and test pages
  example.html             Minimal example — two graphs (SNAP + inline), linked from developer guide
  bz-graph-demo.html       Web component demo — <bz-graph> + <bz-compass> + <bz-controls> examples
  incremental-api-demo.html Side-by-side Gaussian vs Norm incremental insertion demo (uses real addNodes API)
  unicode-incremental.html  Streaming demo — all assigned Unicode codepoints loaded via addNodes batches
  bundle-test.html          Smoke test for the dist bundle
  gpu-test.html             GPU vs CPU side-by-side visual comparison
  webgl-test.html           Side-by-side Canvas 2D vs WebGL2 comparison

docs/dist/                 Bundled distribution
  blitzoom.bundle.js        Minified single-file bundle (~98KB, gzipped). Build: `deno task bundle`

docs/data/                 SNAP datasets + D3/JGF/GEXF/GraphML/Cytoscape/CSV samples, STIX bundles (.gz where large)
benchmarks/                Layout comparison suite (export, compare, Docker runner)
tests/pipeline_test.ts     177 tests: algo unit, pipeline, numeric, undefined, E2E, SVG, parsers, format dispatch, bearings
scripts/
  serve.ts                 Deno HTTP server (no-cache headers)
  stix2snap.ts             STIX 2.1 → SNAP converter (extracts platforms, kill chains)
  csv2snap.ts              OpenCTI CSV → SNAP converter (Jaccard co-reference edges)
  src2snap.ts              Source code → SNAP call graph (functions, methods, calls)
```

## Data Formats

BlitZoom accepts multiple input formats through a unified detection/dispatch layer. See [agent_docs/ARCHITECTURE-data-import.md](agent_docs/ARCHITECTURE-data-import.md) for the full architecture.

**SNAP text** (two-file, worker pipeline):
- `.edges` (optional since nodes-only-SNAP support): tab-delimited, `#` comments. `From\tTo` or `From\tTo\tEdgeType`.
- `.nodes` (optional): tab-delimited. `# NodeId\tLabel\tGroup[\tExtra1\tExtra2...]`.
  - Extra columns become MinHash property groups.
  - Numeric columns auto-detected (>=80% parseable) → 3-level tokenization (coarse/medium/fine).
  - Empty fields = undefined → 0 tokens, neutral projection, no false clustering.

**Object pipeline** (single-file, main-thread via `runPipelineFromObjects`):
- **CSV / TSV / SSV** — header sniffing maps columns to id/label/group roles; everything else becomes extras. Handles quoted fields, escaped quotes, CRLF, BOM, auto-detects `,` / `\t` / `;` / `|`.
- **D3 force JSON** (`{nodes, links}`) — flat node bag; falls back to `name` as id (Miserables convention); resolves numeric link endpoints as both string-id matches and array indices.
- **JGF** (`{graph: {nodes, edges}}`) — single-graph or multi-graph; accepts nodes as array OR dict keyed by id (JGF v1).
- **GraphML / GEXF** — hand-rolled XML subset parser, two-pass with key/attribute registry resolution.
- **Cytoscape.js JSON** — grouped form `{elements: {nodes, edges}}` and flat-array form `{elements: [{group, data}]}`.
- **STIX 2.1 bundle** — inlined into the object pipeline via `parseSTIX` (was previously a separate flow).

Drop any of these files onto the canvas or loader panel, or load them via URL — `detectFormat` sniffs from content + filename, `parseAny` dispatches.

## Datasets

**SNAP pairs** (curated with presets in `datasets.json`):

| Name            | Nodes | Edges  | Properties                            |
| --------------- | ----- | ------ | ------------------------------------- |
| Karate Club     | 34    | 78     | group                                 |
| Epstein         | 364   | 534    | group, edge types                     |
| BlitZoom Source | 966   | 2,609  | kind, file, lines, bytes, age         |
| Marvel Comics   | 327   | —      | alignment, gender, alive, eye, hair   |
| Porsche         | 297   | —      | body, drivetrain, weight, generation  |
| Pokemon         | 959   | —      | type1, type2, generation, stats       |
| Vadonland       | 512   | —      | government, type, biome, religion     |
| Synth Packages  | 2,000 | 4,044  | downloads, license, version, depcount |
| MITRE ATT&CK    | 4,736 | 25,856 | kill chain, platforms, aliases        |
| Ransomware      | 27K   | —      | group, year, raas, victims, sector    |
| Email EU        | 1,005 | 25,571 | (edge-only)                           |
| Facebook        | 4,039 | 88,234 | (edge-only)                           |
| Power Grid      | 4,941 | 6,594  | (edge-only)                           |
| Amazon          | 367K  | 988K   | product category                      |

**Object-pipeline samples**:

| File                  | Format    | Nodes | Notes                                |
| --------------------- | --------- | ----- | ------------------------------------ |
| miserables.json       | D3 JSON   | 77    | Canonical Mike Bostock D3 example    |
| miserables.jgf.json   | JGF v1    | 77    | Dict-form `graph.nodes`              |
| miserables.gexf       | GEXF      | 74    | Gender attribute                     |
| miserables.cyjs.json  | Cytoscape | 77    | Grouped form                         |
| karate.graphml        | GraphML   | 34    | Faction attribute                    |
| graphml-sample.xml    | GraphML   | 6     | Prefuse canonical example            |
| penguins.csv          | CSV       | 344   | Palmer Penguins with species/sex     |
| titanic.csv           | CSV       | 891   | Titanic passengers — class, sex, age |
| ics-attack.json.gz    | STIX 2.1  | 464   | MITRE ATT&CK for ICS                 |
| mobile-attack.json.gz | STIX 2.1  | 738   | MITRE ATT&CK for Mobile              |

## Key Design Decisions

- **ES modules** — `import`/`export` everywhere. Module workers. `<script type="module">` in each HTML page.
- **No code duplication** — GC-optimized MinHash/projection (`computeMinHashInto`, `_sig`, `projectInto`, typed-array `HASH_PARAMS_A/B`) in [blitzoom-algo.js](docs/blitzoom-algo.js), imported by pipeline and workers.
- **Composition** — `BlitZoom` owns a `BlitZoomCanvas` (`this.view`) for all graph state, rendering, and interaction primitives. `BlitZoom` adds UI, workers, data loading, detail panel, URL hash state. `BlitZoomCanvas` is standalone (no DOM beyond `<canvas>`), with `createBlitZoomView()` factory and `onRender`/`autoTune`/`autoGPU`/`webgl`/`colorBy` options for embedding. Canvas always owns its event handlers; the viewer extends behavior via callbacks (`onSelect`, `onDeselect`, `onLevelChange`, `onZoomToHit`, `onSwitchLevel`, `onKeydown`) and options (`clickDelay`, `keyboardTarget`).
- **colorBy** — `BlitZoomCanvas.colorBy` property overrides which property group controls node colors (default: auto = highest-strength group). In the viewer, click a group name label to set colorBy (underline indicates active); click again to return to auto. `<bz-graph>` supports `color-by` attribute.
- **SVG export** — `exportSVG(bz, opts)` in [blitzoom-svg.js](docs/blitzoom-svg.js) renders the current graph view as an SVG string. `createSVGView(nodes, edges, opts)` builds a headless view from plain pipeline data (no DOM needed). In the viewer, press **S** to download an SVG file.
- **WebGL2 rendering** — optional GPU-accelerated layer for grid, edges, heatmap, and circles via 7 shader programs in [blitzoom-gl-renderer.js](docs/blitzoom-gl-renderer.js). Text stays on Canvas 2D overlay. Dual canvas architecture: wrapper div with GL canvas behind, original canvas transparent on top. Toggle via `webgl: true` option or GL button in viewer toolbar. Falls back silently if WebGL2 unavailable (`isWebGL2Available()` probe).
- **Auto-tune** — `autoTuneStrengths` in [blitzoom-utils.js](docs/blitzoom-utils.js) optimizes strengths/alpha/quant by maximizing **spread × clumpiness × group-purity** at an adaptive grid level. Dual-pass search: runs preset → descent → refine at both α=0 (property-only) and α=0.5 (moderate topology) to discover strength configurations that synergize with topology. α capped at 0.75 for property datasets to prevent CV inflation. After strengths, `autoTuneBearings` runs closed-form trace maximization to optimize per-group rotations. Async with portable yield, memoized, supports `AbortSignal` and timeout. Viewer auto-runs on fresh loads without preset settings via `_autoTuneFresh()`. For datasets >50K nodes, tunes on a 50K subsample (strength ratios transfer). Beats ForceAtlas2/t-SNE/UMAP on 3 of 5 property datasets at 1000-70000× faster. See [agent_docs/ARCHITECTURE-auto-tune.md](agent_docs/ARCHITECTURE-auto-tune.md).
- **Bearings** — per-group rotation θ applied during blend, exposing the hidden degree of freedom in PRNG-seeded projections. `setBearing(group, radians)` on the canvas. Sidebar dials (music-software knob UX) and compass component for 2D manipulation. See [agent_docs/ARCHITECTURE-bearings.md](agent_docs/ARCHITECTURE-bearings.md).
- **Compass** — `<bz-compass>` web component: radial 2D control for strengths + bearings. Declarative binding via `for` attribute to `<bz-graph>`. Floating draggable panel in the viewer (R key). SVG export. See [agent_docs/ARCHITECTURE-compass.md](agent_docs/ARCHITECTURE-compass.md).
- **Unified format import** — `parseAny(text, filenameHint?)` in [blitzoom-parsers.js](docs/blitzoom-parsers.js) detects format from content + filename and dispatches to CSV/D3/JGF/GraphML/GEXF/Cytoscape/STIX parsers. All return `{nodes: Map, edges: Array|null, extraPropNames: string[]}` consumable by `runPipelineFromObjects`. Viewer uses `isObjectFormat`/`FILE_ACCEPT_ATTR` exports — no hardcoded format lists in UI code. Nodes-only graphs (CSV without edges, `.nodes` file alone) produce valid property-only layouts. See [agent_docs/ARCHITECTURE-data-import.md](agent_docs/ARCHITECTURE-data-import.md).
- **Canvas drop zone** — files dropped onto the canvas (mid-session) immediately load via `parseAny` → `runPipelineFromObjects`. Two sequential SNAP drops (edges + nodes within 600ms) debounce and load as a pair; any non-SNAP drop shows loader screen with progress ("Reading file..." → "Parsing..." → "Building graph...") before heavy work.
- **Default strengths** — `group` gets strength 3 if it has >1 distinct value. If single-valued (e.g. CSV without a "group" column → all "unknown"), the first categorical extra property with 2-50 distinct values gets strength 3 instead, preventing layout collapse to a single point.
- **Determinism** — seeded Gaussian projection + bit-prefix quantization give same-input-same-pixels forever. Load-bearing for URL-hash state, bookmarks, and `replaceState`-based shared views. No force-directed relaxation, no randomized t-SNE/UMAP iterations.
- **Norm quantization** — `quantMode: 'norm'` uses projection matrix norms as scale instead of data-derived μ/σ. Each node's grid position depends only on its own properties and fixed algorithm parameters. Adding or removing other nodes never changes an existing node's `gx/gy`. Toggle via Q button in viewer (cycles Gaussian → Rank → Norm). Auto-tune preserves the user's quant mode choice. **Tradeoff triangle**: you can have at most two of (1) data-independent scale, (2) optimal grid utilization, (3) zero displacement on insertion. Gaussian picks 2 (best grids, recalculates μ/σ from data). Norm picks 1+3 (stable positions, but 5-30% worse grid utilization on degenerate-property datasets). Rank picks 2 only (uniform grids, but every insertion re-sorts). Use norm for incremental/streaming; use gaussian for static datasets.
- **Incremental updates** — Full CRUD API on `BlitZoomCanvas`: `addNodes(nodes, edges, opts)` inserts and projects new nodes on the fly via `projectNode()`; `removeNodes(ids, opts)` removes nodes and their edges, updating neighbor degrees; `updateNodes(updates, opts)` merges property changes and re-projects only the affected nodes. All three re-blend, animate (lerp existing, fade-in/out), and dispatch events (`nodesadded`, `nodesremoved`, `nodesupdated`). With `quantMode: 'norm'`, existing nodes have zero displacement. Periodic full rebuild (`_fullRebuild`) triggers after `_rebuildThreshold × _originalN` cumulative inserts to refresh stale numeric bins and topology tokens. See [agent_docs/ARCHITECTURE.md](agent_docs/ARCHITECTURE.md) for the full architecture.
- **Incremental preset** — `incremental: true` (constructor option) and `<bz-graph incremental>` (attribute) are a bundled preset for runtime mutation and streaming. Applied via `applyIncrementalPreset(opts)` in [blitzoom-factory.js](docs/blitzoom-factory.js): sets `quantMode='norm'`, `rebuildThreshold=Infinity` (no periodic rebuild), and `autoTune=false` (no auto-tune-on-load). Each setting can still be overridden by passing it explicitly alongside `incremental` — user opts win per-field via spread order. Legacy `quantMode='norm'` without the preset keeps the default rebuild threshold (0.10) and auto-tune behavior — non-breaking. The viewer ([blitzoom-viewer.js](docs/blitzoom-viewer.js)) does not currently consume the preset; it has its own `_autoTuneFresh` flow.
- **Empty-graph bootstrap** — `createBlitZoomFromGraph(canvas, [], [], opts)` and `<bz-graph>` with no inline data both produce a valid empty canvas. The first `addNodes()` call into an empty graph runs `bootstrapEmptyGraph(view, newNodes)` in [blitzoom-mutations.js](docs/blitzoom-mutations.js) to derive `_extraPropNames` from **the first batch's fields only**, extend `groupNames`, build projection matrices for the new groups (deterministic seeds keyed on group index, matching the canvas constructor), compute `_numericBins` from the batch, and apply factory-style strength defaults if the user hasn't already set strengths via `opts.strengths` or the `strengths` attribute. **Limitation**: property keys not present in the first batch are not added later — silently dropped on subsequent batches, same as the existing static-build behavior. For schemas where every node has the same fields (the typical case) this is invisible; if your first batch lacks a field you'll need later, include at least one representative node in the first batch.
- **Factory extraction** — `createBlitZoomView` and `createBlitZoomFromGraph` live in [blitzoom-factory.js](docs/blitzoom-factory.js), separate from the canvas component. The public entrypoint [blitzoom.js](docs/blitzoom.js) re-exports both.
- **Web Workers** — coordinator fans out to up to 3 projection sub-workers. Transferable Float64Array buffers.
- **Supernode color/label cached at build time** — not recomputed per frame. `_refreshPropCache()` invalidates level cache.
- **Two-zoom system** — logical zoom triggers level changes; `renderZoom = max(1, zoom * 2^levelOffset)` keeps visual scale continuous. Level crossfade overlay positioned at canvas `offsetTop`/`offsetLeft` (not `top:0;left:0`) to align in any layout.
- **Multi-select** — Ctrl+click toggles; `selectedIds` Set; edges highlight for all selected.
- **Adaptive rendering** — edge sampling scales with visible nodes; labels/counts hide at high density, appear on zoom-in; node opacity scales with importance. Label truncation length quantized to 4px `cellPx` steps to prevent jitter during smooth zoom.
- **Zoom target highlight** — during scroll-wheel zoom-in, the zoom target (`zoomTargetId`) gets the same highlight treatment as hovered nodes (full label, glow, full opacity). Target selection prefers `hitTest` (cursor over circle/label) with `_nearestItem` fallback. On level change, tracks the dominant member of the old supernode to the new level. Cleared on zoom-out.
- **5-layer render order** — edges → heatmap → highlighted edges → circles → labels. WebGL2 renders geometry layers (grid through circles); Canvas 2D overlay handles text (labels, legend, reset button).
- **GPU tri-state** — viewer GPU button cycles Auto → GPU → CPU. Auto (default) uses adaptive thresholds: GPU projection when N×G > 2000, GPU blend when N > 50K. GPU forces all operations to GPU; CPU forces all to CPU. Mode switches re-project with the target pipeline but preserve current strengths/bearings/alpha/level/zoom — no auto-tune trigger, no settings reset.
- **Async initial blend** — `createBlitZoomView()` returns synchronously; initial blend kicks off async (GPU probe → blend → render). Callers get a ready view immediately; first render completes in background.
- **FPS counter** — toggle with F key or click top-left corner. Shows max fps (from render time), ms, and mode (CPU/GPU/Auto). During fast mode shows `fast[Np]` suffix.
- **Fast mode** — interactive drag on large datasets (>50K nodes) uses adaptive blend passes (0-2, budget system with ceiling lock) and spatial subsampling (16×16 grid from gx/gy, degree-weighted, ~20-50K sample). Edges suppressed via `_skipEdgeBuild` flag (stays true for entire drag session). Full 5-pass blend + layout + edge build on release. Below 50K nodes, drag always uses full blend.
- **Mobile improvements** — `touch-action: none` on canvas prevents browser gestures, compact toolbar layout, hidden hint section on small screens.
- **Cancel button** — load screen shows a cancel button when data is already loaded, allowing return to the current view without reloading.
- **GL wrapper visibility** — viewer hides the GL wrapper div alongside the canvas when showing the loader screen, restores it on cancel or load completion. Sidebar starts `display:none` in HTML; canvas, sidebar, and load button revealed atomically by `_finalizeLoad` after blend + layout complete, preventing flash of unblended nodes or sidebar-without-canvas.
- **URL hash state** — compact positional format. View: `d`, `l`, `z`, `x`, `y`, `bl`, `s`. Settings (all-or-nothing block): `st=5,0,8` (strengths, 3 decimals), `b=28.6,0,0` (bearings in degrees, 2 decimals), `a=0.5` (alpha, 3 decimals), `cb=1` (colorBy group index, -1=auto), `lp=0,2` (label prop indices). Positional arrays indexed by `groupNames` order; lengths sanity-checked on restore. Matches curated datasets (`d=id`) and URL-loaded datasets (`edges=url`). `replaceState` on render.

## Important Invariants

- **Static import DAG.** The module import graph is a strict DAG with **no cycles**, organized into layers (see [agent_docs/ARCHITECTURE.md#module-system](agent_docs/ARCHITECTURE.md)). A module may only `import` from strictly lower layers; cross-layer access from higher → lower is by parameter passing (`view`, `bz`, `state`), not by importing the upper module. The runtime coupling between `canvas`, `mutations`, and `renderer` is intentionally tight via the shared `view` parameter, but the static imports stay one-directional. **`bz-compass.js` and `bz-controls.js` have zero imports** — they're leaf modules and accessing the bound view is via runtime properties only. Adding any import to either is a regression. Enforced by [tests/import_cycle_test.ts](tests/import_cycle_test.ts).
- Per-node projections are node-independent — computed from the node's own properties only. `projectNode()` produces identical results whether called alone or in a batch.
- Strength changes trigger blend + quantize only (no re-projection).
- `normQuantize` uses projection matrix norms as σ — zero data dependency. `addNodes()`, `removeNodes()`, and `updateNodes()` with `quantMode: 'norm'` never change unaffected nodes' `gx/gy`.
- `addNodes()` triggers `_fullRebuild()` when cumulative inserts exceed `_rebuildThreshold` × `_originalN`. With norm mode, rebuild is transparent (deterministic projections → identical gx/gy). Set `_rebuildThreshold = Infinity` to disable rebuild entirely (the `incremental` preset does this for streaming workloads).
- `removeNodes()` cleans up edges, adjList, and degrees for surviving neighbors. `updateNodes()` re-projects only the changed nodes — unchanged nodes keep their exact projections.
- Bit-prefix containment: level L cell is always a sub-cell of level L-1.
- Renderer never mutates BlitZoom state (except `n.x`/`n.y` in layoutAll).
- `_refreshPropCache()` must be called when strengths or label selection change.
- `getLevel()` calls `layoutAll()` when building a new level.
- `switchLevel()` adjusts zoom to preserve renderZoom across level changes.
- Empty/undefined property values emit 0 tokens → NaN sentinel → neutral [0,0] projection. Adaptive strength floor (`STRENGTH_FLOOR_RATIO=0.10`, `STRENGTH_FLOOR_MIN=0.10`) ensures zero-strength high-entropy groups always contribute 10% spreading, preventing low-entropy collapse. No special all-zero case: the floor produces equal blend naturally with smooth strength transitions.
- Gaussian quantization boundaries (μ,σ) recompute on every blend-triggering change (strengths, bearings, alpha) via `_quantStats = {}`. This makes layouts path-independent: the same final settings always produce the same grid positions, enabling reliable URL hash restore.
- Heatmap density maxW is cached per level/zoom config, lerped on change — stable across pan.
- `unifiedBlend` uses module-level Float64Array buffers grown on demand. Not reentrant — safe because blend calls are sequential.
- Fresh-load state reset in `_applyWorkerResult`: pan, zoom, colorBy, nav state, selection, current dataset id all cleared. User preferences (color scheme, GPU mode, WebGL toggle, showFps/Legend, theme) preserved.
- Initial level picked by `pickInitialLevel` in `_finalizeLoad` AFTER `gx/gy` is populated by blend + quantize. Walks coarse→fine, returns first level with 25-400 distinct cells and ≥1 multi-member cell. Dataset preset `initialLevel` and URL hash `l=` still override.
- `buildGraph` unions ids from `parsed.nodeIds` AND `nodesMap.keys()` — nodes-only inputs and orphaned metadata rows are preserved (fixes pre-refactor silent drop).
- Bearings are blend-time only — no re-projection needed. GPU compute blend falls back to CPU when bearings are set.
- URL hash settings are positional arrays indexed by `groupNames` order — no group names in the hash. All settings serialized as a block; presence of `st=` implies all settings are present.
- `<bz-compass>` declarative binding via `for` attribute listens for `ready` event on `<bz-graph>`, not polling.


## Code Style

2-space indent, single quotes, semicolons, 100 char width.


## Documentation Style

- **Use markdown links** for file references: `[doc.md](path/to/doc.md)` not `` `path/to/doc.md` ``
- **Align table columns** by padding cells to consistent widths
