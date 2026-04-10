// Static import DAG enforcement.
//
// Parses every .js file under docs/ that participates in the BlitZoom module
// graph, extracts its `import` statements (only relative imports — bare and
// URL imports are ignored), builds a directed graph, and asserts the graph
// invariants documented in agent_docs/ARCHITECTURE.md "Module System":
//
//   1. The graph is acyclic (a strict DAG).
//   2. The companion components bz-compass.js and bz-controls.js have zero
//      local imports — they are leaf modules.
//   3. Each module's imports are consistent with the documented layer order
//      (lower layers cannot import from higher layers).
//
// These rules preserve the property that any module can be reasoned about by
// reading itself plus its strict subset of dependencies — adding a cycle or
// a back-edge from a leaf component would silently break that.

import { assertEquals, assert } from "https://deno.land/std/assert/mod.ts";

const DOCS_DIR = new URL("../docs/", import.meta.url).pathname;

// Documented layering — lower index = lower layer. A module's layer is the
// max layer of any of its imports + 1. The check below verifies that the
// computed layer for each module is consistent with this declared layer.
const LAYERS: Record<string, number> = {
  // Layer 0 — no local deps
  "blitzoom-algo.js":          0,
  "blitzoom-colors.js":        0,
  "bz-compass.js":             0,
  "bz-controls.js":            0,
  "stix2snap.js":              0,
  // Layer 1 — only depend on layer 0
  "blitzoom-pipeline.js":      1,
  "blitzoom-renderer.js":      1,
  "blitzoom-gl-renderer.js":   1,
  "blitzoom-utils.js":         1,
  "blitzoom-svg.js":           1,
  // Layer 2
  "blitzoom-mutations.js":     2,
  "blitzoom-gpu.js":           2,
  "blitzoom-parsers.js":       2,
  // Layer 3
  "blitzoom-canvas.js":        3,
  // Layer 4
  "blitzoom-factory.js":       4,
  // Layer 5
  "bz-graph.js":               5,
  "blitzoom-viewer.js":        5,
  // Layer 6 — public entry
  "blitzoom.js":               6,
  // Workers — separate roots, low layer (algo/pipeline only)
  "blitzoom-worker.js":        2,
  "blitzoom-proj-worker.js":   2,
};

// Files that must have zero static local imports (pure leaf modules).
// Dynamic `await import(...)` is allowed — these components use it to lazy-load
// blitzoom-utils.js for auto-tune so the bundler can tree-shake utils when
// the user never triggers auto-tune.
const LEAF_MODULES = new Set(["bz-compass.js", "bz-controls.js"]);

/**
 * Strip JS line and block comments from source. Conservative — does not
 * understand string literals containing `//`, but our import statements
 * always sit at the top of files in plain code, so this is sufficient.
 */
function stripComments(src: string): string {
  // Block comments first (greedy match across newlines).
  src = src.replace(/\/\*[\s\S]*?\*\//g, "");
  // Then line comments.
  src = src.replace(/\/\/.*$/gm, "");
  return src;
}

/**
 * Extract STATIC relative imports (`import ... from "./foo.js"` and
 * `import "./foo.js"`). Ignores bare imports, URL imports, and dynamic
 * `await import(...)` calls — those have separate semantics and are
 * intentionally allowed to cross layers (e.g. lazy-loading auto-tune).
 */
function extractStaticImports(content: string): string[] {
  const stripped = stripComments(content);
  const imports: string[] = [];
  const re = /^[ \t]*import\s*(?:[^'"]*\sfrom\s*)?["']([^"']+)["']/gm;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    if (m[1].startsWith("./") || m[1].startsWith("../")) imports.push(m[1]);
  }
  return imports;
}

/**
 * Extract DYNAMIC relative imports (`await import("./foo.js")` and
 * `import("./foo.js")` as an expression).
 */
function extractDynamicImports(content: string): string[] {
  const stripped = stripComments(content);
  const imports: string[] = [];
  const re = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    if (m[1].startsWith("./") || m[1].startsWith("../")) imports.push(m[1]);
  }
  return imports;
}

/**
 * Resolve a relative import path to a basename relative to the docs/ root.
 * Handles ./ and ../, normalizes the path, and ensures the result is one of
 * the known modules (returns null otherwise — e.g. for paths that escape
 * docs/ entirely or point to the dist bundle).
 */
function resolveToBasename(fromFile: string, importPath: string): string | null {
  // fromFile is e.g. "blitzoom-canvas.js" (already at docs root) — all our
  // tracked files live directly under docs/, so resolution is simple.
  let p = importPath;
  if (p.startsWith("./")) p = p.slice(2);
  if (p.startsWith("../")) {
    // Escapes docs/ — out of scope.
    return null;
  }
  // Drop any leading ./
  while (p.startsWith("./")) p = p.slice(2);
  if (!p.endsWith(".js")) return null;
  return p;
}

/**
 * Build the import graph for all known modules.
 * @param includeDynamic if true, also include `await import(...)` edges.
 * @returns Map<module_basename, Set<imported_basename>>.
 */
function buildGraph(includeDynamic = false): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const name of Object.keys(LAYERS)) {
    const path = DOCS_DIR + name;
    let content: string;
    try {
      content = Deno.readTextFileSync(path);
    } catch {
      // File missing — test 4 catches this.
      continue;
    }
    const raw = extractStaticImports(content);
    if (includeDynamic) raw.push(...extractDynamicImports(content));
    const resolved = new Set<string>();
    for (const r of raw) {
      const base = resolveToBasename(name, r);
      if (base && base in LAYERS) resolved.add(base);
    }
    graph.set(name, resolved);
  }
  return graph;
}

/**
 * Detect cycles via DFS. Returns the first cycle as an array of basenames
 * (with the start node duplicated at the end), or null if acyclic.
 */
function findCycle(graph: Map<string, Set<string>>): string[] | null {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const k of graph.keys()) color.set(k, WHITE);
  const stack: string[] = [];

  function dfs(node: string): string[] | null {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of graph.get(node) || []) {
      const c = color.get(next) ?? WHITE;
      if (c === GRAY) {
        // Found a back-edge — extract the cycle.
        const idx = stack.indexOf(next);
        return [...stack.slice(idx), next];
      }
      if (c === WHITE) {
        const found = dfs(next);
        if (found) return found;
      }
    }
    stack.pop();
    color.set(node, BLACK);
    return null;
  }

  for (const node of graph.keys()) {
    if (color.get(node) === WHITE) {
      const found = dfs(node);
      if (found) return found;
    }
  }
  return null;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test("import graph is acyclic (no module imports anything that imports it)", () => {
  const graph = buildGraph();
  const cycle = findCycle(graph);
  assertEquals(
    cycle,
    null,
    cycle ? `Import cycle detected:\n  ${cycle.join("\n  → ")}` : "",
  );
});

Deno.test("leaf modules (bz-compass.js, bz-controls.js) have zero local imports", () => {
  const graph = buildGraph();
  for (const leaf of LEAF_MODULES) {
    const imports = graph.get(leaf);
    assert(
      imports !== undefined,
      `Leaf module ${leaf} not found in graph — was it deleted? Update LAYERS in this test if so.`,
    );
    assertEquals(
      imports.size,
      0,
      `Leaf module ${leaf} has imports it shouldn't have: [${[...imports].join(", ")}]. ` +
      `Companion components are required to be dependency-free; access the bound view ` +
      `via runtime properties (this._boundView.someMethod()) instead. See ` +
      `forwardKeyEvent() in blitzoom-canvas.js for the recommended pattern.`,
    );
  }
});

Deno.test("layer monotonicity: each module only imports from strictly lower layers", () => {
  const graph = buildGraph();
  const violations: string[] = [];
  for (const [from, deps] of graph) {
    const fromLayer = LAYERS[from];
    for (const to of deps) {
      const toLayer = LAYERS[to];
      if (toLayer >= fromLayer) {
        violations.push(`${from} (layer ${fromLayer}) imports ${to} (layer ${toLayer})`);
      }
    }
  }
  assertEquals(
    violations.length,
    0,
    `Layer violations:\n  ${violations.join("\n  ")}\n` +
    `Each module must only import from strictly lower layers. Move the importing ` +
    `module up a layer, or refactor to remove the upward dependency. See ` +
    `agent_docs/ARCHITECTURE.md "Module System" for the documented layering.`,
  );
});

Deno.test("every module declared in LAYERS exists on disk", () => {
  const missing: string[] = [];
  for (const name of Object.keys(LAYERS)) {
    try {
      Deno.statSync(DOCS_DIR + name);
    } catch {
      missing.push(name);
    }
  }
  assertEquals(
    missing.length,
    0,
    `Modules declared in the test's LAYERS table but missing from docs/:\n  ${missing.join("\n  ")}\n` +
    `Either restore the file or remove it from the LAYERS table in this test.`,
  );
});

Deno.test("static + dynamic import graph is acyclic", () => {
  // Even though dynamic imports are allowed to cross layers (lazy loading),
  // they must not introduce cycles either — a cycle through `await import()`
  // is still a cycle at runtime, just deferred. Currently the only dynamic
  // imports are bz-compass/bz-controls/bz-graph → blitzoom-utils for
  // auto-tune, none of which create back-edges.
  const graph = buildGraph(true);
  const cycle = findCycle(graph);
  assertEquals(
    cycle,
    null,
    cycle ? `Import cycle detected (including dynamic imports):\n  ${cycle.join("\n  → ")}` : "",
  );
});
