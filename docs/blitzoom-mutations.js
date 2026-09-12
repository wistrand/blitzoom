// blitzoom-mutations.js — Incremental graph mutation functions.
// Standalone functions that operate on a BlitZoomCanvas instance (view).
// Extracted from blitzoom-canvas.js to keep the component focused on rendering.

import { ZOOM_LEVELS, RAW_LEVEL, getNodePropValue, PROJECTION_SEED_BASE, projectionSeedForGroup, MINHASH_K, buildGaussianProjection } from './blitzoom-algo.js';
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
export function cancelAnimation(view) {
  if (view._animRaf) {
    cancelAnimationFrame(view._animRaf);
    view._animRaf = null;
    if (view._animCleanup) { view._animCleanup(); view._animCleanup = null; }
  }
}

/**
 * Run `fn` after every mutation already scheduled on this view has settled,
 * so addNodes/removeNodes/updateNodes never interleave. The chain starts from
 * `view.ready` (the factory's init blend + auto-tune). A failed init or a
 * failed mutation doesn't stall later ones. Returns fn's promise.
 */
function enqueueMutation(view, fn) {
  const tail = view._mutationTail || Promise.resolve(view.ready).catch(() => {});
  // A destroyed view drops anything still queued — its canvas is gone.
  const run = tail.then(() => (view._destroyed ? undefined : fn()));
  view._mutationTail = run.catch(() => {});
  return run;
}

/** Groups whose tokens derive from degree and neighbor groups. */
const TOPOLOGY_GROUPS = ['structure', 'neighbors'];

/** Grow view.projBuf to hold at least `rows` rows (amortized doubling). */
function ensureProjCapacity(view, rows) {
  const S = view.groupNames.length * 2;
  if (view.projBuf.length >= rows * S) return;
  const next = new Float64Array(Math.max(rows, view._projRows * 2, 64) * S);
  next.set(view.projBuf.subarray(0, view._projRows * S));
  view.projBuf = next;
}

/**
 * Close the row gaps left by removed nodes: surviving node i moves to row i.
 * In-place forward copy is safe because rows are ascending in view.nodes
 * order (every node's projIdx >= its index).
 */
function compactProjections(view) {
  const S = view.groupNames.length * 2;
  const buf = view.projBuf;
  const nodes = view.nodes;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.projIdx !== i) {
      buf.copyWithin(i * S, n.projIdx * S, n.projIdx * S + S);
      n.projIdx = i;
    }
  }
  view._projRows = nodes.length;
}

/** Full projection of one node into its row. */
function projectIntoRow(view, node) {
  projectNode(
    node, neighborGroupsOf(view, node.id), view.groupProjections, view.groupNames,
    view.hasEdgeTypes, view._extraPropNames, view._numericBins,
    view.projBuf, node.projIdx * view.groupNames.length * 2
  );
}

/** Groups of a node's current neighbors, in adjList order (projectNode input). */
function neighborGroupsOf(view, id) {
  return (view.adjList[id] || []).map(nid => view.nodeIndexFull[nid]?.group || 'unknown');
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

/** Animate transition: lerp existing items, fade in new items.
 *  No-op (snap to final positions) where requestAnimationFrame doesn't exist,
 *  so mutations work headless (Deno/Node SVG export, tests). */
export function animateTransition(view, prevPositions, durationMs = 400) {
  if (typeof requestAnimationFrame === 'undefined') return Promise.resolve();
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
  // id/group/label fields): the union across the batch, in first-seen order —
  // same strategy as createBlitZoomFromGraph.
  const newExtras = [];
  const seen = new Set();
  for (const rn of newNodes) {
    for (const k in rn) {
      if (k === 'id' || k === 'group' || k === 'label' || k === 'color') continue;
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
    view.groupProjections[ep] = buildGaussianProjection(projectionSeedForGroup(idx, ep, view.projSeeds), MINHASH_K);
    if (view.propStrengths[ep] === undefined) view.propStrengths[ep] = 0;
    if (!view.propColors[ep]) view.propColors[ep] = {};
  }
  view._extraPropNames = newExtras;

  // Compute numeric bins from the bootstrap batch. computeNumericBins expects
  // node-shaped objects with `extraProps` — wrap raw input nodes accordingly.
  const wrapped = newNodes.map(rn => {
    const extraProps = {};
    for (const k in rn) {
      if (k === 'id' || k === 'group' || k === 'label' || k === 'color') continue;
      extraProps[k] = rn[k];
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
export function addNodes(view, newNodes, newEdges = [], opts = {}) {
  // Coalesce with an addNodes call that is queued but not started yet: one
  // blend for both, and every merged caller resolves when the batch lands.
  // removeNodes/updateNodes clear _pendingAdd, so adds never jump ahead of them.
  const pending = view._pendingAdd;
  if (pending) {
    for (const n of newNodes) pending.nodes.push(n);
    for (const e of newEdges) pending.edges.push(e);
    return pending.promise;
  }
  const batch = { nodes: [...newNodes], edges: [...newEdges], opts, promise: null };
  view._pendingAdd = batch;
  batch.promise = enqueueMutation(view, () => {
    if (view._pendingAdd === batch) view._pendingAdd = null;
    return applyAddNodes(view, batch.nodes, batch.edges, batch.opts);
  });
  return batch.promise;
}

async function applyAddNodes(view, newNodes, newEdges, opts) {
  cancelAnimation(view);
  const animate = opts.animate !== false;
  // Snapshot before the new nodes exist: at the raw level they'd otherwise be
  // recorded at their initial (0, 0) and lerp in from there instead of fading in.
  const prevPositions = animate ? snapshotPositions(view) : null;

  // 0. First-build detection. An empty graph has _originalN === 0 (set by
  // the canvas constructor). The first addNodes call into such a graph IS
  // the original build, not an incremental insert — its nodes shouldn't
  // count toward the rebuild-threshold accounting. We capture this state
  // here and apply the right bookkeeping at step 7 below.
  //
  // Schema bootstrap is a separate concern: only needed when no extra
  // property groups have been established yet. Bootstrap derives the
  // schema from this batch's fields, extends groupNames, and builds
  // projection matrices for the new groups.
  const isFirstBuild = view._originalN === 0 && newNodes.length > 0;
  // Bootstrap only into a genuinely empty graph: it extends groupNames, which
  // changes the projection row stride, so existing rows would be reinterpreted.
  // (_originalN can still be 0 with nodes present if an earlier add threw
  // before its bookkeeping step.)
  if (isFirstBuild && view.nodes.length === 0 && view._extraPropNames.length === 0) {
    bootstrapEmptyGraph(view, newNodes);
  }

  // 1. Build node objects (projected in step 3, once their edges are in).
  // Each new node takes the next projection row.
  ensureProjCapacity(view, view._projRows + newNodes.length);
  const added = [];
  for (const rn of newNodes) {
    const id = rn.id;
    if (view.nodeIndexFull[id]) continue;
    const group = rn.group || 'unknown';
    const label = rn.label || id;
    const extraProps = {};
    for (const k in rn) {
      if (k === 'id' || k === 'group' || k === 'label' || k === 'color') continue;
      extraProps[k] = rn[k];
    }
    const node = { id, group, label, degree: 0, edgeTypes: view.hasEdgeTypes ? [] : null, extraProps,
                   projIdx: view._projRows++, px: 0, py: 0, gx: 0, gy: 0, x: 0, y: 0 };
    if (rn.color !== undefined) node.color = rn.color;

    view.nodes.push(node);
    view.nodeIndexFull[id] = node;
    view.adjList[id] = [];
    added.push(node);
  }

  // 2. Add edges. Pre-existing endpoints change degree and neighbor set (and
  // edge types, when the graph has an edgetype group and the edge carries
  // `type`, the same field the object pipeline reads), so their topology
  // groups are re-projected in step 3.
  const addedSet = new Set(added);
  const touched = new Set();
  for (const e of newEdges) {
    const src = view.nodeIndexFull[e.src], dst = view.nodeIndexFull[e.dst];
    if (!src || !dst) continue;
    view.edges.push(e);
    src.degree++;
    dst.degree++;
    if (view.hasEdgeTypes && e.type != null) {
      if (!src.edgeTypes) src.edgeTypes = [];
      if (!src.edgeTypes.includes(e.type)) src.edgeTypes.push(e.type);
      if (dst !== src) {
        if (!dst.edgeTypes) dst.edgeTypes = [];
        if (!dst.edgeTypes.includes(e.type)) dst.edgeTypes.push(e.type);
      }
    }
    view.adjList[e.src].push(e.dst);
    view.adjList[e.dst].push(e.src);
    if (src.degree > view.maxDegree) view.maxDegree = src.degree;
    if (dst.degree > view.maxDegree) view.maxDegree = dst.degree;
    if (!addedSet.has(src)) touched.add(src);
    if (!addedSet.has(dst)) touched.add(dst);
  }

  if (added.length === 0 && newEdges.length === 0) return;
  view._topoGen++;

  // 3. Project new nodes with their final degree and neighbor groups, then
  // refresh topology groups on touched existing nodes. Results match what
  // fullRebuild would compute for those groups; nodes whose degree bucket
  // and neighbor-group set are unchanged get identical projections.
  for (const node of added) projectIntoRow(view, node);
  reprojectGroups(view, view.hasEdgeTypes ? [...TOPOLOGY_GROUPS, 'edgetype'] : TOPOLOGY_GROUPS, touched);

  // 4. Extend color maps (touched nodes can have a new degree value)
  extendColorMaps(view, touched.size > 0 ? [...added, ...touched] : added);

  // 5. Blend + animate (snapshot taken at the top)
  await blendAndAnimate(view, prevPositions, animate && added.length > 0, opts.animMs || 400);

  // 6. Dispatch event
  view.canvas.dispatchEvent(new CustomEvent('nodesadded', {
    detail: { count: added.length, edgesAdded: newEdges.length, total: view.nodes.length },
  }));

  // 7. Account for added nodes. If this was the first build into a
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
      await fullRebuild(view, animate);
    }
  }
}

/**
 * Remove nodes (and their edges) incrementally.
 * @param {BlitZoomCanvas} view
 * @param {string[]} ids - node IDs to remove
 * @param {object} [opts] - { animate: true, animMs: 400 }
 */
export function removeNodes(view, ids, opts = {}) {
  view._pendingAdd = null; // later adds queue behind this removal
  return enqueueMutation(view, () => applyRemoveNodes(view, ids, opts));
}

async function applyRemoveNodes(view, ids, opts) {
  cancelAnimation(view);
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

  // Update adjList. Surviving neighbors lose degree and possibly a neighbor
  // group, so their topology groups are re-projected below.
  const touched = new Set();
  for (const id of removeSet) {
    const neighbors = view.adjList[id] || [];
    for (const nid of neighbors) {
      if (view.adjList[nid]) {
        view.adjList[nid] = view.adjList[nid].filter(x => x !== id);
      }
      if (!removeSet.has(nid) && view.nodeIndexFull[nid]) touched.add(view.nodeIndexFull[nid]);
    }
    delete view.adjList[id];
    delete view.nodeIndexFull[id];
  }

  view.nodes = view.nodes.filter(n => !removeSet.has(n.id));
  view._topoGen++;
  compactProjections(view);
  // Edge types are not re-derived here: edges from the initial load don't
  // carry their type (buildGraph keeps only per-node type sets), so a
  // surviving neighbor keeps its full type set.
  reprojectGroups(view, TOPOLOGY_GROUPS, touched);
  if (touched.size > 0) extendColorMaps(view, touched); // new degree / neighbor-count values

  // Recompute maxDegree
  view.maxDegree = 1;
  for (const n of view.nodes) {
    if (n.degree > view.maxDegree) view.maxDegree = n.degree;
  }

  await blendAndAnimate(view, prevPositions, animate, opts.animMs || 400);

  view.canvas.dispatchEvent(new CustomEvent('nodesremoved', {
    detail: { count: removedCount, total: view.nodes.length },
  }));
}

/**
 * Update existing nodes' properties and re-project only the changed nodes.
 * @param {BlitZoomCanvas} view
 * @param {Array} updates - [{id, group?, label?, ...extraProps}]
 * @param {object} [opts] - { animate: true, animMs: 400 }
 */
export function updateNodes(view, updates, opts = {}) {
  view._pendingAdd = null; // later adds queue behind this update
  return enqueueMutation(view, () => applyUpdateNodes(view, updates, opts));
}

async function applyUpdateNodes(view, updates, opts) {
  cancelAnimation(view);
  const animate = opts.animate !== false;
  let changed = 0;
  // Neighbors of nodes whose group changed carry that group in their
  // `neighbors` tokens; re-projected after all updates are applied.
  const touched = new Set();

  for (const u of updates) {
    const node = view.nodeIndexFull[u.id];
    if (!node) continue;

    if (u.group !== undefined && u.group !== node.group) {
      for (const nid of view.adjList[u.id] || []) {
        const nb = view.nodeIndexFull[nid];
        if (nb) touched.add(nb);
      }
    }
    if (u.group !== undefined) node.group = u.group;
    if (u.label !== undefined) node.label = u.label;
    if (u.color !== undefined) node.color = u.color;
    if (!node.extraProps) node.extraProps = {};
    for (const k in u) {
      if (k === 'id' || k === 'group' || k === 'label' || k === 'color') continue;
      node.extraProps[k] = u[k];
    }

    projectIntoRow(view, node);
    changed++;
  }

  if (changed === 0) return;
  reprojectGroups(view, ['neighbors'], touched);

  // Extend color maps for updated nodes
  const updatedNodes = updates.map(u => view.nodeIndexFull[u.id]).filter(Boolean);
  extendColorMaps(view, updatedNodes);

  const prevPositions = animate ? snapshotPositions(view) : null;
  await blendAndAnimate(view, prevPositions, animate, opts.animMs || 400);

  view.canvas.dispatchEvent(new CustomEvent('nodesupdated', {
    detail: { count: changed, total: view.nodes.length },
  }));
}

/**
 * Full projection rebuild — recomputes numeric bins, adjGroups, and all projections.
 * @param {BlitZoomCanvas} view
 * @param {boolean} [animate=true] - false to snap (a streaming loop that passes
 *   `{animate: false}` shouldn't get an animated transition from the periodic rebuild)
 */
export async function fullRebuild(view, animate = true) {
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
    view.nodes, adjGroups, view.groupNames, view.hasEdgeTypes, view._extraPropNames, numericBins, view.projSeeds
  );

  view.projBuf = projBuf;
  for (let i = 0; i < N; i++) view.nodes[i].projIdx = i;
  view._projRows = N;

  view._numericBins = numericBins;
  view._insertsSinceRebuild = 0;
  view._originalN = N;

  await blendAndAnimate(view, prevPositions, animate, 500);

  view._progressText = null;
  console.log(`[BlitZoomCanvas] Full rebuild: ${N} nodes, ${view._extraPropNames.length} extra props`);
}

/**
 * Re-project only the given groups, using the view's current groupProjections
 * matrices. Other groups' projections are untouched, so with quantMode 'norm'
 * unaffected coordinates stay identical. Used after a per-group seed change
 * (bulkSetProjSeeds, all nodes) and by mutations to refresh topology groups
 * on nodes whose degree or neighbors changed (subset via `nodes`).
 * Synchronous; cost is one single-group MinHash + projection per node per
 * group. Does not blend — callers trigger the blend + layout + render chain.
 * @param {Iterable<object>} [nodes=view.nodes]
 */
export function reprojectGroups(view, groups, nodes = view.nodes) {
  const only = new Set(groups);
  if (only.size === 0) return;
  const S = view.groupNames.length * 2;
  for (const n of nodes) {
    projectNode(
      n, neighborGroupsOf(view, n.id), view.groupProjections, view.groupNames,
      view.hasEdgeTypes, view._extraPropNames, view._numericBins,
      view.projBuf, n.projIdx * S, only
    );
  }
}
