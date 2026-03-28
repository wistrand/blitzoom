# Plan: Rename internal "labels" identifiers to "nodes"

## Context
The `.labels` file extension was renamed to `.nodes` (data files, UI text, fetch URLs). But internal variable names still say `labels` when they refer to the node properties file, not the display label property. This creates a confusing split where file paths say `.nodes` but the code that processes them says `labelsText`, `parseLabelsFile`, etc.

## Scope

**RENAME** (file-format identifiers):
- `parseLabelsFile` → `parseNodesFile`
- `labelsText` → `nodesText` (function params, local vars)
- `pendingLabelsText` → `pendingNodesText`
- `labelsFile` → `nodesFile` (HTML element ID + JS references)
- `labelResult` → `nodesResult`
- `labelMap` → `nodesMap` (param in buildGraph)
- `labelResult.labels` → `nodesResult.nodes` (return field)
- `dataset.labels` → `dataset.nodes` (DATASETS property)
- Doc/comment references to `.labels` format

**KEEP** (display-label identifiers):
- `n.label`, `cachedLabel`, `labelProps`, `_nodeLabel`, `_supernodeLabel`
- `labelValFn`, `tokenizeLabel`, `labelCounts`, `showLabel`, `rawLabel`
- `_cachedLabelProps`, `_labelProp`, `weight-label`, `stat-label`, `zoom-label`

## Steps (one file at a time, test after each group)

### Step 1: bitzoom-pipeline.js
- `parseLabelsFile` → `parseNodesFile` (definition + internal refs)
- `labelsText` → `nodesText` (param in `runPipeline`)
- `labelResult` → `nodesResult` (local var)
- Return field `{ labels: Map }` → `{ nodes: Map }`
- `labelMap` → `nodesMap` (param in `buildGraph`)
- **Verify**: `deno task test` — will fail on imports in other files (expected)

### Step 2: bitzoom-worker.js
- Import `parseNodesFile` (was `parseLabelsFile`)
- `labelsText` → `nodesText`
- `labelResult` → `nodesResult`
- `labelResult.labels` → `nodesResult.nodes`
- **Verify**: import resolves, destructuring matches

### Step 3: tests/pipeline_test.ts
- Import `parseNodesFile` (was `parseLabelsFile`)
- All `parseLabelsFile(` → `parseNodesFile(`
- All `labelResult` → `nodesResult`
- All `.labels` → `.nodes` (on result access, NOT on `n.label`)
- **Verify**: `deno task test` — 48/48 pass

### Step 4: bitzoom-viewer.js
- `pendingLabelsText` → `pendingNodesText` (property + all refs)
- `dataset.labels` → `dataset.nodes` (DATASETS + loadDataset)
- `labelsText` → `nodesText` (in loadGraph, _applyWorkerResult)
- `labelsFile` → `nodesFile` (getElementById refs)
- **Verify**: `deno task test` — 48/48 pass

### Step 5: viewer.html
- Element ID `labelsFile` → `nodesFile`
- **Verify**: matches bitzoom-viewer.js references from step 4

### Step 6: bitzoom-canvas.js
- `labelsText` → `nodesText` (in createBitZoomView param + JSDoc)
- **Verify**: `deno task test` — 48/48 pass

### Step 7: HTML demos (about.html, index.html, howto.html)
- `labelsText` → `nodesText` in demo scripts
- Code examples in howto.html
- **Verify**: no `.labels` references remain in fetch/demo code

### Step 8: Converter scripts
- `scripts/stix2snap.ts`, `scripts/csv2snap.ts`, `scripts/src2snap.ts`
- Comment/log references to ".labels" → ".nodes"
- Output filename references
- **Verify**: grep for `.labels` in scripts

### Step 9: Markdown docs
- CLAUDE.md, README.md, ARCHITECTURE.md, SPEC.md
- All `.labels` format references → `.nodes`
- `parseLabelsFile` → `parseNodesFile` in docs
- **Verify**: `grep -r '\.labels' --include='*.md'` returns nothing format-related

### Step 10: Final verification
- `deno task test` — 48/48 pass
- `grep -rn 'labelsText\|labelsFile\|parseLabelsFile\|pendingLabelsText\|labelResult\|labelMap' docs/ tests/` — only display-label refs remain
- `grep -rn '\.labels' docs/ tests/ scripts/ *.md` — only backward-compat drop handler

## Files modified (17)
- `docs/bitzoom-pipeline.js`
- `docs/bitzoom-worker.js`
- `docs/bitzoom-canvas.js`
- `docs/bitzoom-viewer.js`
- `docs/bitzoom-renderer.js` (no changes expected)
- `docs/viewer.html`
- `docs/about.html`
- `docs/index.html`
- `docs/howto.html`
- `tests/pipeline_test.ts`
- `scripts/stix2snap.ts`
- `scripts/csv2snap.ts`
- `scripts/src2snap.ts`
- `CLAUDE.md`
- `README.md`
- `agent_docs/ARCHITECTURE.md`
- `agent_docs/SPEC.md`

## Risk: display-label contamination
The word "label" appears ~200 times in the codebase. Most refer to the display label property (n.label, cachedLabel, labelProps). The rename MUST NOT touch these. Each step uses targeted replacements on specific identifiers, not blind find-replace of "label".
