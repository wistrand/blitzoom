// blitzoom-pipeline.js — Shared parsing, graph building, and tokenization/projection.
// No DOM, no Worker API. Usable from Web Workers, Deno, or browser.

import { MINHASH_K, buildGaussianProjection, computeMinHash, computeMinHashInto, _sig, projectInto } from './blitzoom-algo.js';

// ─── SNAP file parsers ───────────────────────────────────────────────────────

export function parseEdgesFile(text) {
  const edgeFrom = [];
  const edgeTo = [];
  const nodeIds = new Set();
  const edgeTypeMap = new Map();
  let hasThirdCol = false;

  if (!text) return { edgeFrom, edgeTo, edgeCount: 0, edgeTypeMap: null, nodeIds };

  let pos = 0;
  const len = text.length;
  while (pos < len) {
    let eol = text.indexOf('\n', pos);
    if (eol === -1) eol = len;
    let start = pos;
    while (start < eol && (text.charCodeAt(start) === 32 || text.charCodeAt(start) === 9 || text.charCodeAt(start) === 13)) start++;
    pos = eol + 1;
    if (start >= eol || text.charCodeAt(start) === 35) continue;

    const tab1 = text.indexOf('\t', start);
    if (tab1 < 0 || tab1 >= eol) continue;
    const from = text.slice(start, tab1);

    let tab2 = text.indexOf('\t', tab1 + 1);
    let lineEnd = eol;
    if (lineEnd > 0 && text.charCodeAt(lineEnd - 1) === 13) lineEnd--;
    const to = tab2 >= 0 && tab2 < eol ? text.slice(tab1 + 1, tab2) : text.slice(tab1 + 1, lineEnd);

    nodeIds.add(from);
    nodeIds.add(to);
    edgeFrom.push(from);
    edgeTo.push(to);

    if (tab2 >= 0 && tab2 < eol) {
      const etype = text.slice(tab2 + 1, lineEnd);
      if (etype) {
        hasThirdCol = true;
        if (!edgeTypeMap.has(from)) edgeTypeMap.set(from, new Set());
        if (!edgeTypeMap.has(to)) edgeTypeMap.set(to, new Set());
        edgeTypeMap.get(from).add(etype);
        edgeTypeMap.get(to).add(etype);
      }
    }
  }
  return { edgeFrom, edgeTo, edgeCount: edgeFrom.length, edgeTypeMap: hasThirdCol ? edgeTypeMap : null, nodeIds };
}

export function parseNodesFile(text) {
  const nodes = new Map();
  const extraPropNames = [];
  const lines = text.split('\n');

  let dataStart = 0;
  if (lines.length > 0 && lines[0].trim().startsWith('#')) {
    const headerParts = lines[0].trim().replace(/^#\s*/, '').split('\t');
    for (let i = 3; i < headerParts.length; i++) {
      extraPropNames.push(headerParts[i].trim().toLowerCase().replace(/\s+/g, '_'));
    }
    dataStart = 1;
  }

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].replace(/[\r\n]+$/, '');
    if (!line || line[0] === '#') continue;
    const parts = line.split('\t');
    if (parts.length < 2) continue;

    const entry = {
      label: parts[1] || parts[0],
      group: parts.length >= 3 ? parts[2] : 'unknown',
      extraProps: {},
    };

    for (let j = 3; j < parts.length; j++) {
      const name = (j - 3) < extraPropNames.length ? extraPropNames[j - 3] : `prop${j+1}`;
      entry.extraProps[name] = parts[j];
    }

    nodes.set(parts[0], entry);
  }

  if (extraPropNames.length === 0) {
    for (const entry of nodes.values()) {
      for (const k of Object.keys(entry.extraProps)) {
        if (!extraPropNames.includes(k)) extraPropNames.push(k);
      }
      break;
    }
  }

  return { nodes, extraPropNames };
}

// ─── Graph building ──────────────────────────────────────────────────────────

export function buildGraph(parsed, nodesMap, extraPropNames) {
  const nodeArray = [];
  const nodeIndex = {};
  // Union of ids from edges and from nodes metadata — either source may be empty.
  // Edge-only graphs take ids from parsed.nodeIds. Nodes-only graphs take them from nodesMap.
  // Mixed inputs get both (nodes with metadata but no edges are no longer silently dropped).
  const allIds = new Set(parsed.nodeIds);
  if (nodesMap) for (const id of nodesMap.keys()) allIds.add(id);
  for (const id of allIds) {
    const info = nodesMap ? nodesMap.get(id) : null;
    const group = info ? info.group : 'unknown';
    const label = info ? info.label : id;
    const edgeTypes = parsed.edgeTypeMap
      ? (parsed.edgeTypeMap.has(id) ? [...parsed.edgeTypeMap.get(id)] : [])
      : null;
    const extraProps = info ? (info.extraProps || {}) : {};
    const node = { id, group, label, degree: 0, edgeTypes, extraProps };
    nodeIndex[id] = node;
    nodeArray.push(node);
  }

  const edges = [];
  const adjList = {};
  for (let i = 0; i < nodeArray.length; i++) adjList[nodeArray[i].id] = [];

  for (let i = 0; i < parsed.edgeCount; i++) {
    const from = parsed.edgeFrom[i], to = parsed.edgeTo[i];
    if (nodeIndex[from] && nodeIndex[to]) {
      edges.push({ src: from, dst: to });
      nodeIndex[from].degree++;
      nodeIndex[to].degree++;
      adjList[from].push(to);
      adjList[to].push(from);
    }
  }

  // Determine property group names
  const groupNames = ['group', 'label', 'structure', 'neighbors'];
  for (const ep of extraPropNames) groupNames.push(ep);
  const hasEdgeTypes = !!parsed.edgeTypeMap;
  if (hasEdgeTypes) groupNames.push('edgetype');

  // Pre-compute neighbor groups
  const adjGroups = new Array(nodeArray.length);
  for (let i = 0; i < nodeArray.length; i++) {
    const nbrIds = adjList[nodeArray[i].id];
    const groups = new Array(nbrIds.length);
    for (let j = 0; j < nbrIds.length; j++) groups[j] = nodeIndex[nbrIds[j]].group;
    adjGroups[i] = groups;
  }

  // Collect unique groups
  const groupSet = new Set();
  for (let i = 0; i < nodeArray.length; i++) groupSet.add(nodeArray[i].group);
  const uniqueGroups = [...groupSet].sort();

  const numericBins = computeNumericBins(nodeArray, extraPropNames);

  return { nodeArray, nodeIndex, edges, adjList, adjGroups, groupNames, uniqueGroups, hasEdgeTypes, numericBins };
}

/**
 * Detect numeric extra property columns and compute bin boundaries.
 * A column is numeric if >80% of non-empty values parse as finite numbers.
 * @param {Array} nodeArray - node objects with .extraProps
 * @param {string[]} extraPropNames
 * @returns {object} { propName: { min, max, coarse, medium, fine } }
 */
export function computeNumericBins(nodeArray, extraPropNames) {
  const numericBins = {};
  for (const ep of extraPropNames) {
    let numCount = 0, total = 0;
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < nodeArray.length; i++) {
      const v = nodeArray[i].extraProps && nodeArray[i].extraProps[ep];
      if (!v || v === 'unknown') continue;
      total++;
      const num = Number(v);
      if (isFinite(num)) {
        numCount++;
        if (num < min) min = num;
        if (num > max) max = num;
      }
    }
    if (total > 0 && numCount / total >= 0.8 && max > min) {
      numericBins[ep] = { min, max, coarse: 5, medium: 50, fine: 500 };
    }
  }
  return numericBins;
}

/**
 * Compute per-node neighbor group arrays from an adjacency list and node index.
 * @param {Array} nodeArray - node objects with .id and .group
 * @param {object} adjList - { id: [neighborIds] }
 * @param {object} nodeIndex - { id: node }
 * @returns {Array} adjGroups[i] = [group values of node i's neighbors]
 */
export function computeAdjGroups(nodeArray, adjList, nodeIndex) {
  const adjGroups = new Array(nodeArray.length);
  for (let i = 0; i < nodeArray.length; i++) {
    const nbrIds = adjList[nodeArray[i].id] || [];
    adjGroups[i] = nbrIds.map(nid => (nodeIndex[nid]?.group) || 'unknown');
  }
  return adjGroups;
}

// ─── Tokenization helpers ────────────────────────────────────────────────────

export function degreeBucket(d) {
  if (d === 0) return '0';
  if (d === 1) return '1';
  if (d <= 3) return '2-3';
  if (d <= 7) return '4-7';
  if (d <= 15) return '8-15';
  if (d <= 31) return '16-31';
  return '32+';
}

// Tokenize a label string into words, inline (no intermediate arrays)
// Writes into tokenBuf starting at offset, returns new offset
export function tokenizeLabel(label, id, tokenBuf, offset) {
  const lbl = label.toLowerCase();
  let wordStart = -1;
  let count = 0;
  for (let ci = 0; ci <= lbl.length; ci++) {
    const ch = ci < lbl.length ? lbl.charCodeAt(ci) : 0;
    const isAlnum = (ch >= 48 && ch <= 57) || (ch >= 97 && ch <= 122);
    if (isAlnum) {
      if (wordStart < 0) wordStart = ci;
    } else {
      if (wordStart >= 0 && ci - wordStart > 1) {
        tokenBuf[offset + count] = 'label:' + lbl.slice(wordStart, ci);
        count++;
      }
      wordStart = -1;
    }
  }
  if (count === 0) { tokenBuf[offset] = 'label:' + id; count = 1; }
  return offset + count;
}

// Emit multi-resolution tokens for a numeric value.
// Writes 3 tokens into tokenBuf at offset, returns new offset.
// Empty/undefined values emit 0 tokens (returns offset unchanged).
// Non-numeric strings emit 1 categorical token.
export function tokenizeNumeric(propName, value, bins, tokenBuf, offset) {
  // Undefined: empty string or missing — emit nothing
  if (!value || value === '') return offset;

  const num = Number(value);
  if (!isFinite(num) || !bins) {
    tokenBuf[offset] = propName + ':' + value;
    return offset + 1;
  }
  const range = bins.max - bins.min;
  const levels = [
    { prefix: 'c', count: bins.coarse },
    { prefix: 'm', count: bins.medium },
    { prefix: 'f', count: bins.fine },
  ];
  for (const lv of levels) {
    const bucketSize = range / lv.count;
    const bucket = Math.min(lv.count - 1, Math.floor((num - bins.min) / bucketSize));
    const lo = bins.min + bucket * bucketSize;
    const hi = lo + bucketSize;
    tokenBuf[offset++] = propName + ':' + lv.prefix + ':' + lo.toPrecision(3) + '-' + hi.toPrecision(3);
  }
  return offset;
}

// ─── Full projection pipeline (single-threaded) ─────────────────────────────
// Computes all MinHash projections for all nodes. GC-optimized: uses
// computeMinHashInto/_sig/projectInto to avoid per-node allocations.

// Module-level shared token buffer for projection (non-reentrant, same as _sig).
const _tokenBuf = new Array(200);

/**
 * Project a single node's properties into 2D per-group coordinates.
 * Returns { groupName: [px, py], ... }. Optionally writes into a flat projBuf.
 * Uses module-level _tokenBuf and _sig — not reentrant (safe because pipeline is sequential).
 *
 * @param {object} node - { group, label, id, degree, edgeTypes, extraProps }
 * @param {string[]} neighborGroups - group values of this node's neighbors (e.g. ['analyst', 'admin'])
 * @param {object} groupProjections - { groupName: R_matrix } (from buildGaussianProjection)
 * @param {string[]} groupNames - ordered group names
 * @param {boolean} hasEdgeTypes
 * @param {string[]} extraPropNames
 * @param {object} numericBins - { propName: { min, max, coarse, medium, fine } }
 * @param {Float64Array} [projBuf] - optional output buffer
 * @param {number} [baseOff=0] - offset into projBuf
 * @returns {object} projections - { groupName: [px, py], ... }
 */
export function projectNode(node, neighborGroups, groupProjections, groupNames, hasEdgeTypes, extraPropNames, numericBins, projBuf, baseOff) {
  const G = groupNames.length;
  const gIdx = {};
  for (let i = 0; i < G; i++) gIdx[groupNames[i]] = i;

  // Temp buffer for reading back projections
  const tmpBuf = projBuf || new Float64Array(G * 2);
  const off = projBuf ? baseOff : 0;

  // group
  _tokenBuf[0] = 'group:' + node.group;
  computeMinHashInto(_tokenBuf, 1);
  projectInto(_sig, groupProjections.group, tmpBuf, off + gIdx.group * 2);

  // label
  const labelEnd = tokenizeLabel(node.label, node.id, _tokenBuf, 0);
  computeMinHashInto(_tokenBuf, labelEnd);
  projectInto(_sig, groupProjections.label, tmpBuf, off + gIdx.label * 2);

  // structure
  _tokenBuf[0] = 'deg:' + degreeBucket(node.degree);
  _tokenBuf[1] = 'leaf:' + (node.degree === 0);
  computeMinHashInto(_tokenBuf, 2);
  projectInto(_sig, groupProjections.structure, tmpBuf, off + gIdx.structure * 2);

  // neighbors
  let tc = 0;
  if (neighborGroups.length > 0) {
    for (let ai = 0; ai < neighborGroups.length; ai++) _tokenBuf[tc++] = 'ngroup:' + neighborGroups[ai];
  } else {
    _tokenBuf[0] = 'ngroup:isolated'; tc = 1;
  }
  computeMinHashInto(_tokenBuf, tc);
  projectInto(_sig, groupProjections.neighbors, tmpBuf, off + gIdx.neighbors * 2);

  // edge types
  if (hasEdgeTypes && gIdx.edgetype !== undefined) {
    tc = 0;
    if (node.edgeTypes && node.edgeTypes.length > 0) {
      for (let ei = 0; ei < node.edgeTypes.length; ei++) _tokenBuf[tc++] = 'etype:' + node.edgeTypes[ei];
    } else {
      _tokenBuf[0] = 'etype:none'; tc = 1;
    }
    computeMinHashInto(_tokenBuf, tc);
    projectInto(_sig, groupProjections.edgetype, tmpBuf, off + gIdx.edgetype * 2);
  }

  // extra props (with multi-resolution numeric tokenization)
  for (let epi = 0; epi < extraPropNames.length; epi++) {
    const ep = extraPropNames[epi];
    const val = node.extraProps && node.extraProps[ep];
    const epEnd = tokenizeNumeric(ep, val, numericBins[ep], _tokenBuf, 0);
    if (epEnd > 0) {
      computeMinHashInto(_tokenBuf, epEnd);
      projectInto(_sig, groupProjections[ep], tmpBuf, off + gIdx[ep] * 2);
    }
    // else: tmpBuf already initialized to 0,0
  }

  // Build projections object
  const projections = {};
  for (let g = 0; g < G; g++) {
    const o = off + g * 2;
    projections[groupNames[g]] = [tmpBuf[o], tmpBuf[o + 1]];
  }
  return projections;
}

export function computeProjections(nodeArray, adjGroups, groupNames, hasEdgeTypes, extraPropNames, numericBins) {
  numericBins = numericBins || {};
  const groupProjections = {};
  for (let i = 0; i < groupNames.length; i++) {
    groupProjections[groupNames[i]] = buildGaussianProjection(2001 + i, MINHASH_K);
  }

  const N = nodeArray.length;
  const G = groupNames.length;
  const projBuf = new Float64Array(N * G * 2);

  for (let idx = 0; idx < N; idx++) {
    projectNode(nodeArray[idx], adjGroups[idx], groupProjections, groupNames, hasEdgeTypes, extraPropNames, numericBins, projBuf, idx * G * 2);
  }

  return { projBuf, groupNames };
}

// ─── On-demand signature for a single node (detail panel visualization) ──────

export function computeNodeSig(node) {
  const tokenBuf = new Array(20);
  let tc = 0;
  tokenBuf[tc++] = 'group:' + node.group;
  tc = tokenizeLabel(node.label, node.id, tokenBuf, tc);
  tokenBuf[tc++] = 'deg:' + degreeBucket(node.degree);
  tokenBuf[tc++] = 'leaf:' + (node.degree === 0);
  return computeMinHash(tokenBuf, tc);
}

// ─── Full pipeline: parse → build → project ──────────────────────────────────

/**
 * @param {string|null} edgesText - SNAP .edges text, or null/empty for nodes-only graphs
 * @param {string|null} nodesText - SNAP .nodes text (required when edgesText is empty)
 */
export function runPipeline(edgesText, nodesText) {
  const parsed = parseEdgesFile(edgesText);
  const nodesResult = nodesText ? parseNodesFile(nodesText) : null;
  const nodesMap = nodesResult ? nodesResult.nodes : null;
  const extraPropNames = nodesResult ? nodesResult.extraPropNames : [];

  const graph = buildGraph(parsed, nodesMap, extraPropNames);
  const { projBuf } = computeProjections(
    graph.nodeArray, graph.adjGroups, graph.groupNames, graph.hasEdgeTypes, extraPropNames, graph.numericBins
  );

  return { ...graph, projBuf, extraPropNames };
}

/**
 * GPU-accelerated pipeline. Parses on CPU, projects on GPU.
 * @param {string|null} edgesText - SNAP .edges text, or null/empty for nodes-only graphs
 * @param {string|null} nodesText - SNAP .nodes text (required when edgesText is empty)
 * @param {function} computeProjectionsGPU - async GPU projection function from blitzoom-gpu.js
 * @returns {Promise<object>} same shape as runPipeline
 */
export async function runPipelineGPU(edgesText, nodesText, computeProjectionsGPU) {
  const parsed = parseEdgesFile(edgesText);
  const nodesResult = nodesText ? parseNodesFile(nodesText) : null;
  const nodesMap = nodesResult ? nodesResult.nodes : null;
  const extraPropNames = nodesResult ? nodesResult.extraPropNames : [];

  const graph = buildGraph(parsed, nodesMap, extraPropNames);
  const { projBuf } = await computeProjectionsGPU(
    graph.nodeArray, graph.adjGroups, graph.groupNames, graph.hasEdgeTypes, extraPropNames, graph.numericBins
  );

  return { ...graph, projBuf, extraPropNames };
}

// ─── Object-based pipeline (D3 JSON, JGF, etc.) ──────────────────────────────

/**
 * Build a parsed-edges structure from an array of edge objects.
 * Matches the shape returned by parseEdgesFile so buildGraph can consume either.
 * @param {Array<{src: string, dst: string, type?: string}>|null} edges
 */
function edgesToParsed(edges) {
  const edgeFrom = [];
  const edgeTo = [];
  const nodeIds = new Set();
  const edgeTypeMap = new Map();
  let hasEdgeTypes = false;

  if (edges) {
    for (const e of edges) {
      const src = String(e.src);
      const dst = String(e.dst);
      edgeFrom.push(src);
      edgeTo.push(dst);
      nodeIds.add(src);
      nodeIds.add(dst);
      if (e.type) {
        hasEdgeTypes = true;
        if (!edgeTypeMap.has(src)) edgeTypeMap.set(src, new Set());
        if (!edgeTypeMap.has(dst)) edgeTypeMap.set(dst, new Set());
        edgeTypeMap.get(src).add(e.type);
        edgeTypeMap.get(dst).add(e.type);
      }
    }
  }

  return {
    edgeFrom,
    edgeTo,
    edgeCount: edgeFrom.length,
    edgeTypeMap: hasEdgeTypes ? edgeTypeMap : null,
    nodeIds,
  };
}

/**
 * Run the full pipeline from already-parsed JavaScript objects instead of SNAP text.
 * Used by D3 JSON, JGF, and any other format that parses to a native object shape.
 *
 * @param {Map<string, {label: string, group: string, extraProps: object}>} nodesMap
 *        Node metadata keyed by id — same shape as parseNodesFile output.
 * @param {Array<{src: string, dst: string, type?: string}>|null} edges
 *        Edge list with stringified endpoints. null/empty for edgeless graphs.
 * @param {string[]} [extraPropNames=[]]
 *        Ordered list of extra property group names (same as parseNodesFile output).
 * @returns {object} same shape as runPipeline
 */
export function runPipelineFromObjects(nodesMap, edges, extraPropNames = []) {
  const parsed = edgesToParsed(edges);
  const graph = buildGraph(parsed, nodesMap, extraPropNames);
  const { projBuf } = computeProjections(
    graph.nodeArray, graph.adjGroups, graph.groupNames, graph.hasEdgeTypes, extraPropNames, graph.numericBins
  );
  return { ...graph, projBuf, extraPropNames };
}

/**
 * GPU variant of runPipelineFromObjects.
 * @param {function} computeProjectionsGPU - async GPU projection function from blitzoom-gpu.js
 */
export async function runPipelineFromObjectsGPU(nodesMap, edges, extraPropNames, computeProjectionsGPU) {
  const parsed = edgesToParsed(edges);
  const graph = buildGraph(parsed, nodesMap, extraPropNames || []);
  const { projBuf } = await computeProjectionsGPU(
    graph.nodeArray, graph.adjGroups, graph.groupNames, graph.hasEdgeTypes, extraPropNames || [], graph.numericBins
  );
  return { ...graph, projBuf, extraPropNames: extraPropNames || [] };
}
