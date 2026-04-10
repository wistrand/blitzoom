---
name: blitzoom
description: BlitZoom graph visualization API. Use when embedding graphs, using addNodes/removeNodes/updateNodes, configuring options, using <bz-graph> web component, or working with BlitZoom's public API.
argument-hint: [topic]
---

# BlitZoom API

BlitZoom is a deterministic graph layout that positions nodes by property similarity. No force simulation — same input always produces the same layout.

## Quick Start

Simplest way — a single HTML element with the bundle loaded directly from GitHub:

```html
<style>bz-graph:not(:defined) { visibility: hidden; }</style>
<script type="module" src="https://wistrand.github.io/blitzoom/dist/blitzoom.bundle.js"></script>
<bz-graph edges="data/karate.edges" nodes="data/karate.nodes"
          level="3" heatmap="density" legend>
</bz-graph>
```

The `<style>` rule prevents a flash of raw text before the component loads. Always include it before any `<bz-graph>` element.

Or from a local copy:

```html
<script type="module" src="blitzoom.bundle.js"></script>
```

The bundle is a single minified file (~98KB gzipped) that includes everything — no other files needed. For unbundled ES modules (development), import from `blitzoom.js` instead:

```html
<script type="module" src="blitzoom.js"></script>
```

## Web Component: `<bz-graph>`

### Attributes

| Attribute           | Example                 | Description                                              |
| ------------------- | ----------------------- | -------------------------------------------------------- |
| `edges`             | `"data/karate.edges"`   | URL to .edges file                                       |
| `nodes`             | `"data/karate.nodes"`   | URL to .nodes file (optional)                            |
| `format`            | `"json"`                | Inline data: `json` or `snap` (default)                  |
| `level`             | `"3"`                   | Initial zoom level (0-indexed). Omit to let BlitZoom auto-pick — set explicitly only to override (e.g. restoring a saved view). |
| `heatmap`           | `"density"`             | `off`, `density`, `splat`                                |
| `edge-mode`         | `"curves"`              | `curves`, `lines`, `none`. **`none` only hides edges visually — they still affect layout via `alpha`.** Set `alpha="0"` or omit edges to remove their layout influence. |
| `alpha`             | `"0.5"`                 | Topology blend (0=property only, 1=topology only)        |
| `strengths`         | `"group:5,kind:8"`      | Property group strengths. **This controls the layout** — set strength on the property you want to dominate spatial structure. |
| `label-props`       | `"label,group"`         | Properties shown as labels                               |
| `color-by`          | `"group"`               | Override which property group's colors to display (null=auto). **Display-only — does not affect layout.** Use `strengths` to control layout. |
| `color-scheme`      | `"1"`                   | Scheme index (0=vivid, 1=viridis, 2=plasma...)           |
| `quant`             | `"norm"`                | `gaussian` (default), `rank`, `norm`. Low-level override — most users want `incremental` instead. |
| `legend`            | (boolean)               | Show color legend                                        |
| `light-mode`        | (boolean)               | Light theme                                              |
| `webgl`             | (boolean)               | WebGL2 rendering                                         |
| `incremental`       | (boolean)               | Bundled preset for runtime mutation and streaming. Sets `quant='norm'`, disables periodic rebuild, suppresses auto-tune-on-load. Use for any graph that will receive `addNodes`/`removeNodes`/`updateNodes` calls. |
| `rebuild-threshold` | `"0.10"`                | Full rebuild trigger (fraction of original N). `incremental` defaults this to `Infinity` (off). |

### Inline JSON (recommended: `<script>` wrapper)

Wrap data in `<script type="application/json">` to avoid any flash of raw text — no `:not(:defined)` CSS needed:

```html
<bz-graph level="2" legend>
  <script type="application/json">
    {"nodes":[{"id":"a","group":"x"},{"id":"b","group":"y"}],
     "edges":[{"src":"a","dst":"b"}]}
  </script>
</bz-graph>
```

The format is auto-detected from the script type. You can also use raw text with `format="json"` (requires the `:not(:defined)` CSS rule):

```html
<bz-graph format="json" level="2" legend>
  {"nodes":[{"id":"a","group":"x"},{"id":"b","group":"y"}],
   "edges":[{"src":"a","dst":"b"}]}
</bz-graph>
```

### Inline SNAP

```html
<bz-graph level="2" legend>
  <script type="text/plain">
alice	bob
bob	carol
  </script>
</bz-graph>
```

Or as raw text (requires `:not(:defined)` CSS):

```html
<bz-graph level="2" legend>
alice	bob
bob	carol
</bz-graph>
```

### Programmatic access

`<bz-graph>` exposes a `ready` Promise that resolves once the build completes — modeled on `document.fonts.ready` and `navigator.serviceWorker.ready`. Use it from any async function:

```js
const el = document.querySelector('bz-graph');
await el.ready;
el.view.setStrengths({ group: 8, kind: 3 });
el.view.colorScheme = 3;
```

The Promise is created in the element's constructor, so it works regardless of when you read it — including for dynamically-created elements:

```js
const g = document.createElement('bz-graph');
g.setAttribute('edges', 'data/karate.edges');
document.body.appendChild(g);
await g.ready;
await g.addNodes(batch);
```

No listener-vs-append ordering to worry about. The Promise rejects if the build fails.

The legacy `addEventListener('ready', ...)` still works for static-HTML callers who prefer the event shape. After a `_reload` (e.g. file drop), `g.ready` is replaced with a fresh pending Promise tracking the new build.

### Companion components

```html
<bz-graph id="g" edges="data/karate.edges" nodes="data/karate.nodes"></bz-graph>
<bz-compass for="g"></bz-compass>
<bz-controls for="g"></bz-controls>
```

`<bz-compass>` — radial 2D control for strengths + bearings + alpha (center handle). Click a label to set colorBy; shift-click to toggle label display.
`<bz-controls>` — strength sliders + bearing dials + label checkboxes. Checkboxes control which property groups appear as node labels (`labelProps`).
Both bind declaratively via `for` attribute and dispatch `input`, `change`, `colorby`, and `labelchange` events.

## Incremental Updates

Add, remove, and update nodes at runtime. Use `incremental` attribute for stable layouts:

```html
<bz-graph id="g" edges="data/base.edges" nodes="data/base.nodes" incremental>
</bz-graph>
<script type="module">
  const g = document.getElementById('g');
  await g.ready;

  // Add nodes + edges
  await g.addNodes(
    [{id: 'n1', group: 'analyst'}, {id: 'n2', group: 'admin'}],
    [{src: 'n1', dst: 'n2'}]
  );

  // Update properties (only changed nodes re-projected)
  await g.updateNodes([{id: 'n1', group: 'manager'}]);

  // Remove by ID (edges cleaned up automatically)
  await g.removeNodes(['n2']);
</script>
```

All three methods:
- Animate by default (lerp existing, fade in new). Pass `{ animate: false }` to snap.
- Are async — await them to sequence operations.
- Work with both `<bz-graph>` and `BlitZoomCanvas`.

### Streaming large datasets

For graphs that grow to tens or hundreds of thousands of nodes via repeated `addNodes` calls, set the `incremental` attribute. Two patterns:

**No-seed (recommended for pure streaming):** declare `<bz-graph>` with no inline data. The canvas builds empty; the first `addNodes` call bootstraps the property-group schema from that batch's fields and applies any user-set strengths to the new groups.

```html
<bz-graph id="g" incremental level="4" legend strengths="category:5,block:8">
</bz-graph>
<script type="module">
  const g = document.getElementById('g');
  await g.ready;
  const BATCH_SIZE = 2000;
  for (let i = 0; i < allNodes.length; i += BATCH_SIZE) {
    const batch = allNodes.slice(i, i + BATCH_SIZE);
    await g.addNodes(batch, [], { animate: false });
    g.view.showProgress(`Streaming... ${i + batch.length} / ${allNodes.length}`);
  }
  g.view.showProgress(null);
</script>
```

**Seeded (when you have a meaningful starting set):** include a `<script type="application/json">` with the seed. The schema is derived from the seed nodes' fields.

```html
<bz-graph id="g" incremental level="4" legend strengths="category:5">
  <script type="application/json">
    {"nodes": [...seed of ~100-500 nodes...], "edges": [...]}
  </script>
</bz-graph>
<script type="module">
  const g = document.getElementById('g');
  await g.ready;
  const BATCH_SIZE = 2000;
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    const batchEdges = edgesFor(batch);
    await g.addNodes(batch, batchEdges, { animate: false });
    g.view.showProgress(`Streaming... ${i + batch.length} / ${remaining.length}`);
  }
  g.view.showProgress(null);
</script>
```

Things to know about streaming:

- **`incremental` is required** — without it, every batch shifts all existing nodes (gaussian quantization is data-dependent), and a periodic full rebuild fires every ~10% of growth, making per-batch latency spike unpredictably. The preset disables both.
- **Auto-tune is suppressed under `incremental`** — auto-tune would shift positions, defeating the point. Tune your `strengths` manually upfront, or load a small representative seed, run auto-tune once outside `incremental` mode to read the result, then use those values in your streaming page.
- **Batch size: 1K–5K nodes per `addNodes` call** is the sweet spot. Smaller batches add per-call overhead; larger batches block the renderer for too long per blend.
- **`{ animate: false }` is required for streaming** — animation queues up across batches and stutters. Use snap-update for any batch loop.
- **`await` between batches** — `await g.addNodes(...)` waits for the blend *and* one paint frame, so the streaming loop is naturally rate-limited to the display refresh and progress is visible without any manual yield. Don't fire-and-forget — concurrent calls queue, but you lose backpressure.
- **Progress display:** call `g.view.showProgress(text)` and `g.view.showProgress(null)` to clear. No need to invent your own status DOM.
- **Property-group extension:** new categorical values for an existing property group (e.g. a new `category` value appearing in batch 30) extend the value set without shifting existing nodes — the per-node projection is deterministic. **New property groups not present in the first batch** are not added later; if the graph starts empty, the first `addNodes` call bootstraps the schema from that batch's fields and locks it in. If you have a seed (`<script type="application/json">`), the schema is derived from the seed instead. Either way, **include at least one representative node containing every field you'll need** in the first set of nodes the canvas sees.
- **Override the threshold if you really want periodic rebuilds:** the preset disables them by default, but you can pass `rebuild-threshold="0.5"` alongside `incremental` to opt back in. This is rarely useful for streaming workloads.

### Quantization modes

For runtime mutation, prefer the `incremental` attribute (which selects `norm` and applies the right defaults) over setting `quant="norm"` directly.

| Mode                 | Description                                       | Incremental behavior                             |
| -------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `gaussian` (default) | Empirical mean/std from data. Best grid utilization. | All nodes shift on every insertion.             |
| `rank`               | Rank-based uniform occupancy.                     | All nodes shift.                                 |
| `norm`               | Projection matrix norms as scale. No data scan.   | Zero displacement — existing nodes never move. Picked automatically by `incremental`. |

Use `incremental` for any graph that grows at runtime. Use the default `gaussian` for static datasets (best visual quality).

### Events

```js
el.addEventListener('nodesadded', e => console.log(`+${e.detail.count}`));
el.addEventListener('nodesremoved', e => console.log(`-${e.detail.count}`));
el.addEventListener('nodesupdated', e => console.log(`~${e.detail.count}`));
```

All mutation events include `e.detail.total` (current node count).

Other events on the canvas: `statechange` (after any state mutation), `blend` (after blend completes), `ready` (on `<bz-graph>` after initial load). On companion components: `colorby` (label click, `e.detail.name`), `labelchange` (shift-click label or checkbox toggle, `e.detail.labelProps` array).

## Canvas API

For lower-level control without the web component. Import from the bundle URL or a local path:

### From SNAP text

```js
// From GitHub (no install needed):
import { createBlitZoomView } from 'https://wistrand.github.io/blitzoom/dist/blitzoom.bundle.js';
// Or local:
// import { createBlitZoomView } from './blitzoom.bundle.js';

const view = createBlitZoomView(canvas, edgesText, nodesText, {
  initialLevel: 3,
  edgeMode: 'curves',
  heatmapMode: 'density',
  strengths: { group: 8, edgetype: 4 },
  incremental: true,  // bundled preset for runtime mutation: norm quant + no rebuild + no auto-tune
});
```

The `incremental: true` option mirrors the `<bz-graph incremental>` attribute. Pass it to either factory (`createBlitZoomView`, `createBlitZoomFromGraph`) when the view will receive `addNodes`/`removeNodes`/`updateNodes` calls. Individual settings (`quantMode`, `rebuildThreshold`, `autoTune`) can still be passed alongside it to override the preset per-field.

### From JS objects

```js
import { createBlitZoomFromGraph } from './blitzoom.js';

const view = createBlitZoomFromGraph(canvas,
  [
    { id: 'alice', group: 'eng', label: 'Alice', lang: 'Go', exp: 8 },
    { id: 'bob',   group: 'eng', label: 'Bob',   lang: 'Go', exp: 5 },
  ],
  [{ src: 'alice', dst: 'bob' }],
  { strengths: { group: 5, lang: 8 } }
);
```

Nodes need `id` (required), `group`, `label`. Any other property becomes an extra property group. Numeric values get multi-resolution tokenization automatically.

### Instance methods

```js
view.setStrengths({ group: 8, kind: 3 });    // re-blend with new strengths
view.setBearing('group', Math.PI / 4);        // rotate group projection
view.setAlpha(0.5);                           // topology blend weight
view.setOptions({ heatmapMode: 'density' });  // display options

await view.addNodes(nodes, edges, opts);      // incremental add
await view.removeNodes(['id1', 'id2'], opts); // incremental remove
await view.updateNodes([{id: 'id1', group: 'new'}], opts); // update props

view.colorBy = 'kind';                        // override color group
view.cycleColorScheme();                      // next color scheme
view.lightMode = true;                        // toggle theme
view.showLegend = 1;                          // 0=off, 1=BR, 2=BL, 3=TL, 4=TR

const svgString = exportSVG(view, opts);      // SVG export
```

### Auto-tune

```js
import { autoTuneStrengths } from './blitzoom.js';

const result = await autoTuneStrengths(view.nodes, view.groupNames, view.adjList, view.nodeIndexFull, {
  strengths: true, alpha: true,
});
// result: { strengths, alpha, quantMode, labelProps, score }
```

### SVG export

```js
import { exportSVG, createSVGView } from './blitzoom.js';

// From a live view
const svg = exportSVG(view, { background: true, edges: true, labels: true });

// Headless (no DOM)
const headless = createSVGView(nodes, edges, { width: 800, height: 600, level: 3 });
const svg = exportSVG(headless);
```

## Data Formats

BlitZoom accepts multiple formats through `parseAny(text, filenameHint?)`:

| Format             | Detection                     | Notes                                           |
| ------------------ | ----------------------------- | ----------------------------------------------- |
| SNAP .edges/.nodes | Tab-delimited, `#` comments   | Primary format, worker pipeline                 |
| CSV/TSV/SSV        | Header sniffing, auto-delimit  | Maps columns to id/label/group roles            |
| D3 JSON            | `{nodes, links}`               | Supports `name` fallback, numeric endpoints     |
| JGF                | `{graph: {nodes, edges}}`      | Dict or array form                              |
| GraphML            | `<graphml>` XML                | Key/attribute registry                          |
| GEXF               | `<gexf>` XML                   | Attribute registry                              |
| Cytoscape          | `{elements: {nodes, edges}}`   | Grouped and flat forms                          |
| STIX 2.1           | `{type: "bundle"}`             | ATT&CK bundles                                  |

Drop any file onto the canvas or `<bz-graph>` to load it. For detailed format specs, see [data-formats.md](data-formats.md).

## Public API Exports

From `blitzoom.js`:

```js
// Factories
export { createBlitZoomView, createBlitZoomFromGraph } from './blitzoom-factory.js';
export { BlitZoomCanvas } from './blitzoom-canvas.js';
export { BzGraph } from './bz-graph.js';

// Utilities
export { autoTuneStrengths, autoTuneBearings } from './blitzoom-utils.js';
export { exportSVG, createSVGView } from './blitzoom-svg.js';
export { projectNode } from './blitzoom-pipeline.js';
export { parseAny, detectFormat } from './blitzoom-parsers.js';
export { initGPU } from './blitzoom-gpu.js';
export { isWebGL2Available } from './blitzoom-gl-renderer.js';

// Color schemes
export { generateGroupColors, SCHEME_VIVID, SCHEME_VIRIDIS, ... } from './blitzoom-colors.js';
```

For full constructor options, see [options-reference.md](options-reference.md).
