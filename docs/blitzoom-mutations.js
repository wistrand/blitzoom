// blitzoom-mutations.js — Incremental graph mutation functions.
// Standalone functions that operate on a BlitZoomCanvas instance (view).
// Extracted from blitzoom-canvas.js to keep the component focused on rendering.

import { ZOOM_LEVELS, RAW_LEVEL, getNodePropValue, PROJECTION_SEED_BASE, MINHASH_K, buildGaussianProjection } from './blitzoom-algo.js';
import { projectNode, computeProjections, computeNumericBins, computeAdjGroups } from './blitzoom-pipeline.js';
import { generateGroupColors } from './blitzoom-colors.js';

// ─── Shared helpers ─────────────────────────────────────────────────────────

/**
 * Yield to the browser so it can both paint and dispatch queued input events
 * before this mutation's promise resolves. Without this yield, a tight loop
 * of `await g.addNodes(...)` calls keeps the page unresponsive — keydown,
 * pointerdown, and other input events sit in the queue until the loop ends.
 *
 * The implementation has two parts:
 *   1. `requestAnimationFrame` — gives the browser a paint opportunity so the
 *      newly-rendered nodes show up before the next batch starts.
 *   2. A macrotask boundary — `scheduler.yield()` (Chrome 129+) when
 *      available, otherwise `setTimeout(r, 0)`. This is the part that lets
 *      the browser dispatch queued input events. The microtask boundaries
 *      from `await` alone are not enough: input dispatch happens between
 *      tasks, not between microtasks.
 *
 * Headless / non-browser environments (Deno tests, jsdom-without-rAF) fall
 * through to a resolved promise — the yield is a no-op and mutations run as
 * fast as possible.
 */
const _yieldFrame = typeof requestAnimationFrame !== 'undefined'
  ? async () => {
      await new Promise(r => requestAnimationFrame(r));
      if (typeof scheduler !== 'undefined' && scheduler.yield) {
        await scheduler.yield();
      } else {
        await new Promise(r => setTimeout(r, 0));
      }
    }
  : () => Promise.resolve();

/** Cancel any in-flight mutation animation on the view. */
function cancelAnimation(view) {
  if (view._animRaf) {
    cancelAnimationFrame(view._animRaf);
    view._animRaf = null;
    if (view._animCleanup) { view._animCleanup(); view._animCleanup = null; }
  }
}

/** Wait for any in-progress mutation to finish. */
async function waitForMutex(view) {
  while (view._addNodesRunning) {
    await new Promise(r => setTimeout(r, 50));
  }
}

/** Snapshot current visible item positions keyed by bid (supernodes) or id (raw nodes). */
export function snapshotPositions(view) {
  const positions = new Map();
  const isRaw = view.currentLevel === RAW_LEVEL;
  if (isRaw) {
    for (const n of view.nodes) positions.set(n.id, { x: n.x, y: n.y });
  } else {
    const level = view.levels[view.currentLevel];
    if (level) {
      for (const sn of level.supernodes) positions.set(sn.bid, { x: sn.x, y: sn.y });
    }
  }
  return positions;
}

/** Animate transition: lerp existing items, fade in new items. */
export function animateTransition(view, prevPositions, durationMs = 400) {
  return new Promise(resolve => {
    const isRaw = view.currentLevel === RAW_LEVEL;
    const items = isRaw ? view.nodes : view.getLevel(view.currentLevel).supernodes;
    const keyFn = isRaw ? n => n.id : sn => sn.bid;

    for (const item of items) {
      const key = keyFn(item);
      item._finalX = item.x;
      item._finalY = item.y;
      const prev = prevPositions.get(key);
      if (prev) {
        item._prevX = prev.x;
        item._prevY = prev.y;
      } else {
        item._isNew = true;
      }
    }

    const cleanup = () => {
      for (const item of items) {
        if (item._finalX !== undefined) { item.x = item._finalX; item.y = item._finalY; }
        delete item._prevX; delete item._prevY;
        delete item._finalX; delete item._finalY;
        delete item._isNew;
      }
      view._animProgress = undefined;
      view._animRaf = null;
      view._animCleanup = null;
    };
    view._animCleanup = cleanup;

    const startTime = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const e = ease(t);
      view._animProgress = e;
      for (const item of items) {
        if (item._isNew) {
          item.x = item._finalX;
          item.y = item._finalY;
        } else if (item._prevX !== undefined) {
          item.x = item._prevX + (item._finalX - item._prevX) * e;
          item.y = item._prevY + (item._finalY - item._prevY) * e;
        }
      }
      view.renderNow();
      if (t < 1) {
        view._animRaf = requestAnimationFrame(animate);
      } else {
        cleanup();
        view.renderNow();
        resolve();
      }
    };
    view._animRaf = requestAnimationFrame(animate);
  });
}

/** Extend color maps for nodes with new property values (preserving existing colors). */
function extendColorMaps(view, nodes) {
  for (const g of view.groupNames) {
    const existing = view.propColors[g] || {};
    const newVals = [];
    for (const node of nodes) {
      const val = getNodePropValue(node, g, view.adjList);
      if (val !== undefined && !(val in existing)) newVals.push(val);
    }
    if (newVals.length > 0) {
      const uniqueNew = [...new Set(newVals)].sort();
      const newColors = generateGroupColors(uniqueNew, view._colorScheme);
      view.propColors[g] = { ...existing, ...newColors };
    }
  }
  view.groupColors = view.propColors['group'] || {};
}

/** Blend + layout + animate (or snap). Shared tail for all mutations. */
async function blendAndAnimate(view, prevPositions, animate, animMs) {
  view._quantStats = {};
  view.levels = new Array(ZOOM_LEVELS.length).fill(null);
  await view._blend();
  view._refreshPropCache();
  view.layoutAll();

  if (animate && prevPositions && prevPositions.size > 0) {
    // animateTransition runs an rAF loop and resolves only after the
    // animation completes — natural frame yielding, no extra wait needed.
    await animateTransition(view, prevPositions, animMs);
  } else {
    // Snap path: render() schedules an rAF, then yield one frame so the
    // browser actually paints before this mutation resolves. Lets streaming
    // loops (`for ... await g.addNodes(...)`) progress visually without
    // requiring the caller to insert a manual rAF yield.
    view.render();
    await _yieldFrame();
  }
}

/**
 * Bootstrap an empty graph's schema from the first batch of incoming nodes.
 *
 * When a graph is created with no seed (`createBlitZoomFromGraph(canvas, [])`
 * or `<bz-graph>` with no inline data), `_extraPropNames` and `groupNames`
 * only contain the four defaults (`group`, `label`, `structure`, `neighbors`).
 * The first call to `addNodes` discovers the property groups from the new
 * nodes' fields and rebuilds the canvas's schema in place: extends
 * `groupNames`, builds projection matrices for the new groups (deterministic
 * seeds keyed on group index, matching the factory init path), computes
 * `_numericBins` from the new nodes, and initializes empty `propColors`
 * entries. User-provided `propStrengths` for the new groups are preserved
 * (the factory already stored them on the canvas at construction time).
 */
function bootstrapEmptyGraph(view, newNodes) {
  // Discover extra property keys from the new nodes (excluding the special
  // id/group/label fields). Use the first node as the schema source — same
  // strategy as createBlitZoomFromGraph.
  const newExtras = [];
  const seen = new Set();
  for (const rn of newNodes) {
    for (const k in rn) {
      if (k === 'id' || k === 'group' || k === 'label') continue;
      if (!seen.has(k)) { seen.add(k); newExtras.push(k); }
    }
  }
  if (newExtras.length === 0) return;

  // Extend groupNames with the new extras and build projection matrices.
  // The seed for each group is PROJECTION_SEED_BASE + index in groupNames,
  // matching the canvas constructor's per-group seeding so projections are
  // deterministic regardless of when the group was added.
  for (const ep of newExtras) {
    if (view.groupNames.includes(ep)) continue;
    view.groupNames.push(ep);
    const idx = view.groupNames.length - 1;
    view.groupProjections[ep] = buildGaussianProjection(PROJECTION_SEED_BASE + idx, MINHASH_K);
    if (view.propStrengths[ep] === undefined) view.propStrengths[ep] = 0;
    if (!view.propColors[ep]) view.propColors[ep] = {};
  }
  view._extraPropNames = newExtras;

  // Compute numeric bins from the bootstrap batch. computeNumericBins expects
  // node-shaped objects with `extraProps` — wrap raw input nodes accordingly.
  const wrapped = newNodes.map(rn => {
    const extraProps = {};
    for (const k in rn) {
      if (k !== 'id' && k !== 'group' && k !== 'label') extraProps[k] = rn[k];
    }
    return { extraProps };
  });
  view._numericBins = computeNumericBins(wrapped, newExtras);

  // Apply factory-style default strength: if `group` has only one distinct
  // value across the bootstrap batch (typical when group isn't a useful
  // categorical), pick the first non-trivial extra prop and give it strength 3.
  // Skip if the user already set non-zero strengths.
  const userSet = view.groupNames.some(g => (view.propStrengths[g] || 0) > 0);
  if (!userSet) {
    const groupVals = new Set();
    for (const n of newNodes) { groupVals.add(n.group); if (groupVals.size > 1) break; }
    if (groupVals.size > 1) {
      view.propStrengths['group'] = 3;
    } else {
      for (const g of newExtras) {
        const vals = new Set();
        for (const n of newNodes) {
          vals.add(n[g]);
          if (vals.size > 50) break;
        }
        if (vals.size >= 2 && vals.size <= 50) { view.propStrengths[g] = 3; break; }
      }
    }
  }

  // _originalN and _insertsSinceRebuild are managed by addNodes (the
  // first-build path), not bootstrap. _refreshPropCache is called by
  // blendAndAnimate after the blend, so no need to call it here either.
}

// ─── Mutation functions ─────────────────────────────────────────────────────

/**
 * Add nodes (and optionally edges) incrementally.
 * @param {BlitZoomCanvas} view
 * @param {Array} newNodes - [{id, group?, label?, ...extraProps}]
 * @param {Array} [newEdges=[]] - [{src, dst}]
 * @param {object} [opts] - { animate: true, animMs: 400 }
 */
export async function addNodes(view, newNodes, newEdges = [], opts = {}) {
  // Queue if another mutation is in progress
  if (view._addNodesRunning) {
    if (view._addNodesQueue) {
      view._addNodesQueue.nodes.push(...newNodes);
      view._addNodesQueue.edges.push(...newEdges);
    } else {
      view._addNodesQueue = { nodes: [...newNodes], edges: [...newEdges], opts };
    }
    return;
  }
  view._addNodesRunning = true;
  cancelAnimation(view);
  try {

  const animate = opts.animate !== false;

  // 0. First-build detection. An empty graph has _originalN === 0 (set by
  // the canvas constructor). The first addNodes call into such a graph IS
  // the original build, not an incremental insert — its nodes shouldn't
  // count toward the rebuild-threshold accounting. We capture this state
  // here and apply the right bookkeeping at step 6 below.
  //
  // Schema bootstrap is a separate concern: only needed when no extra
  // property groups have been established yet. Bootstrap derives the
  // schema from this batch's fields, extends groupNames, and builds
  // projection matrices for the new groups.
  const isFirstBuild = view._originalN === 0 && newNodes.length > 0;
  if (isFirstBuild && view._extraPropNames.length === 0) {
    bootstrapEmptyGraph(view, newNodes);
  }

  // 1. Build node objects and project each
  const added = [];
  for (const rn of newNodes) {
    const id = rn.id;
    if (view.nodeIndexFull[id]) continue;
    const group = rn.group || 'unknown';
    const label = rn.label || id;
    const extraProps = {};
    for (const k in rn) {
      if (k !== 'id' && k !== 'group' && k !== 'label') extraProps[k] = rn[k];
    }
    const node = { id, group, label, degree: 0, edgeTypes: null, extraProps,
                   projections: {}, px: 0, py: 0, gx: 0, gy: 0, x: 0, y: 0 };

    const neighborGroups = (view.adjList[id] || []).map(nid => view.nodeIndexFull[nid]?.group || 'unknown');
    node.projections = projectNode(
      node, neighborGroups, view.groupProjections, view.groupNames,
      view.hasEdgeTypes, view._extraPropNames, view._numericBins
    );

    view.nodes.push(node);
    view.nodeIndexFull[id] = node;
    view.adjList[id] = [];
    added.push(node);
  }

  // 2. Add edges
  for (const e of newEdges) {
    const src = view.nodeIndexFull[e.src], dst = view.nodeIndexFull[e.dst];
    if (!src || !dst) continue;
    view.edges.push(e);
    src.degree++;
    dst.degree++;
    view.adjList[e.src].push(e.dst);
    view.adjList[e.dst].push(e.src);
    if (src.degree > view.maxDegree) view.maxDegree = src.degree;
    if (dst.degree > view.maxDegree) view.maxDegree = dst.degree;
  }

  if (added.length === 0 && newEdges.length === 0) return;

  // 3. Extend color maps
  extendColorMaps(view, added);

  // 4. Snapshot + blend + animate
  const prevPositions = animate ? snapshotPositions(view) : null;
  await blendAndAnimate(view, prevPositions, animate && added.length > 0, opts.animMs || 400);

  // 5. Dispatch event
  view.canvas.dispatchEvent(new CustomEvent('nodesadded', {
    detail: { count: added.length, edgesAdded: newEdges.length, total: view.nodes.length },
  }));

  // 6. Account for added nodes. If this was the first build into a
  // previously empty graph, set _originalN to the new size (this batch
  // is the baseline) and leave _insertsSinceRebuild at 0 — the bootstrap
  // batch is not an incremental insert, it's the original. Otherwise,
  // increment the incremental counter and check the rebuild threshold.
  if (isFirstBuild) {
    view._originalN = view.nodes.length;
    view._insertsSinceRebuild = 0;
  } else {
    view._insertsSinceRebuild += added.length;
    if (view._originalN > 0 && view._insertsSinceRebuild > view._originalN * view._rebuildThreshold) {
      await fullRebuild(view);
    }
  }

  // 7. Drain queue
  if (view._addNodesQueue) {
    const q = view._addNodesQueue;
    view._addNodesQueue = null;
    await addNodes(view, q.nodes, q.edges, q.opts);
  }

  } finally { view._addNodesRunning = false; }
}

/**
 * Remove nodes (and their edges) incrementally.
 * @param {BlitZoomCanvas} view
 * @param {string[]} ids - node IDs to remove
 * @param {object} [opts] - { animate: true, animMs: 400 }
 */
export async function removeNodes(view, ids, opts = {}) {
  await waitForMutex(view);
  view._addNodesRunning = true;
  cancelAnimation(view);
  try {

  const animate = opts.animate !== false;
  const removeSet = new Set(ids);

  let removedCount = 0;
  for (const id of removeSet) {
    if (view.nodeIndexFull[id]) removedCount++;
  }
  if (removedCount === 0) return;

  const prevPositions = animate ? snapshotPositions(view) : null;

  // Remove edges touching removed nodes
  const keptEdges = [];
  for (const e of view.edges) {
    if (removeSet.has(e.src) || removeSet.has(e.dst)) {
      if (!removeSet.has(e.src) && view.nodeIndexFull[e.src]) view.nodeIndexFull[e.src].degree--;
      if (!removeSet.has(e.dst) && view.nodeIndexFull[e.dst]) view.nodeIndexFull[e.dst].degree--;
    } else {
      keptEdges.push(e);
    }
  }
  view.edges = keptEdges;

  // Update adjList
  for (const id of removeSet) {
    const neighbors = view.adjList[id] || [];
    for (const nid of neighbors) {
      if (view.adjList[nid]) {
        view.adjList[nid] = view.adjList[nid].filter(x => x !== id);
      }
    }
    delete view.adjList[id];
    delete view.nodeIndexFull[id];
  }

  view.nodes = view.nodes.filter(n => !removeSet.has(n.id));

  // Recompute maxDegree
  view.maxDegree = 1;
  for (const n of view.nodes) {
    if (n.degree > view.maxDegree) view.maxDegree = n.degree;
  }

  await blendAndAnimate(view, prevPositions, animate, opts.animMs || 400);

  view.canvas.dispatchEvent(new CustomEvent('nodesremoved', {
    detail: { count: removedCount, total: view.nodes.length },
  }));

  } finally { view._addNodesRunning = false; }
}

/**
 * Update existing nodes' properties and re-project only the changed nodes.
 * @param {BlitZoomCanvas} view
 * @param {Array} updates - [{id, group?, label?, ...extraProps}]
 * @param {object} [opts] - { animate: true, animMs: 400 }
 */
export async function updateNodes(view, updates, opts = {}) {
  await waitForMutex(view);
  view._addNodesRunning = true;
  cancelAnimation(view);
  try {

  const animate = opts.animate !== false;
  let changed = 0;

  for (const u of updates) {
    const node = view.nodeIndexFull[u.id];
    if (!node) continue;

    if (u.group !== undefined) node.group = u.group;
    if (u.label !== undefined) node.label = u.label;
    if (!node.extraProps) node.extraProps = {};
    for (const k in u) {
      if (k !== 'id' && k !== 'group' && k !== 'label') node.extraProps[k] = u[k];
    }

    const neighborGroups = (view.adjList[u.id] || []).map(nid => view.nodeIndexFull[nid]?.group || 'unknown');
    node.projections = projectNode(
      node, neighborGroups, view.groupProjections, view.groupNames,
      view.hasEdgeTypes, view._extraPropNames, view._numericBins
    );
    changed++;
  }

  if (changed === 0) return;

  // Extend color maps for updated nodes
  const updatedNodes = updates.map(u => view.nodeIndexFull[u.id]).filter(Boolean);
  extendColorMaps(view, updatedNodes);

  const prevPositions = animate ? snapshotPositions(view) : null;
  await blendAndAnimate(view, prevPositions, animate, opts.animMs || 400);

  view.canvas.dispatchEvent(new CustomEvent('nodesupdated', {
    detail: { count: changed, total: view.nodes.length },
  }));

  } finally { view._addNodesRunning = false; }
}

/**
 * Full projection rebuild — recomputes numeric bins, adjGroups, and all projections.
 * @param {BlitZoomCanvas} view
 */
export async function fullRebuild(view) {
  const N = view.nodes.length;
  if (N === 0) return;

  if (N > 50000 && view._progressText !== undefined) {
    view.showProgress(`Rebuilding ${N.toLocaleString()} nodes...`);
    await new Promise(r => requestAnimationFrame(r));
  }

  const prevPositions = snapshotPositions(view);

  const adjGroups = computeAdjGroups(view.nodes, view.adjList, view.nodeIndexFull);
  const numericBins = computeNumericBins(view.nodes, view._extraPropNames);

  const { projBuf } = computeProjections(
    view.nodes, adjGroups, view.groupNames, view.hasEdgeTypes, view._extraPropNames, numericBins
  );

  const G = view.groupNames.length;
  for (let i = 0; i < N; i++) {
    const proj = {};
    for (let g = 0; g < G; g++) {
      const off = (i * G + g) * 2;
      proj[view.groupNames[g]] = [projBuf[off], projBuf[off + 1]];
    }
    view.nodes[i].projections = proj;
  }

  view._numericBins = numericBins;
  view._insertsSinceRebuild = 0;
  view._originalN = N;

  await blendAndAnimate(view, prevPositions, true, 500);

  view._progressText = null;
  console.log(`[BlitZoomCanvas] Full rebuild: ${N} nodes, ${view._extraPropNames.length} extra props`);
}
