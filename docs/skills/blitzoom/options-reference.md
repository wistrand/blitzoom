# BlitZoom Options Reference

All options for `createBlitZoomView` and `createBlitZoomFromGraph`. All are optional.

| Option           | Type           | Default       | Description                                                                                                          |
| ---------------- | -------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `initialLevel`   | number         | 3             | Starting zoom level index (0=L1, 13=L14, 14=RAW)                                                                    |
| `edgeMode`       | string         | `'curves'`    | `'curves'`, `'lines'`, or `'none'`                                                                                   |
| `heatmapMode`    | string         | `'off'`       | `'off'`, `'splat'`, or `'density'`                                                                                   |
| `quantMode`      | string         | `'gaussian'`  | `'gaussian'` (density-preserving), `'rank'` (uniform), `'norm'` (stable for incremental). Low-level — most users want `incremental` instead. |
| `incremental`    | boolean        | false         | Bundled preset for runtime mutation/streaming. Sets `quantMode='norm'`, `rebuildThreshold=Infinity`, `autoTune=false`. Each can still be overridden by passing it explicitly alongside. |
| `rebuildThreshold` | number       | 0.10          | Trigger periodic full rebuild after this fraction of original-N inserts via `addNodes`. Set to `Infinity` to disable. `incremental` defaults this to `Infinity`. |
| `sizeBy`         | string         | `'edges'`     | Node size: `'edges'` (degree) or `'members'` (count)                                                                 |
| `sizeLog`        | boolean        | false         | Log scale for node size                                                                                              |
| `smoothAlpha`    | number         | 0             | Topology blend weight, 0 (property only) to 1 (topology only)                                                       |
| `strengths`      | object         | `{group:3}`   | Override property group strengths. Keys are group names, values are 0-10.                                            |
| `labelProps`     | array          | []            | Property names to show as node labels                                                                                |
| `showLegend`     | boolean/number | false         | Draw color legend. 0=off, 1=BR, 2=BL, 3=TL, 4=TR                                                                   |
| `showResetBtn`   | boolean        | false         | Draw reset button in top-right corner                                                                                |
| `clickDelay`     | number         | 0             | Milliseconds to delay single-click for double-click disambiguation                                                   |
| `keyboardTarget` | EventTarget    | canvas        | Element to bind keyboard listener to (e.g. `window`)                                                                 |
| `webgl`          | boolean        | false         | Use WebGL2 instanced rendering for geometry                                                                          |
| `useGPU`         | boolean        | false         | Force WebGPU compute for projection and blend                                                                        |
| `autoGPU`        | boolean        | true          | Auto-enable WebGPU when N*G > 2000                                                                                   |
| `colorScheme`    | number         | 0             | Color scheme index: 0=vivid, 1=viridis, 2=plasma, 3=inferno, 4=thermal, 5=grayscale, 6=diverging, 7=greens, 8=reds  |
| `colorBy`        | string         | null          | Override which property group controls node colors. null=auto (highest-strength group).                              |
| `lightMode`      | boolean        | false         | Light theme                                                                                                          |
| `autoTune`       | object\|false  | null          | Auto-tune on load: `{ strengths: true, alpha: true, quant: true }`. Set to `false` to disable; `incremental` does this for you. |

## Empty graphs and schema bootstrap

`createBlitZoomFromGraph(canvas, [], [], opts)` and `<bz-graph>` with no inline data both produce a valid empty canvas. The first `addNodes` call into an empty graph **derives the property-group schema from that batch's fields** (excluding `id`/`group`/`label`), builds projection matrices for the new groups, and computes numeric bins. Strengths set via `opts.strengths` (or the `strengths` attribute) are preserved across the bootstrap.

**Limitation**: property keys not present in the first batch are silently dropped on subsequent batches — same as the existing static-build behavior. Include at least one representative node containing every field you'll need in the first set of nodes the canvas sees.

## Callback options

| Option          | Signature          | Description                                                                                |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| `onSelect`      | `(hit) => void`    | Called when a node/supernode is clicked. `hit.item` is the node, `hit.type` is `'node'` or `'supernode'`. |
| `onDeselect`    | `() => void`       | Called when selection is cleared.                                                           |
| `onHover`       | `(hit) => void`    | Called on hover change. `hit` is null when leaving a node.                                  |
| `onLevelChange` | `(level) => void`  | Called after zoom-level auto-switch.                                                       |
| `onZoomToHit`   | `(hit) => void`    | Called on double-click node. Override to customize zoom behavior.                           |
| `onSwitchLevel` | `(level) => void`  | Called on manual level change (comma/period keys). Override to customize.                   |
| `onKeydown`     | `(event) => bool`  | Called before canvas handles keydown. Return true to consume the event.                     |
| `onRender`      | `() => void`       | Called after each render frame.                                                            |
| `onAnnounce`    | `(text) => void`   | Accessibility announcement callback.                                                       |
| `onSummary`     | `(rows) => void`   | Summary table data callback (for screen readers).                                          |

## addNodes / removeNodes / updateNodes options

| Option    | Type    | Default | Description                                                 |
| --------- | ------- | ------- | ----------------------------------------------------------- |
| `animate` | boolean | true    | Animate the transition (lerp existing items, fade in new)   |
| `animMs`  | number  | 400     | Animation duration in milliseconds                          |
