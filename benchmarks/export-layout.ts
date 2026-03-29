#!/usr/bin/env -S deno run --allow-read --allow-write
// Export BitZoom layout coordinates for comparison benchmarks.
// Usage: deno run --allow-read --allow-write benchmarks/export-layout.ts \
//          --edges docs/data/email-eu.edges [--nodes docs/data/email-eu.nodes] \
//          --alpha 0.75 --quant rank --out benchmarks/layouts/email-eu-a075.tsv
//
// Runs the full pipeline: parse → project → blend → quantize → export.

import { runPipeline } from '../docs/bitzoom-pipeline.js';
import { buildGaussianProjection, unifiedBlend, MINHASH_K } from '../docs/bitzoom-algo.js';

function parseArgs() {
  const args = Deno.args;
  const opts = { edges: '', nodes: '', alpha: 0, quant: 'gaussian', out: '', weights: {} };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--edges') opts.edges = args[++i];
    else if (args[i] === '--nodes') opts.nodes = args[++i];
    else if (args[i] === '--alpha') opts.alpha = parseFloat(args[++i]);
    else if (args[i] === '--quant') opts.quant = args[++i];
    else if (args[i] === '--out') opts.out = args[++i];
    else if (args[i] === '--weight') {
      const [k, v] = args[++i].split('=');
      opts.weights[k] = parseFloat(v);
    }
  }
  if (!opts.edges || !opts.out) {
    console.error('Usage: --edges <file> [--nodes <file>] [--alpha 0.75] [--quant rank|gaussian] [--weight group=5] --out <file>');
    Deno.exit(1);
  }
  return opts;
}

const opts = parseArgs();

const edgesText = await Deno.readTextFile(opts.edges);
const nodesText = opts.nodes ? await Deno.readTextFile(opts.nodes) : null;

const result = runPipeline(edgesText, nodesText);
const { nodeArray, groupNames, projBuf } = result;

// Build node objects with projections (same as bitzoom-canvas.js _hydrateAndLink)
const G = groupNames.length;
const groupProjections = {};
for (let i = 0; i < groupNames.length; i++) {
  groupProjections[groupNames[i]] = buildGaussianProjection(2001 + i, MINHASH_K);
}

const nodes = nodeArray.map((meta, i) => {
  const projections = {};
  for (let g = 0; g < G; g++) {
    const off = (i * G + g) * 2;
    projections[groupNames[g]] = [projBuf[off], projBuf[off + 1]];
  }
  return { ...meta, projections, px: 0, py: 0, gx: 0, gy: 0 };
});

// Build adjacency list
const adjList = Object.fromEntries(nodes.map(n => [n.id, []]));
const edges = result.edges || [];
for (const e of edges) {
  if (adjList[e.src] && adjList[e.dst]) {
    adjList[e.src].push(e.dst);
    adjList[e.dst].push(e.src);
  }
}

const nodeIndexFull = Object.fromEntries(nodes.map(n => [n.id, n]));

// Set weights
const propWeights = {};
for (const g of groupNames) propWeights[g] = opts.weights[g] ?? 0;

// Blend + quantize
unifiedBlend(nodes, groupNames, propWeights, opts.alpha, adjList, nodeIndexFull, 5, opts.quant, {});

// Export
const lines = ['# id\tpx\tpy\tgx\tgy'];
for (const n of nodes) {
  lines.push(`${n.id}\t${n.px}\t${n.py}\t${n.gx}\t${n.gy}`);
}

await Deno.writeTextFile(opts.out, lines.join('\n') + '\n');
console.log(`Exported ${nodes.length} nodes to ${opts.out}`);
console.log(`  Groups: ${groupNames.join(', ') || '(none)'}`);
console.log(`  Alpha: ${opts.alpha}, Quant: ${opts.quant}`);
console.log(`  Weights: ${JSON.stringify(propWeights)}`);
