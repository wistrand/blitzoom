# Plan: Incremental Update API for BlitZoomCanvas

## Goal

Add `addNodes(nodes, edges, opts)` to `BlitZoomCanvas` enabling true incremental graph updates — nodes arrive at runtime, get projected on the fly, and appear in the layout without reloading. Uses hybrid approach: fast per-node projection against cached parameters, with periodic full rebuild to refresh stale statistics.

Starts with a preparatory refactor (Phase 0) extracting factory functions from `blitzoom-canvas.js` into `blitzoom-factory.js`, reducing the canvas file from ~1794 to ~1580 lines and creating a clean separation between the component and its construction logic.

## Architecture: Hybrid Incremental Projection

New nodes are projected against the parameters cached at initial load (numeric bins, adjList for topology tokens). This is O(k) per node per group — fast enough for real-time insertion. A full `computeProjections` rebuild runs when cumulative insertions exceed a threshold (default 10% of original N), refreshing numeric bins and topology tokens for all nodes.

### Invariants

- Per-node projection is node-independent (verified by the incremental demo)
- With `quantMode: 'norm'`, existing nodes' `gx/gy` never change on insertion
- With `quantMode: 'gaussian'`, existing nodes shift proportionally to distribution change
- Projections computed against stale numeric bins clip to nearest boundary — acceptable degradation
- Topology tokens (structure/neighbors) are stale for new nodes until full rebuild — affects only topology-influenced layout (α > 0)

---

## Phase 0: Extract factories from blitzoom-canvas.js

`blitzoom-canvas.js` is 1794 lines mixing the canvas component, factory functions, and data hydration. Extract the factory layer into `blitzoom-factory.js` before adding new code.

### What moves to `blitzoom-factory.js` (~210 lines)

| Function | Lines | Why it's separate |
|----------|-------|-------------------|
| `_hydrateAndLink` | 1694-1714 | Pure data transform — builds node objects from `projBuf`, constructs `adjList`. No canvas dependency. |
| `_finalize` | 1585-1692 | Factory logic — computes default strengths, builds color maps, constructs `BlitZoomCanvas`, kicks off async GPU probe + blend. Only touches canvas via `new BlitZoomCanvas()` at the end. |
| `createBlitZoomView` | 1724-1728 | Public API — calls `runPipeline` then `_finalize`. |
| `createBlitZoomFromGraph` | 1739-1794 | Public API — builds nodeArray from raw objects then `_finalize`. |

### What stays in `blitzoom-canvas.js`

- `BlitZoomCanvas` class (constructor, state, blend, levels, events, input, animation)
- All instance methods (`setStrengths`, `setBearing`, `getLevel`, `_blend`, `render`, etc.)

### Imports

`blitzoom-factory.js` imports:
- `BlitZoomCanvas` from `blitzoom-canvas.js`
- `runPipeline`, `computeProjections` from `blitzoom-pipeline.js`
- `initGPU`, `computeProjectionsGPU`, `gpuUnifiedBlend` from `blitzoom-gpu.js`
- `autoTuneStrengths` from `blitzoom-utils.js`
- `generateGroupColors` from `blitzoom-colors.js`
- `buildGaussianProjection`, `MINHASH_K` from `blitzoom-algo.js`

`blitzoom-canvas.js` removes its bottom imports (`runPipeline`, `computeProjections`, `initGPU`, etc.) — those were only used by the factory functions.

### Re-exports

`blitzoom.js` (public API entrypoint) currently re-exports from `blitzoom-canvas.js`:
```js
export { createBlitZoomView, createBlitZoomFromGraph, BlitZoomCanvas } from './blitzoom-canvas.js';
```

Update to:
```js
export { BlitZoomCanvas } from './blitzoom-canvas.js';
export { createBlitZoomView, createBlitZoomFromGraph } from './blitzoom-factory.js';
```

### Files that import factories directly

Check all HTML files and test files for direct imports of `createBlitZoomView` from `blitzoom-canvas.js` (not via `blitzoom.js`). Update any that bypass the entrypoint.

### Verify

- All 177 pipeline tests pass (they don't use factories)
- All 7 ground truth tests pass
- All GPU tests pass
- `bundle-test.html` works (imports from `blitzoom.js`)
- `example.html`, `howto.html` code examples reference correct import paths
- Viewer loads and renders correctly
- `<bz-graph>` web component works

---

## Phase 1: Extract `projectNode()` from `computeProjections`

Refactor `blitzoom-pipeline.js` to expose a per-node projection utility.

### Current state

`computeProjections` (pipeline.js:252) is a monolithic function that:
1. Iterates all nodes, tokenizes each (group, label, structure, neighbors, extras, edge types)
2. Computes MinHash signature via `computeMinHashInto`
3. Projects each group's signature slice via `projectInto`
4. Writes results to a flat `Float64Array projBuf`

The per-node logic inside the loop is independent — each node's tokens and projection depend only on its own properties plus the shared `numericBins` and `adjGroups` lookup.

### What to extract

```js
// New export from blitzoom-pipeline.js
export function projectNode(node, groupNames, adjList, hasEdgeTypes, extraPropNames, numericBins) {
  // Tokenize: group, label, structure, neighbors, extras, edgetype
  // MinHash: computeMinHashInto(tokenBuf, tokenCount)
  // Project: for each group, projectInto(sig_slice, R_g, buf, offset)
  // Returns: { [groupName]: [px, py], ... }
}
```

This is the inner loop of `computeProjections` lines ~270-320, extracted into a standalone function. The caller provides `numericBins` (cached from initial load) and `adjList` (current, possibly incomplete for new nodes).

### Token buffer management

`computeProjections` uses a shared `tokenBuf` array grown to fit the max token count. `projectNode` needs its own small buffer — allocate once as module-level (same pattern as `_sig` in algo.js), or accept a caller-provided buffer.

### Signature slicing

Currently the full MinHash signature is K=128 slots covering all groups. Each group's tokens occupy a range of the token buffer; the signature is computed over all tokens at once, then each group's 2D projection uses the same full signature but a different Gaussian matrix.

`projectNode` must replicate this: tokenize all groups, compute one MinHash over all tokens, then project each group's matrix against the full normalized signature.

**Verify:** Read `computeProjections` carefully to confirm the signature is global (all groups' tokens hashed together into one K=128 sig) vs per-group. This determines whether `projectNode` can be truly per-group incremental or must do all groups at once per node.

---

## Phase 2: Persist pipeline parameters on BlitZoomCanvas

Store the parameters needed for incremental projection on the canvas instance, currently discarded after construction.

### What to persist

| Parameter | Source | Currently stored? | Needed for |
|-----------|--------|-------------------|------------|
| `numericBins` | `buildGraph` return | No — discarded | Numeric tokenization in `projectNode` |
| `extraPropNames` | `parseNodesFile` / `runPipelineFromObjects` | No — discarded | Token generation |
| `hasEdgeTypes` | `buildGraph` return | Yes (`this.hasEdgeTypes`) | Edge type tokenization |
| `groupNames` | Pipeline return | Yes (`this.groupNames`) | Group iteration |
| `adjList` | `_hydrateAndLink` | Yes (`this.adjList`) | Structure/neighbor tokens |

### Changes

- `_hydrateAndLink` (canvas.js:1694): return `numericBins` from the pipeline result
- `_finalize` (canvas.js:1585): pass `numericBins` and `extraPropNames` to constructor
- `BlitZoomCanvas` constructor: store `this._numericBins` and `this._extraPropNames`

---

## Phase 3: Implement `addNodes()` on BlitZoomCanvas

The core API method.

```js
async addNodes(newNodes, newEdges = [], opts = {}) {
  // opts.animate — lerp + fade (default true)
  // opts.animMs — animation duration (default 400)
}
```

### Steps

1. **Build node objects** from raw input (same shape as existing nodes: `{id, group, label, degree, extraProps, edgeTypes, projections, px, py, gx, gy, x, y}`)

2. **Project each new node** via `projectNode(node, this.groupNames, this.adjList, this.hasEdgeTypes, this._extraPropNames, this._numericBins)`. Attach returned projections to node.

3. **Register nodes** — push to `this.nodes`, add to `this.nodeIndexFull`, init `this.adjList[id] = []`

4. **Add edges** — push to `this.edges`, update `this.adjList` for both endpoints, increment `degree` on both endpoint nodes. New edges to existing nodes make their topology tokens stale (acceptable until next full rebuild).

5. **Update color maps** — check for new group/property values not in existing `propColors`. If found, extend the color map (append new colors from the current scheme).

6. **Snapshot for animation** — if `animate`, save `_prevX/_prevY` on all existing nodes, mark new nodes `_isNew = true`

7. **Blend** — `this._quantStats = {}; this.levels = [...null]; await this._blend();`

8. **Layout** — `this.layoutAll()`

9. **Animate or snap** — if `animate`, run per-node lerp + fade-in animation (new method `_animateTransition`). Otherwise `this.render()`.

10. **Dispatch event** — `canvas.dispatchEvent(new CustomEvent('nodesadded', { detail: { count, total } }))`

11. **Check rebuild threshold** — if cumulative insertions since last full rebuild > 10% of original N, schedule a full rebuild (Phase 5).

**Verify:** After implementation, confirm that with `quantMode: 'norm'`, no existing node's `gx/gy` changes when `addNodes` is called.

---

## Phase 4: Per-node animation in BlitZoomCanvas

Add `_animateTransition(newIds)` method to `BlitZoomCanvas`, reusing the pattern proven in the incremental demo.

### Animation state per node

- `_prevX`, `_prevY` — screen position before the update
- `_isNew` — true for nodes added in this batch
- `_drawX`, `_drawY`, `_drawAlpha` — interpolated values during animation

### Animation loop

```js
_animateTransition(newIdSet, durationMs = 400) {
  const startTime = performance.now();
  const animate = (now) => {
    const t = Math.min(1, (now - startTime) / durationMs);
    const e = 1 - Math.pow(1 - t, 3); // cubic ease-out
    for (const n of this.nodes) {
      if (n._isNew) {
        n.x = n._finalX; n.y = n._finalY; // stay at final pos
        // opacity handled by renderer
      } else if (n._prevX !== undefined) {
        n.x = n._prevX + (n._finalX - n._prevX) * e;
        n.y = n._prevY + (n._finalY - n._prevY) * e;
      }
    }
    this.render(); // uses n.x/n.y for drawing
    if (t < 1) requestAnimationFrame(animate);
    else this._cleanupAnimState();
  };
  requestAnimationFrame(animate);
}
```

### Renderer changes

`renderNodes` in `blitzoom-renderer.js` needs to support per-node opacity for fade-in:
- Check `n._isNew` and a global `_animProgress` on the bz object
- If `_isNew && _animProgress < 1`: use `ctx.globalAlpha = _animProgress`
- Minimal change — add 2 lines to the circle-drawing section

Same for `renderSupernodes` if adding nodes triggers level changes, but for incremental insertion we likely stay at RAW_LEVEL or the current level.

---

## Phase 5: Periodic full rebuild

Track cumulative insertions and trigger a full projection rebuild when the threshold is exceeded.

### State

```js
this._insertsSinceRebuild = 0;  // count of nodes added since last full computeProjections
this._originalN = this.nodes.length;  // N at construction or last full rebuild
this._rebuildThreshold = 0.10;  // 10% of original N
```

### Trigger

At the end of `addNodes`, after blend + render:

```js
this._insertsSinceRebuild += newNodes.length;
if (this._insertsSinceRebuild > this._originalN * this._rebuildThreshold) {
  this._fullRebuild();
}
```

### `_fullRebuild()`

1. Re-run `computeProjections` on the full `this.nodes` array (with current `adjList`, fresh `numericBins`)
2. Update `this._numericBins` with new bin boundaries
3. Re-hydrate all nodes with new projections (overwrite `.projections`)
4. Reset `this._insertsSinceRebuild = 0`, `this._originalN = this.nodes.length`
5. Re-blend + layout + render (with animation if the projection changes are significant)

This is the "honest" path — it corrects any drift from stale numeric bins or topology tokens. With `quantMode: 'norm'`, the re-projection doesn't change `gx/gy` (projections are node-independent and deterministic), so existing nodes stay put even through a full rebuild. With `gaussian`, the fresh μ/σ from the larger dataset may shift positions.

### Optional: worker offload

For large N (>50K), `computeProjections` takes ~200ms. Run in a Web Worker to avoid blocking the main thread:

```js
async _fullRebuild() {
  // Could use existing worker infrastructure (blitzoom-worker.js)
  // or run synchronously for smaller datasets
}
```

Not needed for Phase 5 — synchronous rebuild is fine for datasets up to ~10K. Worker offload is a future optimization.

---

## Phase 6: `<bz-graph>` web component integration

Expose `addNodes` on the `<bz-graph>` element so framework consumers can use it declaratively.

```js
// bz-graph.js
addNodes(nodes, edges, opts) {
  if (!this._view) { this._pendingAdds.push({nodes, edges, opts}); return; }
  return this._view.addNodes(nodes, edges, opts);
}
```

Apply any pending adds after `ready` event.

### Attributes

- `incremental` — opt-in flag that sets `quantMode: 'norm'` and stores pipeline params
- `rebuild-threshold="0.10"` — configurable rebuild threshold

---

## Phase 7: Update documentation

- `CLAUDE.md` — add `addNodes()` to Key Design Decisions, mention norm quantization for incremental stability
- `agent_docs/ARCHITECTURE.md` — new section on incremental updates
- `docs/howto.html` — developer guide example for incremental usage
- `docs/blitzoom.js` — re-export `projectNode` from the public API

---

## Risk mitigation

- **Numeric bin clipping:** New nodes with out-of-range values get clipped to nearest bin boundary. This is a graceful degradation — the node clusters with the extreme group rather than crashing or producing NaN. The periodic full rebuild (Phase 5) corrects this by recomputing bins from the enlarged dataset.

- **Topology token staleness:** New nodes have `degree: 0` and empty neighbor lists at insertion time (before edges arrive). Their structure/neighbor tokens reflect this. When edges arrive in a later `addNodes` call, the endpoints' degrees update but their structure/neighbor projections are stale. This only affects layout quality when `α > 0`. The full rebuild corrects it. For `α = 0` (property-only), topology staleness has zero impact.

- **Color map consistency:** New group values need colors assigned. If the color scheme is index-based (vivid, viridis), appending new values may produce visually similar colors. The existing `generateGroupColors` handles arbitrary value sets, so we just extend it.

- **Memory growth:** Each `addNodes` call appends to `this.nodes` (array), `this.nodeIndexFull` (object), `this.adjList` (object). No pre-allocation needed — V8 handles dynamic growth efficiently. The level cache is invalidated and rebuilt on demand (lazy).

- **Concurrent adds:** `_blend` has a guard (`this._blending`). Multiple rapid `addNodes` calls could queue up. Use the same serialization pattern: if `_blending`, queue the add and process after current blend finishes.

- **Animation overlap:** If a new `addNodes` arrives during a transition animation, cancel the current animation (snap to final positions) and start a new one with the merged state. Same pattern as the demo's `cancelAnim`.

## Dependencies

- `normQuantize` in `blitzoom-algo.js` — already implemented
- Incremental demo (`docs/incremental-demo.html`) — validates the rendering/animation approach
- Per-node projection independence — verified empirically in the analysis
