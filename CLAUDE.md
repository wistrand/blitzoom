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
deno task test        # run pipeline + import-cycle tests (192 tests)
deno task bundle      # build docs/dist/blitzoom.bundle.js (minified)
deno task skill:zip   # zip docs/skills/blitzoom/ → docs/skills/blitzoom.zip
deno task stix2snap   # STIX 2.1 JSON → SNAP converter
deno task csv2snap    # OpenCTI CSV → SNAP converter
deno task src2snap    # source code → SNAP call graph
```

## File Structure

```
docs/             Web app (ES modules, no build step). Core JS modules, page HTML, styles.
docs/demo/        Standalone demo and test pages with their own back-link header.
docs/dist/        Bundled distribution — single minified blitzoom.bundle.js. Build: `deno task bundle`.
docs/data/        SNAP datasets + D3/JGF/GEXF/GraphML/Cytoscape/CSV samples, STIX bundles (.gz where large).
docs/skills/      Claude Code skill source — `blitzoom/SKILL.md`, plus reference docs. Build: `deno task skill:zip`.
agent_docs/       Architecture, plans, and design notes for agent reference.
benchmarks/       Layout comparison suite (export, compare, Docker runner).
tests/            Deno tests — pipeline, GPU, ground truth, import-cycle DAG enforcement.
scripts/          Standalone Deno scripts — serve, stix2snap, csv2snap, src2snap.
```

The full per-file module list, layer assignments, and dependency graph live in [agent_docs/ARCHITECTURE.md](agent_docs/ARCHITECTURE.md) "Module System". The static import DAG invariant is enforced by [tests/import_cycle_test.ts](tests/import_cycle_test.ts).

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

The curated dataset list with presets, paths, and node/edge counts lives in [docs/datasets.json](docs/datasets.json). Sample data files (SNAP pairs + D3/JGF/GraphML/GEXF/Cytoscape/STIX/CSV) live under [docs/data/](docs/data/). Notable scale points used in testing and demos: Karate Club (34 nodes, smallest), Epstein (364 nodes, mid), BlitZoom Source (~1K nodes, MITRE ATT&CK (~5K), Facebook (4K nodes / 88K edges, dense), Amazon co-purchase (367K nodes / 988K edges, largest tested).

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
- **After editing any file under `docs/skills/blitzoom/`, run `deno task skill:zip`** to refresh `docs/skills/blitzoom.zip`. The zip is what users download from the developer guide; if it's stale, the download silently ships old content.
- **No AI-isms.** Avoid the phrasing patterns that mark text as AI-generated. Specifically:
  - **No empty superlatives** as openers: "The fastest way to…", "The best way to…", "Effortlessly…", "Seamlessly…". They claim nothing falsifiable and signal marketing copy.
  - **No three-beat punchy cadences** with a one-word kicker: "One import, one function call, done." "Simple, fast, reliable." Cadence-as-substitute-for-content reads as machine-written.
  - **No filler preamble between a heading and the action it introduces.** A reader who clicked "Quick Start" already knows what the section is for. Going straight from `## Quick Start` to the buttons or code is better than a sentence describing what's coming. If a sentence carries no information beyond the heading, delete it.
  - **No "let's", "we'll", "you'll find that", "it's worth noting that"**, or other filler-conversational openers. If something is worth noting, write the note. If the reader needs context to understand what follows, give the context as a fact, not as an announcement that context is coming.
  - **No hedging adjectives**: "powerful", "robust", "elegant", "intuitive", "modern", "state-of-the-art". They're claims with no evidence and no measurable content.
  - **Prefer concrete numbers and specific verbs over adjectives.** "Renders 367 000 nodes in a browser tab" beats "extremely fast at scale". "Re-projects only the changed nodes" beats "smart and efficient".
  - **Don't summarize what you're about to say.** A paragraph that opens with "This section covers X, Y, and Z" is wasting space — the reader will see X, Y, and Z below. The same applies to bulleted lists and code blocks: don't precede them with a one-line "here's what's in this list".
  - **Strip "make sure to", "be sure that", "remember to".** If a step is required, write it as a step. The instructional padding adds nothing.

## Tooling

- **Stick to basic git and `gh` commands.** Do not rely on advanced features: no `git rebase -i`, no `git filter-branch`, no `git worktree`, no `git submodule`, no `git reflog` recovery flows, no `gh api graphql` calls, no complex `gh` aliases, no shelling into `.git/` internals. The portable subset is `status`, `diff`, `log`, `add`, `commit`, `push`, `pull`, `checkout`, `branch`, `merge`, `stash`, plus the basic `gh pr`/`gh issue` commands. Anything beyond that is probably the wrong solution to whatever you're trying to do — ask the user instead. The reasons: advanced features have edge cases that depend on repo state, they're harder to undo when something goes wrong, and they make the action log harder for the user to follow.
