// Incremental mutations: addNodes / removeNodes / updateNodes.
//
// The mutation functions take a view object and only ever touch graph state,
// projections and a handful of callbacks, so these tests drive them with a
// minimal stand-in view instead of a real BlitZoomCanvas (no DOM in Deno).
// `_blend` is a stub by default and the real `unifiedBlend` where a test needs
// grid coordinates. All mutations pass `{ animate: false }`.

import { assert, assertEquals, assertExists } from "https://deno.land/std/assert/mod.ts";

import { addNodes, removeNodes, updateNodes } from "../docs/blitzoom-mutations.js";
import {
  buildGaussianProjection, projectionSeedForGroup, MINHASH_K, ZOOM_LEVELS, RAW_LEVEL, unifiedBlend,
} from "../docs/blitzoom-algo.js";

const BUILTIN_GROUPS = ["group", "label", "structure", "neighbors"];
const SNAP = { animate: false };

function makeView(groupNames: string[] = BUILTIN_GROUPS) {
  const groupProjections: Record<string, any> = {};
  groupNames.forEach((g, i) => {
    groupProjections[g] = buildGaussianProjection(projectionSeedForGroup(i, g, null), MINHASH_K);
  });
  return {
    nodes: [] as any[], edges: [] as any[], nodeIndexFull: {} as Record<string, any>,
    adjList: {} as Record<string, string[]>,
    groupNames, groupProjections, hasEdgeTypes: false,
    _extraPropNames: [] as string[], _numericBins: {}, projBuf: new Float64Array(0), _projRows: 0,
    _topoGen: 0, _originalN: 0, _insertsSinceRebuild: 0, _rebuildThreshold: Infinity,
    propColors: Object.fromEntries(groupNames.map((g) => [g, {}])) as Record<string, any>,
    propStrengths: { group: 3, label: 1 } as Record<string, number>,
    groupColors: {}, _colorScheme: 0, maxDegree: 1, projSeeds: null,
    levels: new Array(ZOOM_LEVELS.length).fill(null), currentLevel: RAW_LEVEL, _quantStats: {},
    ready: Promise.resolve(), _mutationTail: null, _pendingAdd: null,
    blends: 0,
    canvas: { dispatchEvent() {} },
    async _blend() { this.blends++; },
    _refreshPropCache() {}, layoutAll() {}, render() {}, renderNow() {},
  };
}

/** Blend for real (norm quantization) so gx/gy are meaningful. */
function withRealBlend(view: any) {
  view._blend = async function () {
    this.blends++;
    unifiedBlend(this.nodes, this.projBuf, this.groupNames, this.propStrengths, 0,
      this.adjList, this.nodeIndexFull, 0, "norm", this._quantStats, null, this.projSeeds);
  };
  return view;
}

/** One node's row of the flat projection buffer. */
const row = (view: any, node: any) =>
  [...view.projBuf.slice(node.projIdx * view.groupNames.length * 2, (node.projIdx + 1) * view.groupNames.length * 2)];

/** Rows are dense and ascending in view.nodes order — compaction relies on it. */
const rowsAreDense = (view: any) =>
  view.nodes.every((n: any, i: number) => n.projIdx === i) && view._projRows === view.nodes.length;

const cellsOf = (view: any): Map<string, string> =>
  new Map(view.nodes.map((n: any): [string, string] => [n.id, `${n.gx}:${n.gy}`]));
const movedSince = (view: any, cells: Map<string, string>) =>
  view.nodes.filter((n: any) => cells.has(n.id) && cells.get(n.id) !== `${n.gx}:${n.gy}`).map((n: any) => n.id);

// ─── Basics ──────────────────────────────────────────────────────────────────

Deno.test("addNodes: registers nodes, edges, degrees and projection rows", async () => {
  const v = makeView();
  await addNodes(v, [{ id: "a", group: "x" }, { id: "b", group: "y" }], [{ src: "a", dst: "b" }], SNAP);
  assertEquals(v.nodes.length, 2);
  assertEquals(v.edges.length, 1);
  assertEquals(v.nodeIndexFull.a.degree, 1);
  assertEquals(v.nodeIndexFull.b.degree, 1);
  assertEquals(v.adjList.a, ["b"]);
  assert(rowsAreDense(v), "projection rows dense");
  assert(row(v, v.nodeIndexFull.a).some((x) => x !== 0), "projections written");
});

Deno.test("addNodes: new nodes are projected with their edges in place", async () => {
  // Regression: nodes used to be projected before their edges were inserted, so
  // every streamed node looked like an isolated, degree-0 leaf.
  const connected = makeView();
  await addNodes(connected, [{ id: "a", group: "x" }, { id: "b", group: "x" }], [{ src: "a", dst: "b" }], SNAP);
  const isolated = makeView();
  await addNodes(isolated, [{ id: "a", group: "x" }], [], SNAP);
  // Groups 2 and 3 are `structure` (degree bucket) and `neighbors`.
  const topo = (view: any) => row(view, view.nodeIndexFull.a).slice(4);
  assert(
    JSON.stringify(topo(connected)) !== JSON.stringify(topo(isolated)),
    "connected node must not project as an isolated leaf",
  );
});

Deno.test("addNodes: ignores edges with an unknown endpoint and duplicate ids", async () => {
  const v = makeView();
  await addNodes(v, [{ id: "a" }, { id: "a" }], [{ src: "a", dst: "ghost" }], SNAP);
  assertEquals(v.nodes.length, 1);
  assertEquals(v.edges.length, 0);
  assert(rowsAreDense(v), "no row leaked for the duplicate");
});

Deno.test("removeNodes: drops nodes, their edges and adjacency, and compacts rows", async () => {
  const v = makeView();
  await addNodes(v, [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], [{ src: "a", dst: "b" }], SNAP);
  const beforeC = row(v, v.nodeIndexFull.c);
  const beforeD = row(v, v.nodeIndexFull.d);

  await removeNodes(v, ["a"], SNAP);

  assertEquals(v.nodes.length, 3);
  assertEquals(v.edges.length, 0);
  assertEquals(v.nodeIndexFull.a, undefined);
  assertEquals(v.adjList.a, undefined);
  assertEquals(v.adjList.b, []);
  assertEquals(v.nodeIndexFull.b.degree, 0);
  assert(rowsAreDense(v), "rows compacted");
  assertEquals(row(v, v.nodeIndexFull.c), beforeC, "survivor keeps its projections");
  assertEquals(row(v, v.nodeIndexFull.d), beforeD, "survivor keeps its projections");
});

Deno.test("removeNodes: removing everything leaves a reusable empty view", async () => {
  const v = makeView();
  await addNodes(v, [{ id: "a" }, { id: "b" }], [{ src: "a", dst: "b" }], SNAP);
  await removeNodes(v, ["a", "b"], SNAP);
  assertEquals(v.nodes.length, 0);
  assertEquals(v.edges.length, 0);
  assertEquals(v._projRows, 0);

  await addNodes(v, [{ id: "c" }], [], SNAP);
  assertEquals(v.nodes.length, 1);
  assertEquals(v.nodes[0].projIdx, 0);
  assert(row(v, v.nodes[0]).some((x) => x !== 0), "re-added node projected");
});

Deno.test("updateNodes: merges properties and re-projects the changed node", async () => {
  const v = makeView();
  await addNodes(v, [{ id: "a", group: "x" }], [], SNAP);
  const before = row(v, v.nodeIndexFull.a);
  await updateNodes(v, [{ id: "a", group: "z" }], SNAP);
  assertEquals(v.nodeIndexFull.a.group, "z");
  assert(JSON.stringify(row(v, v.nodeIndexFull.a)) !== JSON.stringify(before), "re-projected");
});

// ─── Topology-derived groups stay current ────────────────────────────────────

Deno.test("addNodes: an edge between existing nodes re-projects only its endpoints", async () => {
  const v = makeView();
  await addNodes(v, [{ id: "a" }, { id: "b" }, { id: "far" }], [], SNAP);
  const farBefore = row(v, v.nodeIndexFull.far);
  const aBefore = row(v, v.nodeIndexFull.a);
  const genBefore = v._topoGen;

  await addNodes(v, [], [{ src: "a", dst: "b" }], SNAP);

  assertEquals(row(v, v.nodeIndexFull.far), farBefore, "unrelated node untouched");
  assert(JSON.stringify(row(v, v.nodeIndexFull.a)) !== JSON.stringify(aBefore), "endpoint re-projected");
  assertEquals(v.nodeIndexFull.a.degree, 1);
  assert(v._topoGen > genBefore, "topology generation bumped");
});

Deno.test("updateNodes: a group change re-projects neighbours' `neighbors` group only", async () => {
  const v = makeView();
  await addNodes(v, [{ id: "a", group: "x" }, { id: "b", group: "y" }], [{ src: "a", dst: "b" }], SNAP);
  const before = row(v, v.nodeIndexFull.b);

  await updateNodes(v, [{ id: "a", group: "q" }], SNAP);

  const after = row(v, v.nodeIndexFull.b);
  // Group order: group, label, structure, neighbors → `neighbors` is floats 6-7.
  assert(JSON.stringify(before.slice(6, 8)) !== JSON.stringify(after.slice(6, 8)), "`neighbors` re-projected");
  assertEquals(after.slice(0, 6), before.slice(0, 6), "other groups untouched");
});

Deno.test("addNodes: records edge types on both endpoints", async () => {
  const v = makeView([...BUILTIN_GROUPS, "edgetype"]);
  v.hasEdgeTypes = true;
  await addNodes(v, [{ id: "a" }, { id: "b" }], [{ src: "a", dst: "b", type: "FRIEND" }], SNAP);
  assertEquals(v.nodeIndexFull.a.edgeTypes, ["FRIEND"]);
  assertEquals(v.nodeIndexFull.b.edgeTypes, ["FRIEND"]);
});

// ─── Serialization ───────────────────────────────────────────────────────────

Deno.test("mutations run in call order when callers don't await", async () => {
  // Regression: an add issued while another mutation ran used to be queued and
  // then never drained, so its nodes silently never appeared.
  const v = makeView();
  await addNodes(v, [{ id: "a", group: "x" }], [], SNAP);

  const order: string[] = [];
  const update = updateNodes(v, [{ id: "a", group: "z" }], SNAP).then(() => order.push("update"));
  const add = addNodes(v, [{ id: "b" }], [], SNAP).then(() => order.push("add"));
  await Promise.all([update, add]);

  assertEquals(order, ["update", "add"]);
  assertEquals(v.nodeIndexFull.a.group, "z");
  assertExists(v.nodeIndexFull.b);
});

Deno.test("addNodes: consecutive queued adds merge into one blend", async () => {
  const v = makeView();
  v.blends = 0;
  await Promise.all([
    addNodes(v, [{ id: "a" }], [], SNAP),
    addNodes(v, [{ id: "b" }], [], SNAP),
  ]);
  assertEquals(v.nodes.length, 2);
  assertEquals(v.blends, 1, "both batches blended together");
});

Deno.test("a removal between adds keeps order and blocks merging", async () => {
  const v = makeView();
  v.blends = 0;
  const order: string[] = [];
  await Promise.all([
    addNodes(v, [{ id: "a" }], [], SNAP).then(() => order.push("add1")),
    addNodes(v, [{ id: "b" }], [], SNAP).then(() => order.push("add2")),
    removeNodes(v, ["a"], SNAP).then(() => order.push("remove")),
    addNodes(v, [{ id: "c" }], [], SNAP).then(() => order.push("add3")),
  ]);

  assertEquals(order, ["add1", "add2", "remove", "add3"]);
  assertEquals(v.nodeIndexFull.a, undefined);
  assertExists(v.nodeIndexFull.b);
  assertExists(v.nodeIndexFull.c);
  assert(rowsAreDense(v), "rows dense after a mixed sequence");
  assertEquals(v.blends, 3, "the two leading adds merged; remove and add3 are separate");
});

Deno.test("a failed mutation rejects its caller without stalling the chain", async () => {
  const v = makeView();
  const boom = new Error("blend failed");
  v._blend = async function () {
    v._blend = async function () { this.blends++; };
    throw boom;
  };

  const failed = await addNodes(v, [{ id: "a" }], [], SNAP).then(() => "resolved", (e: unknown) => e);
  assertEquals(failed, boom);

  await addNodes(v, [{ id: "b" }], [], SNAP);
  assertExists(v.nodeIndexFull.b);
});

// ─── Periodic full rebuild ───────────────────────────────────────────────────

Deno.test("addNodes: periodic full rebuild keeps rows and projections consistent", async () => {
  const v = makeView();
  v._rebuildThreshold = 0.1;
  await addNodes(v, [{ id: "a", kind: "p" }, { id: "b", kind: "q" }, { id: "c", kind: "p" }], [], SNAP);
  assertEquals(v._originalN, 3, "first build is the baseline, not an insert");

  await addNodes(v, [{ id: "d", kind: "q" }], [], SNAP); // 33% growth > 10% → rebuild

  assert(rowsAreDense(v), "rows dense after rebuild");
  assert(v.projBuf.length >= v.nodes.length * v.groupNames.length * 2, "buffer large enough");
  assert(v.nodes.every((n: any) => row(v, n).some((x) => x !== 0)), "every node projected");
  assertEquals(v._insertsSinceRebuild, 0);
  assertEquals(v._originalN, 4);
});

// ─── Norm quantization: displacement ─────────────────────────────────────────

Deno.test("norm mode: inserting nodes never moves existing ones", async () => {
  const v = withRealBlend(makeView());
  const seed = Array.from({ length: 100 }, (_, i) => ({ id: "n" + i, group: "g" + (i % 7) }));
  await addNodes(v, seed, [{ src: "n0", dst: "n1" }], SNAP);
  const cells = cellsOf(v);
  assert(new Set(cells.values()).size > 1, "nodes occupy more than one cell");

  await addNodes(v, Array.from({ length: 50 }, (_, i) => ({ id: "m" + i, group: "g" + (i % 7) })), [], SNAP);

  assertEquals(movedSince(v, cells), [], "no existing node moved");
});

Deno.test("norm mode: a new edge moves only its endpoints", async () => {
  const v = withRealBlend(makeView());
  await addNodes(v, Array.from({ length: 60 }, (_, i) => ({ id: "n" + i, group: "g" + (i % 5) })), [], SNAP);
  const cells = cellsOf(v);

  await addNodes(v, [], [{ src: "n5", dst: "n6" }], SNAP);

  for (const id of movedSince(v, cells)) {
    assert(id === "n5" || id === "n6", `unexpected displacement: ${id}`);
  }
});

Deno.test("norm mode: a removal moves only the removed node's neighbours", async () => {
  const v = withRealBlend(makeView());
  await addNodes(
    v,
    Array.from({ length: 60 }, (_, i) => ({ id: "n" + i, group: "g" + (i % 5) })),
    [{ src: "n0", dst: "n1" }],
    SNAP,
  );
  const cells = cellsOf(v);

  await removeNodes(v, ["n0"], SNAP);

  for (const id of movedSince(v, cells)) {
    assert(id === "n1", `unexpected displacement: ${id}`);
  }
});
