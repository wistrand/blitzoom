#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Convert Azgaar Fantasy Map Generator JSON export to SNAP format.
 *
 * Nodes = burgs (settlements) with culture, state, religion, type, population, infrastructure
 * Edges = routes (roads, trails, searoutes) connecting burgs
 *
 * Usage: deno run --allow-read --allow-write scripts/azgaar2snap.ts <input.json> [output-prefix]
 */

const inputFile = Deno.args[0];
if (!inputFile) { console.error("Usage: azgaar2snap.ts <input.json> [output-prefix]"); Deno.exit(1); }
const prefix = Deno.args[1] || "docs/data/fantasy-map";

const data = JSON.parse(Deno.readTextFileSync(inputFile));
const pack = data.pack;

const mapName = data.info?.mapName || "Fantasy Map";
console.log(`Map: ${mapName}`);

// ─── Lookup tables ──────────────────────────────────────────────────────────

const cultures: Record<number, string> = {};
for (const c of pack.cultures) {
  if (typeof c === "object" && c !== null) cultures[c.i] = c.name;
}

const states: Record<number, { name: string; form: string }> = {};
for (const s of pack.states) {
  if (typeof s === "object" && s !== null) states[s.i] = { name: s.name || "", form: s.form || "" };
}

const religions: Record<number, { name: string; type: string }> = {};
for (const r of pack.religions) {
  if (typeof r === "object" && r !== null) religions[r.i] = { name: r.name || "", type: r.type || "" };
}

const biomes: Record<number, string> = {};
if (data.biomesData?.name) {
  for (let i = 0; i < data.biomesData.name.length; i++) {
    biomes[i] = data.biomesData.name[i];
  }
}

// Cell → biome/religion lookup
const cellBiome: Record<number, number> = {};
const cellReligion: Record<number, number> = {};
for (const cell of pack.cells) {
  if (typeof cell === "object" && cell !== null) {
    cellBiome[cell.i] = cell.biome;
    if (cell.religion !== undefined) cellReligion[cell.i] = cell.religion;
  }
}

// ─── Build burgs ────────────────────────────────────────────────────────────

interface Burg {
  i: number;
  name: string;
  cell: number;
  culture: string;
  state: string;
  stateForm: string;
  religion: string;
  type: string;
  population: number;
  capital: boolean;
  port: boolean;
  citadel: boolean;
  walls: boolean;
  temple: boolean;
  plaza: boolean;
  biome: string;
}

const cell_to_burg = new Map<number, Burg>();
const burg_by_id = new Map<number, Burg>();
const burgList: Burg[] = [];

for (const b of pack.burgs) {
  if (typeof b !== "object" || b === null || !b.cell || !b.name) continue;
  const cellId = b.cell;
  const cultureId = b.culture ?? 0;
  const stateId = b.state ?? 0;
  const religionId = cellReligion[cellId] ?? 0;
  const biomeId = cellBiome[cellId] ?? 0;

  const burg: Burg = {
    i: b.i,
    name: b.name,
    cell: cellId,
    culture: cultures[cultureId] || "Unknown",
    state: states[stateId]?.name || "Neutral",
    stateForm: states[stateId]?.form || "",
    religion: religions[religionId]?.name || "",
    type: b.type || "",
    population: Math.round((b.population || 0) * (data.settings?.populationRate || 1000)),
    capital: !!b.capital,
    port: !!b.port,
    citadel: !!b.citadel,
    walls: !!b.walls,
    temple: !!b.temple,
    plaza: !!b.plaza,
    biome: biomes[biomeId] || "",
  };

  cell_to_burg.set(cellId, burg);
  burg_by_id.set(b.i, burg);
  burgList.push(burg);
}

console.log(`Burgs: ${burgList.length}`);

// ─── Build edges from routes ────────────────────────────────────────────────

interface Edge { src: string; dst: string; type: string; }
const edgeSet = new Set<string>();
const edges: Edge[] = [];

for (const r of pack.routes) {
  if (typeof r !== "object" || r === null || !r.points) continue;
  const group = r.group || "road";
  const pts = r.points as number[][];

  // Find all burgs along this route (consecutive burg pairs = edges)
  const routeBurgs: Burg[] = [];
  const seen = new Set<number>();
  for (const pt of pts) {
    const cellId = pt[2];
    if (cellId === undefined) continue;
    const b = cell_to_burg.get(cellId);
    if (b && !seen.has(b.i)) {
      routeBurgs.push(b);
      seen.add(b.i);
    }
  }

  for (let j = 0; j < routeBurgs.length - 1; j++) {
    const a = routeBurgs[j], b = routeBurgs[j + 1];
    const lo = Math.min(a.i, b.i), hi = Math.max(a.i, b.i);
    const key = `${lo}\t${hi}\t${group}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);
    edges.push({ src: a.name, dst: b.name, type: group === "searoutes" ? "sea" : group === "roads" ? "road" : "trail" });
  }
}

// Filter to connected burgs
const connectedNames = new Set<string>();
for (const e of edges) { connectedNames.add(e.src); connectedNames.add(e.dst); }
const connectedBurgs = burgList.filter(b => connectedNames.has(b.name));

console.log(`Edges: ${edges.length} (${new Set(edges.map(e => e.type)).size} types)`);
console.log(`Connected burgs: ${connectedBurgs.length} / ${burgList.length}`);

// ─── Write .edges ───────────────────────────────────────────────────────────

const edgeLines = [
  `# ${mapName} — fantasy settlement route network`,
  `# Nodes: ${connectedBurgs.length} Edges: ${edges.length}`,
  "# FromId\tToId\tEdgeType",
];
for (const e of edges) {
  edgeLines.push(`${e.src}\t${e.dst}\t${e.type}`);
}
Deno.writeTextFileSync(prefix + ".edges", edgeLines.join("\n") + "\n");

// ─── Write .nodes ───────────────────────────────────────────────────────────

const nodeLines = [
  "# NodeId\tLabel\tGroup\tState\tGovernment\tReligion\tType\tBiome\tPopulation\tCapital\tPort\tCitadel\tWalls",
];
for (const b of connectedBurgs) {
  nodeLines.push([
    b.name,
    b.name,
    b.culture,
    b.state,
    b.stateForm,
    b.religion,
    b.type,
    b.biome,
    String(b.population),
    b.capital ? "yes" : "",
    b.port ? "yes" : "",
    b.citadel ? "yes" : "",
    b.walls ? "yes" : "",
  ].join("\t"));
}
Deno.writeTextFileSync(prefix + ".nodes", nodeLines.join("\n") + "\n");

// ─── Summary ────────────────────────────────────────────────────────────────

console.log(`\nWrote ${prefix}.edges (${edges.length} edges)`);
console.log(`Wrote ${prefix}.nodes (${connectedBurgs.length} nodes)`);

const counts = (arr: string[]) => {
  const c: Record<string, number> = {};
  for (const v of arr) c[v] = (c[v] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
};

console.log("\nCultures:");
for (const [k, v] of counts(connectedBurgs.map(b => b.culture))) console.log(`  ${String(v).padStart(4)}  ${k}`);

console.log("\nStates:");
for (const [k, v] of counts(connectedBurgs.map(b => b.state))) console.log(`  ${String(v).padStart(4)}  ${k}`);

console.log("\nEdge types:");
for (const [k, v] of counts(edges.map(e => e.type))) console.log(`  ${String(v).padStart(4)}  ${k}`);
