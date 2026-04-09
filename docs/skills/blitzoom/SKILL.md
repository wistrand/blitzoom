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
<script type="module" src="https://raw.githubusercontent.com/wistrand/blitzoom/main/docs/dist/blitzoom.bundle.js"></script>
<bz-graph edges="data/karate.edges" nodes="data/karate.nodes"
          level="3" heatmap="density" legend>
</bz-graph>
```

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
| `level`             | `"3"`                   | Initial zoom level (0-indexed)                           |
| `heatmap`           | `"density"`             | `off`, `density`, `splat`                                |
| `edge-mode`         | `"curves"`              | `curves`, `lines`, `none`                                |
| `alpha`             | `"0.5"`                 | Topology blend (0=property only, 1=topology only)        |
| `strengths`         | `"group:5,kind:8"`      | Property group strengths                                 |
| `label-props`       | `"label,group"`         | Properties shown as labels                               |
| `color-by`          | `"group"`               | Override color group (null=auto)                         |
| `color-scheme`      | `"1"`                   | Scheme index (0=vivid, 1=viridis, 2=plasma...)           |
| `quant`             | `"norm"`                | `gaussian` (default), `rank`, `norm`                     |
| `legend`            | (boolean)               | Show color legend                                        |
| `light-mode`        | (boolean)               | Light theme                                              |
| `webgl`             | (boolean)               | WebGL2 rendering                                         |
| `incremental`       | (boolean)               | Enable norm quantization for stable incremental updates   |
| `rebuild-threshold` | `"0.10"`                | Full rebuild trigger (fraction of original N)            |

### Inline JSON

```html
<bz-graph format="json" level="2" legend>
  {"nodes":[{"id":"a","group":"x"},{"id":"b","group":"y"}],
   "edges":[{"src":"a","dst":"b"}]}
</bz-graph>
```

### Inline SNAP

```html
<bz-graph level="2" legend>
alice	bob
bob	carol
</bz-graph>
```

### Programmatic access

```js
const el = document.querySelector('bz-graph');
el.addEventListener('ready', () => {
  el.view.setStrengths({ group: 8, kind: 3 });
  el.view.colorScheme = 3;
});
```

### Companion components

```html
<bz-graph id="g" edges="data/karate.edges" nodes="data/karate.nodes"></bz-graph>
<bz-compass for="g"></bz-compass>
<bz-controls for="g"></bz-controls>
```

`<bz-compass>` — radial 2D control for strengths + bearings + alpha (center handle).
`<bz-controls>` — strength sliders + bearing dials + label checkboxes.
Both bind declaratively via `for` attribute.

## Incremental Updates

Add, remove, and update nodes at runtime. Use `incremental` attribute for stable layouts:

```html
<bz-graph id="g" edges="data/base.edges" nodes="data/base.nodes" incremental>
</bz-graph>
<script>
  const g = document.getElementById('g');
  g.addEventListener('ready', async () => {
    // Add nodes + edges
    await g.addNodes(
      [{id: 'n1', group: 'analyst'}, {id: 'n2', group: 'admin'}],
      [{src: 'n1', dst: 'n2'}]
    );

    // Update properties (only changed nodes re-projected)
    await g.updateNodes([{id: 'n1', group: 'manager'}]);

    // Remove by ID (edges cleaned up automatically)
    await g.removeNodes(['n2']);
  });
</script>
```

All three methods:
- Animate by default (lerp existing, fade in new). Pass `{ animate: false }` to snap.
- Are async — await them to sequence operations.
- Work with both `<bz-graph>` and `BlitZoomCanvas`.

### Quantization modes

| Mode                 | Description                                       | Incremental behavior                             |
| -------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `gaussian` (default) | Empirical mean/std from data. Best grid utilization. | All nodes shift on every insertion.             |
| `rank`               | Rank-based uniform occupancy.                     | All nodes shift.                                 |
| `norm`               | Projection matrix norms as scale. No data scan.   | Zero displacement — existing nodes never move.   |

Use `norm` for incremental updates. Use `gaussian` for static datasets (best visual quality).

### Events

```js
el.addEventListener('nodesadded', e => console.log(`+${e.detail.count}`));
el.addEventListener('nodesremoved', e => console.log(`-${e.detail.count}`));
el.addEventListener('nodesupdated', e => console.log(`~${e.detail.count}`));
```

All events include `e.detail.total` (current node count).

## Canvas API

For lower-level control without the web component. Import from the bundle URL or a local path:

### From SNAP text

```js
// From GitHub (no install needed):
import { createBlitZoomView } from 'https://raw.githubusercontent.com/wistrand/blitzoom/main/docs/dist/blitzoom.bundle.js';
// Or local:
// import { createBlitZoomView } from './blitzoom.bundle.js';

const view = createBlitZoomView(canvas, edgesText, nodesText, {
  initialLevel: 3,
  edgeMode: 'curves',
  heatmapMode: 'density',
  strengths: { group: 8, edgetype: 4 },
  quantMode: 'norm',
});
```

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
