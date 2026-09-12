// Edge selection for rendering: the helpers in blitzoom-algo.js shared by the
// Canvas 2D renderer, the WebGL renderer and SVG export.
//
// These run headless — the helpers take plain node/edge objects and a viewport,
// never a canvas.

import { assert, assertAlmostEquals, assertEquals } from "https://deno.land/std/assert/mod.ts";

import {
  edgeEndpoints, sampleEdges, incidentEdges, edgesTouching, maxEdgesToDraw, edgeHash,
  packProjections, unifiedBlend,
} from "../docs/blitzoom-algo.js";

// ─── Fixture: 500 nodes on a 25×20 grid, 3000 deterministic random edges ─────

function makeGraph(edgeCount = 3000) {
  const rnd = ((s: number) => () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296)(7);
  const nodes = Array.from({ length: 500 }, (_, i) => ({
    id: "n" + i, projIdx: i, x: (i % 25) * 40, y: ((i / 25) | 0) * 40,
  }));
  const index: Record<string, any> = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = Array.from({ length: edgeCount }, () => ({
    src: "n" + ((rnd() * 500) | 0),
    dst: "n" + ((rnd() * 500) | 0),
  }));
  return { nodes, index, edges };
}

const W = 800, H = 600;
const PAN = { x: 0, y: 0 };
const endsOf = (edges: any[], index: any) =>
  edgeEndpoints(edges, index, (e: any) => index[e.src], (e: any) => index[e.dst]);

// ─── edgeEndpoints ───────────────────────────────────────────────────────────

Deno.test("edgeEndpoints: resolves both endpoints per edge", () => {
  const { index, edges } = makeGraph();
  const ends = endsOf(edges, index);
  assertEquals(ends.a.length, edges.length);
  assert(ends.a.every((n: any, i: number) => n === index[edges[i].src]), "source identity");
  assert(ends.b.every((n: any, i: number) => n === index[edges[i].dst]), "target identity");
});

Deno.test("edgeEndpoints: caches per (edge array, source) and extends on append", () => {
  const { index, edges } = makeGraph();
  const ends = endsOf(edges, index);
  edges.push({ src: "n0", dst: "n1" });
  const again = endsOf(edges, index);
  assert(again === ends, "same cache entry reused");
  assertEquals(again.a.length, edges.length);
  assertEquals(again.a[edges.length - 1], index["n0"]);
});

Deno.test("edgeEndpoints: a different source gets its own entry", () => {
  const { index, edges } = makeGraph(10);
  const other: Record<string, any> = Object.fromEntries(
    Object.entries(index).map(([id, n]: [string, any]) => [id, { ...n }]),
  );
  const a = endsOf(edges, index);
  const b = endsOf(edges, other);
  assert(a !== b, "separate entries");
  assert(b.a[0] === other[edges[0].src], "second entry resolves in its own source");
});

// ─── sampleEdges ─────────────────────────────────────────────────────────────

Deno.test("sampleEdges: deterministic, ascending, unique indices", () => {
  const { nodes, index, edges } = makeGraph();
  const ends = endsOf(edges, index);
  const max = maxEdgesToDraw(nodes.length);
  const first = sampleEdges(edges, ends, PAN, 1, W, H, max);
  const picked = [...first.idx.slice(0, first.count)];
  const second = sampleEdges(edges, ends, PAN, 1, W, H, max);
  assertEquals(picked, [...second.idx.slice(0, second.count)]);
  assert(picked.every((v, i, arr) => i === 0 || arr[i - 1] < v), "ascending and unique");
});

Deno.test("sampleEdges: every picked edge intersects the viewport", () => {
  const { nodes, index, edges } = makeGraph();
  const ends = endsOf(edges, index);
  const { idx, count } = sampleEdges(edges, ends, PAN, 1, W, H, maxEdgesToDraw(nodes.length));
  for (let j = 0; j < count; j++) {
    const a = ends.a[idx[j]], b = ends.b[idx[j]];
    // Same padded bounding-box test sampleEdges uses (curve bulge + stroke).
    const pad = 0.15 * (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) + 2;
    assert(
      Math.max(a.x, b.x) >= -pad && Math.min(a.x, b.x) <= W + pad &&
        Math.max(a.y, b.y) >= -pad && Math.min(a.y, b.y) <= H + pad,
      `edge ${idx[j]} is off-screen`,
    );
  }
});

Deno.test("sampleEdges: culls edges outside the viewport", () => {
  const { nodes, index, edges } = makeGraph();
  const ends = endsOf(edges, index);
  const { count } = sampleEdges(edges, ends, { x: -1e6, y: -1e6 }, 1, W, H, maxEdgesToDraw(nodes.length));
  assertEquals(count, 0);
});

Deno.test("sampleEdges: draws about maxEdges when everything is visible", () => {
  const { nodes, index, edges } = makeGraph();
  const ends = endsOf(edges, index);
  const max = maxEdgesToDraw(nodes.length);
  const { count } = sampleEdges(edges, ends, PAN, 0.05, W, H, max);
  assert(count > max * 0.85 && count <= max * 1.15, `expected ~${max} edges, got ${count}`);
});

Deno.test("sampleEdges: no positional bias — the tail of the edge array is drawn", () => {
  // Regression: the old sampler broke out of the loop once it had drawn enough,
  // so edges late in the array were never drawn at all.
  const { nodes, index, edges } = makeGraph();
  const ends = endsOf(edges, index);
  const { idx, count } = sampleEdges(edges, ends, PAN, 0.05, W, H, maxEdgesToDraw(nodes.length));
  let tail = 0;
  for (let j = 0; j < count; j++) if (idx[j] >= edges.length / 2) tail++;
  assert(tail > count * 0.4, `second half under-represented: ${tail}/${count}`);
});

Deno.test("edgeHash: stable in [0,1)", () => {
  for (const i of [0, 1, 42, 999999]) {
    const h = edgeHash(i);
    assert(h >= 0 && h < 1, `out of range: ${h}`);
    assertEquals(h, edgeHash(i));
  }
});

// ─── incidentEdges / edgesTouching ───────────────────────────────────────────

const rowOfIn = (index: any) => (id: string) => (index[id] ? index[id].projIdx : -1);
const SRC = (e: any) => e.src;
const DST = (e: any) => e.dst;

Deno.test("edgesTouching: matches a brute-force scan", () => {
  const { nodes, index, edges } = makeGraph();
  const rowOf = rowOfIn(index);
  const inc = incidentEdges(edges, index, SRC, DST, rowOf, nodes.length);
  for (const hits of [new Set(["n3"]), new Set(["n3", "n4", "n5"]), new Set(["n7", "missing"])]) {
    const got = edgesTouching(inc, edges, SRC, DST, rowOf, hits).sort((a, b) => a - b);
    const want = edges.map((_, i) => i).filter((i) => hits.has(edges[i].src) || hits.has(edges[i].dst));
    assertEquals(got, want, `hits: ${[...hits]}`);
    assertEquals(new Set(got).size, got.length, "no duplicate edges");
  }
});

Deno.test("edgesTouching: an edge between two hit nodes is returned once", () => {
  const { nodes, index } = makeGraph(0);
  const edges = [{ src: "n0", dst: "n1" }, { src: "n1", dst: "n2" }];
  const rowOf = rowOfIn(index);
  const inc = incidentEdges(edges, index, SRC, DST, rowOf, nodes.length);
  assertEquals(edgesTouching(inc, edges, SRC, DST, rowOf, new Set(["n0", "n1"])), [0, 1]);
});

Deno.test("edgesTouching: self-loops are listed once", () => {
  const { nodes, index } = makeGraph(0);
  const edges = [{ src: "n0", dst: "n0" }, { src: "n0", dst: "n1" }];
  const rowOf = rowOfIn(index);
  const inc = incidentEdges(edges, index, SRC, DST, rowOf, nodes.length);
  assertEquals(edgesTouching(inc, edges, SRC, DST, rowOf, new Set(["n0"])), [0, 1]);
});

Deno.test("incidentEdges: skips edges with an unknown endpoint", () => {
  const { nodes, index } = makeGraph(0);
  const edges = [{ src: "n0", dst: "ghost" }, { src: "n0", dst: "n1" }];
  const rowOf = rowOfIn(index);
  const inc = incidentEdges(edges, index, SRC, DST, rowOf, nodes.length);
  assertEquals(edgesTouching(inc, edges, SRC, DST, rowOf, new Set(["n0"])), [1]);
});

Deno.test("incidentEdges: rebuilds when the edge array grows", () => {
  const { nodes, index } = makeGraph(0);
  const edges = [{ src: "n0", dst: "n1" }];
  const rowOf = rowOfIn(index);
  incidentEdges(edges, index, SRC, DST, rowOf, nodes.length);
  edges.push({ src: "n0", dst: "n2" });
  const inc = incidentEdges(edges, index, SRC, DST, rowOf, nodes.length);
  assertEquals(edgesTouching(inc, edges, SRC, DST, rowOf, new Set(["n0"])), [0, 1]);
});

// ─── projIdx indexing into the flat projection buffer ────────────────────────

Deno.test("unifiedBlend: reads each node's projections by projIdx", () => {
  const groupNames = ["group", "label"];
  const nodes: any[] = [
    { id: "a", projections: { group: [1, 0], label: [0, 2] }, px: 0, py: 0 },
    { id: "b", projections: { group: [0, 1], label: [3, 0] }, px: 0, py: 0 },
  ];
  const projBuf = packProjections(nodes, groupNames);
  assertEquals(nodes.map((n) => n.projIdx), [0, 1]);
  assertEquals(projBuf.length, nodes.length * groupNames.length * 2);
  assertEquals(nodes[0].projections, undefined, "per-node objects dropped");

  const strengths = { group: 5, label: 1 };
  const adjList = { a: [], b: [] };
  const nodeIndex = { a: nodes[0], b: nodes[1] };
  const blend = () => {
    for (const n of nodes) { n.px = 0; n.py = 0; }
    unifiedBlend(nodes, projBuf, groupNames, strengths, 0, adjList, nodeIndex, 0, "gaussian", {});
    return nodes.map((n) => [n.px, n.py]);
  };

  const before = blend();
  assert(before[0][0] !== before[1][0], "the two nodes land in different places");

  // Swapping which row each node reads must swap their positions.
  nodes[0].projIdx = 1;
  nodes[1].projIdx = 0;
  const after = blend();
  assertAlmostEquals(after[0][0], before[1][0]);
  assertAlmostEquals(after[0][1], before[1][1]);
  assertAlmostEquals(after[1][0], before[0][0]);
  assertAlmostEquals(after[1][1], before[0][1]);
});

Deno.test("unifiedBlend: a subset of nodes indexes the full buffer", () => {
  // Auto-tune subsampling and fast-mode sampling both blend node subsets.
  const groupNames = ["group"];
  const nodes: any[] = [
    { id: "a", projections: { group: [1, 0] }, px: 0, py: 0 },
    { id: "b", projections: { group: [0, 1] }, px: 0, py: 0 },
  ];
  const projBuf = packProjections(nodes, groupNames);
  const subset = [nodes[1]];
  unifiedBlend(subset, projBuf, groupNames, { group: 1 }, 0, { b: [] }, { b: nodes[1] }, 0, "gaussian", {});
  assert(Number.isFinite(nodes[1].px) && Number.isFinite(nodes[1].py), "blended from its own row");
});
