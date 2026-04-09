// blitzoom-factory.js — Factory functions for creating BlitZoomCanvas instances.
// Extracted from blitzoom-canvas.js to separate construction logic from the component.

import { BlitZoomCanvas } from './blitzoom-canvas.js';
import { MINHASH_K, ZOOM_LEVELS, buildGaussianProjection } from './blitzoom-algo.js';
import { generateGroupColors } from './blitzoom-colors.js';
import { autoTuneStrengths } from './blitzoom-utils.js';
import { runPipeline, computeProjections, computeNumericBins, computeAdjGroups } from './blitzoom-pipeline.js';
import { initGPU } from './blitzoom-gpu.js';

// ─── Shared tail: strengths, colors, blend, construct view ──────────────────

function _finalize(canvas, nodes, edges, nodeIndexFull, adjList, groupNames, hasEdgeTypes, opts) {
  // Default strengths: group=3 if it has >1 distinct value, label=1, rest=0.
  // If group is single-valued (e.g. CSV without a "group" column → all "unknown"),
  // find the first categorical extra prop with 2-50 distinct values instead.
  const propStrengths = {};
  for (const g of groupNames) propStrengths[g] = 0;
  const groupVals = new Set();
  for (const n of nodes) { groupVals.add(n.group); if (groupVals.size > 1) break; }
  if (groupVals.size > 1) {
    propStrengths['group'] = 3;
  } else {
    // Find first useful categorical property
    for (const g of groupNames) {
      if (g === 'group' || g === 'label' || g === 'structure' || g === 'neighbors') continue;
      const vals = new Set();
      for (const n of nodes) {
        vals.add(n.extraProps && n.extraProps[g]);
        if (vals.size > 50) break;
      }
      if (vals.size >= 2 && vals.size <= 50) { propStrengths[g] = 3; break; }
    }
  }
  if (groupNames.includes('label')) propStrengths['label'] = 1;
  Object.assign(propStrengths, opts.strengths || opts.weights || {});

  const propColors = {};
  const propValues = {};
  for (const g of groupNames) propValues[g] = new Set();
  for (const n of nodes) {
    propValues['group'].add(n.group || 'unknown');
    propValues['label'].add(n.label || n.id);
    propValues['structure'].add(`deg:${n.degree}`);
    propValues['neighbors'].add('_');
    if (n.edgeTypes) {
      const types = Array.isArray(n.edgeTypes) ? n.edgeTypes : [...n.edgeTypes];
      for (const t of types) if (propValues['edgetype']) propValues['edgetype'].add(t);
    }
    if (n.extraProps) {
      for (const [k, v] of Object.entries(n.extraProps)) {
        if (propValues[k]) propValues[k].add(v == null ? 'unknown' : String(v));
      }
    }
  }
  for (const g of groupNames) {
    propColors[g] = generateGroupColors([...propValues[g]].sort(), opts.colorScheme || 0);
  }

  let smoothAlpha = opts.smoothAlpha || 0;
  let quantMode = opts.quantMode;

  const view = new BlitZoomCanvas(canvas, {
    nodes, edges, nodeIndexFull, adjList,
    groupNames, propStrengths, propColors,
    groupColors: propColors['group'],
    hasEdgeTypes,
    smoothAlpha,
    quantMode,
    ...opts,
  });

  // Async init: probe GPU → blend → (optional auto-tune) → render.
  // Factory returns immediately; view renders once blend completes.
  const wantGPU = opts.useGPU || (opts.autoGPU !== false && nodes.length * groupNames.length > 2000);
  (async () => {
    // Probe GPU (fast no-op if unavailable or not wanted)
    if (wantGPU) {
      const ok = await initGPU().catch(() => false);
      if (ok) {
        view.useGPU = true;
        console.log(`[GPU] GPU enabled (${nodes.length} nodes, ${groupNames.length} groups)`);
      }
    }

    if (opts.autoTune) {
      // Auto-tune: scan presets + refine, then blend with best params
      view.showProgress('Auto-tuning...');
      const tuneOpts = { ...opts.autoTune };
      tuneOpts.onProgress = (info) => {
        const pct = Math.round(100 * info.step / Math.max(1, info.total));
        const phase = info.phase === 'presets' ? 'scanning presets'
          : info.phase === 'done' ? 'done' : 'refining';
        view.showProgress(`Auto-tuning: ${phase} (${pct}%)`);
      };
      const result = await autoTuneStrengths(view.nodes, view.groupNames, view.adjList, view.nodeIndexFull, tuneOpts);
      if ((tuneOpts.strengths ?? tuneOpts.weights) !== false && !opts.strengths && !opts.weights) {
        for (const g of view.groupNames) view.propStrengths[g] = result.strengths[g] ?? 0;
      }
      if (tuneOpts.alpha !== false && opts.smoothAlpha == null) view.smoothAlpha = result.alpha;
      if (tuneOpts.quant !== false && !opts.quantMode) view.quantMode = result.quantMode;
      if (result.labelProps && !opts.labelProps) {
        view.labelProps = new Set(result.labelProps.filter(p => view.groupNames.includes(p)));
      }
      view._quantStats = {};
    }

    // Blend (GPU if enabled and large enough, else CPU)
    view.levels = new Array(ZOOM_LEVELS.length).fill(null);
    await view._blend();
    view._progressText = null;
    view._refreshPropCache();
    view.layoutAll();
    view.render();
    canvas.setAttribute('aria-label', `Graph visualization, ${nodes.length} nodes, ${edges.length} edges`);
    view.announce(`Graph loaded, ${nodes.length} nodes, ${edges.length} edges. ${view._describeLevel()}`);
  })();

  return view;
}

// ─── Hydrate nodes from projBuf + build adjList ─────────────────────────────

export function hydrateAndLink(nodeArray, projBuf, groupNames, edges) {
  const G = groupNames.length;
  const nodes = nodeArray.map((n, i) => {
    const projections = {};
    for (let g = 0; g < G; g++) {
      const off = (i * G + g) * 2;
      projections[groupNames[g]] = [projBuf[off], projBuf[off + 1]];
    }
    return { ...n, projections, px: 0, py: 0, gx: 0, gy: 0, x: 0, y: 0 };
  });
  const nodeIndexFull = Object.fromEntries(nodes.map(n => [n.id, n]));
  const adjList = Object.fromEntries(nodes.map(n => [n.id, []]));
  for (const e of edges) {
    if (adjList[e.src] && adjList[e.dst]) {
      adjList[e.src].push(e.dst);
      adjList[e.dst].push(e.src);
    }
  }
  return { nodes, nodeIndexFull, adjList };
}

// ─── Public factories ───────────────────────────────────────────────────────

/**
 * Create a BlitZoomCanvas from SNAP .edges/.nodes text.
 * @param {HTMLCanvasElement} canvas
 * @param {string} edgesText
 * @param {string|null} nodesText
 * @param {object} [opts] - additional BlitZoomCanvas options
 * @returns {BlitZoomCanvas}
 */
export function createBlitZoomView(canvas, edgesText, nodesText, opts = {}) {
  const result = runPipeline(edgesText, nodesText);
  const { nodes, nodeIndexFull, adjList } = hydrateAndLink(result.nodeArray, result.projBuf, result.groupNames, result.edges);
  return _finalize(canvas, nodes, result.edges, nodeIndexFull, adjList, result.groupNames, result.hasEdgeTypes, {
    _numericBins: result.numericBins, _extraPropNames: result.extraPropNames, ...opts,
  });
}

/**
 * Create a BlitZoomCanvas from JS graph objects (no SNAP parsing).
 * Nodes: {id, group?, label?, ...extraProps}. Edges: {src, dst}.
 * @param {HTMLCanvasElement} canvas
 * @param {Array} rawNodes
 * @param {Array} rawEdges
 * @param {object} [opts] - additional BlitZoomCanvas options
 * @returns {BlitZoomCanvas}
 */
export function createBlitZoomFromGraph(canvas, rawNodes, rawEdges, opts = {}) {
  const nodeIndex = {};
  const tempAdj = {};
  const nodeArray = rawNodes.map(rn => {
    const id = rn.id;
    const group = rn.group || 'unknown';
    const label = rn.label || id;
    const extraProps = {};
    for (const k in rn) {
      if (k !== 'id' && k !== 'group' && k !== 'label') extraProps[k] = rn[k];
    }
    const node = { id, group, label, degree: 0, edgeTypes: null, extraProps };
    nodeIndex[id] = node;
    tempAdj[id] = [];
    return node;
  });

  const edges = [];
  for (const e of rawEdges) {
    if (nodeIndex[e.src] && nodeIndex[e.dst]) {
      edges.push(e);
      nodeIndex[e.src].degree++;
      nodeIndex[e.dst].degree++;
      tempAdj[e.src].push(e.dst);
      tempAdj[e.dst].push(e.src);
    }
  }

  const extraPropNames = [];
  if (nodeArray.length > 0) {
    for (const k of Object.keys(nodeArray[0].extraProps)) extraPropNames.push(k);
  }
  const groupNames = ['group', 'label', 'structure', 'neighbors'];
  for (const ep of extraPropNames) groupNames.push(ep);

  const adjGroups = computeAdjGroups(nodeArray, tempAdj, nodeIndex);
  const numericBins = computeNumericBins(nodeArray, extraPropNames);

  const { projBuf } = computeProjections(nodeArray, adjGroups, groupNames, false, extraPropNames, numericBins);
  const { nodes, nodeIndexFull, adjList } = hydrateAndLink(nodeArray, projBuf, groupNames, edges);
  return _finalize(canvas, nodes, edges, nodeIndexFull, adjList, groupNames, false, {
    _numericBins: numericBins, _extraPropNames: extraPropNames, ...opts,
  });
}
