// blitzoom-mutations.js — Incremental graph mutation functions.
// Standalone functions that operate on a BlitZoomCanvas instance (view).
// Extracted from blitzoom-canvas.js to keep the component focused on rendering.

import { ZOOM_LEVELS, RAW_LEVEL, getNodePropValue } from './blitzoom-algo.js';
import { projectNode, computeProjections, computeNumericBins, computeAdjGroups } from './blitzoom-pipeline.js';
import { generateGroupColors } from './blitzoom-colors.js';

// ─── Shared helpers ─────────────────────────────────────────────────────────

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
    await animateTransition(view, prevPositions, animMs);
  } else {
    view.render();
  }
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

  // 6. Check if periodic full rebuild is needed
  view._insertsSinceRebuild += added.length;
  if (view._originalN > 0 && view._insertsSinceRebuild > view._originalN * view._rebuildThreshold) {
    await fullRebuild(view);
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
