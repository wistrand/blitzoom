# Plan: Full Rename BitZoom → Blitzoom

## Context

Name conflict with existing "BitZoom". Full rename of everything: files, classes, imports, display text, docs. New repo: `github.com/wistrand/blitzoom` (already claimed). Fork from `bitzoom`, apply rename, work from new repo.

## Naming map

| Old | New |
|-----|-----|
| `BitZoom` (class) | `Blitzoom` |
| `BitZoomCanvas` (class) | `BlitzoomCanvas` |
| `createBitZoomView` | `createBlitzoomView` |
| `createBitZoomFromGraph` | `createBlitzoomFromGraph` |
| `bitzoom-algo.js` | `blitzoom-algo.js` |
| `bitzoom-canvas.js` | `blitzoom-canvas.js` |
| `bitzoom-colors.js` | `blitzoom-colors.js` |
| `bitzoom-gl-renderer.js` | `blitzoom-gl-renderer.js` |
| `bitzoom-gpu.js` | `blitzoom-gpu.js` |
| `bitzoom-parsers.js` | `blitzoom-parsers.js` |
| `bitzoom-pipeline.js` | `blitzoom-pipeline.js` |
| `bitzoom-proj-worker.js` | `blitzoom-proj-worker.js` |
| `bitzoom-renderer.js` | `blitzoom-renderer.js` |
| `bitzoom-svg.js` | `blitzoom-svg.js` |
| `bitzoom-utils.js` | `blitzoom-utils.js` |
| `bitzoom-viewer.js` | `blitzoom-viewer.js` |
| `bitzoom-worker.js` | `blitzoom-worker.js` |
| `bitzoom.js` | `blitzoom.js` |
| `bitzoom.css` | `blitzoom.css` |
| `dist/bitzoom.bundle.js` | `dist/blitzoom.bundle.js` |
| `bitzoom-source.edges/nodes` | `blitzoom-source.edges/nodes` |
| `images/bitzoom-1.png` | `images/blitzoom-1.png` |
| `images/bitzoom-2.png` | `images/blitzoom-2.png` |

**Unchanged:** `bz-graph.js`, `bz-compass.js`, `bz-controls.js`, `<bz-graph>`, `<bz-compass>`, `<bz-controls>`, `.bz-*` CSS classes, `bzsource-*.tsv` ground truth filenames (abbreviation of dataset id `bz-source`).

---

## Phase 1: Fork repo

1. Fork `wistrand/bitzoom` → `wistrand/blitzoom` (or push current state)
2. Clone `blitzoom` locally
3. All subsequent work in the new repo

**Status: done.**

---

## Phase 2: Rename files

### 2a: JS/CSS files
```sh
cd docs
for f in bitzoom-*.js bitzoom.js bitzoom.css; do
  mv "$f" "${f/bitzoom/blitzoom}"
done
mv dist/bitzoom.bundle.js dist/blitzoom.bundle.js
```

### 2b: Data files
```sh
mv data/bitzoom-source.edges data/blitzoom-source.edges
mv data/bitzoom-source.nodes data/blitzoom-source.nodes
```

### 2c: Image files
```sh
mv docs/images/bitzoom-1.png docs/images/blitzoom-1.png
mv docs/images/bitzoom-2.png docs/images/blitzoom-2.png
```

**DO NOT run or test yet** — imports are broken until Phase 3.

**Verify:** `find docs/ -name "*bitzoom*"` returns zero hits. `ls docs/blitzoom-*.js docs/blitzoom.js docs/blitzoom.css docs/dist/blitzoom.bundle.js docs/images/blitzoom-*.png docs/data/blitzoom-source.*` lists all expected files.

---

## Phase 3: Update all imports and references

Global find-replace across all files. Order matters — do longer strings first to avoid partial matches.

### Scope — files to search

All steps below apply to these file sets:

- `docs/*.js`, `docs/*.html`
- `tests/*.ts`
- `benchmarks/*.ts`, `benchmarks/*.sh`, `benchmarks/*.py`
- `benchmarks/results/*.txt`, `benchmarks/results/*.md`
- `scripts/*.js`, `scripts/*.ts`
- `deno.json`
- `docs/datasets.json`
- `README.md`, `CLAUDE.md`
- `agent_docs/*.md`

Note: `docs/*.html` includes 12 files — `about.html`, `bz-graph-demo.html`, `bundle-test.html`, `comparison.html`, `example.html`, `gpu-test.html`, `howto.html`, `index.html`, `viewer.html`, `webgl.html`, `webgl-test.html`, `webgpu.html`.

### Step 3a: File/import path references (most critical)

Replace in all files in scope, longest first:
```
bitzoom-gl-renderer  →  blitzoom-gl-renderer
bitzoom-proj-worker  →  blitzoom-proj-worker
bitzoom-pipeline     →  blitzoom-pipeline
bitzoom-renderer     →  blitzoom-renderer
bitzoom-parsers      →  blitzoom-parsers
bitzoom-canvas       →  blitzoom-canvas
bitzoom-colors       →  blitzoom-colors
bitzoom-viewer       →  blitzoom-viewer
bitzoom-worker       →  blitzoom-worker
bitzoom-utils        →  blitzoom-utils
bitzoom-source       →  blitzoom-source
bitzoom-algo         →  blitzoom-algo
bitzoom-gpu          →  blitzoom-gpu
bitzoom-svg          →  blitzoom-svg
bitzoom.js           →  blitzoom.js
bitzoom.css          →  blitzoom.css
bitzoom.bundle       →  blitzoom.bundle
```

**Verify:** `grep -r "bitzoom-" docs/*.js docs/*.html tests/*.ts benchmarks/ scripts/ deno.json` returns zero hits (only `blitzoom-` matches remain).

### Step 3b: Class and function names

Replace in all files in scope, longest first:
```
BitZoomCanvas          →  BlitzoomCanvas
createBitZoomFromGraph →  createBlitzoomFromGraph
createBitZoomView      →  createBlitzoomView
BitZoom                →  Blitzoom
```

Note: the last line (`BitZoom → Blitzoom`) is a catch-all for `class BitZoom`, `new BitZoom(`, `instanceof BitZoom`, display text, comments, etc. It must run AFTER the compound names above.

**Verify:** `grep -r "BitZoom" docs/*.js docs/*.html tests/*.ts` returns zero hits.

### Step 3c: Config files
```
deno.json:
  "src2snap" task:  docs/data/bitzoom-source  →  docs/data/blitzoom-source
  "bundle" task:    docs/bitzoom.js > docs/dist/bitzoom.bundle.js  →  docs/blitzoom.js > docs/dist/blitzoom.bundle.js
```

**Verify:** `grep bitzoom deno.json` returns zero hits.

### Step 3d: Regenerate blitzoom-source dataset

The old `blitzoom-source.edges` and `blitzoom-source.nodes` files contain node IDs derived from the old filenames (e.g., `file:docs/bitzoom-worker.js`). Rather than text-replacing 2000+ occurrences, regenerate from the renamed source:

```sh
deno task src2snap
```

This scans the (now renamed) source files and produces `docs/data/blitzoom-source.edges` and `.nodes` with correct `blitzoom-*` node IDs.

After regeneration, check if presets need updating. The graph topology should be nearly identical (same functions, same calls), but node/edge counts may shift slightly if the scanner picks up anything new. Update presets in:
- `docs/datasets.json` — node count in `desc`, `strengths`, `labelProps`
- `docs/index.html` — inline preset object for `blitzoom-source`
- `docs/about.html` — inline preset object for `blitzoom-source`
- `CLAUDE.md` — dataset table node/edge counts if changed

**Verify:** `grep bitzoom docs/data/blitzoom-source.edges docs/data/blitzoom-source.nodes` returns zero hits. Compare node/edge counts to old values (was 433 nodes, 940 edges per CLAUDE.md) — small differences are expected.

### Step 3e: GitHub repo URLs

Already covered by Step 3b's catch-all `BitZoom → Blitzoom` and the lowercase `bitzoom → blitzoom` in Step 3a, but worth noting explicitly: `github.com/wistrand/bitzoom` appears in ~10 files and becomes `github.com/wistrand/blitzoom`:

- `docs/index.html`, `docs/about.html`, `docs/howto.html`, `docs/comparison.html`
- `docs/webgl.html`, `docs/webgpu.html`
- `docs/blitzoom-svg.js` (SVG export comment)

**Verify:** `grep -r "wistrand/bitzoom" docs/` returns zero hits.

### Step 3f: Remaining lowercase references

After all steps above, sweep for any remaining `bitzoom` (lowercase) in:
- Comments, display text, benchmark results, docs
- `benchmarks/compare-layouts.py` (`parse_bitzoom` function, `--bitzoom` CLI arg)

```
bitzoom  →  blitzoom   (in all remaining files in scope)
```

**Verify:** `grep -ri "bitzoom" docs/ tests/ benchmarks/ scripts/ deno.json CLAUDE.md README.md agent_docs/ --include="*.js" --include="*.ts" --include="*.html" --include="*.css" --include="*.json" --include="*.md" --include="*.sh" --include="*.txt" --include="*.py" | grep -v ".bundle.js"` returns zero hits.

### Step 3g: Image references
```
bitzoom-1.png  →  blitzoom-1.png
bitzoom-2.png  →  blitzoom-2.png
```

Files: `README.md`, any HTML referencing these images.

**Verify:** `grep -r "bitzoom-1\|bitzoom-2" README.md docs/*.html` returns zero hits.

---

## Phase 4: Update documentation

Covered by Phase 3 replacements. This phase is a review pass to confirm:

- `CLAUDE.md` — all references updated, file structure table accurate
- `README.md` — all references updated, image paths correct
- `agent_docs/*.md` — all references updated
- `docs/datasets.json` — "BitZoom Source" → "Blitzoom Source", file paths updated

**Verify:** Read through `CLAUDE.md` and `README.md` manually for coherence. Confirm `datasets.json` parses: `deno eval "console.log(JSON.parse(Deno.readTextFileSync('docs/datasets.json')).length)"`.

---

## Phase 5: Regenerate ground truth

After all renames and content updates are complete:

```sh
deno run --no-check --allow-read --allow-write tests/gen_ground_truth.ts
```

This regenerates `tests/ground-truth/bzsource-kind.tsv` and `bzsource-topo.tsv` with updated `blitzoom-*` node IDs in the data values. The `bzsource-` filename prefix stays (abbreviation of dataset id `bz-source`, not of "bitzoom").

**Verify:** `grep "bitzoom" tests/ground-truth/bzsource-*.tsv` returns zero hits. `diff` old vs new shows only `bitzoom → blitzoom` changes in node ID columns, same row count.

---

## Phase 6: Verify — tests

```sh
deno task test          # 177 pipeline tests
deno task test:gt       # ground truth tests
```

**All tests must pass.** If ground truth tests fail, the data file content update (3d) or regeneration (Phase 5) has an issue.

---

## Phase 7: Verify — manual

```sh
deno task serve
```

Check:
- Viewer loads — header, title, about page all show "Blitzoom"
- Load "Blitzoom Source" dataset from dropdown — nodes render correctly
- Drop a file onto canvas — loads via `parseAny`
- SVG export (press S) — comment says "Generated by Blitzoom"
- URL hash state — `d=` parameter works
- `comparison.html` — all text shows "Blitzoom"
- `bundle-test.html` — bundle loads, `createBlitzoomView` works
- `howto.html` — developer guide references correct filenames

---

## Phase 8: Final audit

```sh
# Should return ZERO hits in code/docs:
grep -ri "bitzoom" docs/ agent_docs/ CLAUDE.md README.md tests/ benchmarks/ scripts/ deno.json \
  --include="*.js" --include="*.ts" --include="*.html" --include="*.css" \
  --include="*.json" --include="*.md" --include="*.sh" --include="*.txt" \
  --include="*.py" \
  | grep -v node_modules | grep -v ".bundle.js"

# Should return ZERO filename hits:
find docs/ scripts/ tests/ benchmarks/ -iname "*bitzoom*"

# Should return ZERO hits in data files:
grep "bitzoom" docs/data/blitzoom-source.edges docs/data/blitzoom-source.nodes

# Should return ZERO hits in ground truth:
grep "bitzoom" tests/ground-truth/*.tsv
```

Any remaining hits are bugs.

---

## Phase 9: Rebuild bundle

```sh
deno task bundle
```

Produces `docs/dist/blitzoom.bundle.js`.

**Verify:** `grep -c "bitzoom" docs/dist/blitzoom.bundle.js` returns 0 (or only occurrences inside minified data if the bundle inlines the SNAP dataset — unlikely).

---

## Phase 10: Push and update GitHub Pages

1. Push to `wistrand/blitzoom`
2. Enable GitHub Pages on the new repo
3. Update old repo README with redirect notice

---

## Risk mitigation

- **Broken imports are the #1 risk.** Phase 3a must be exact — one missed rename and the app won't load. The test suite catches this immediately.
- **Partial string matches.** "bitzoom" inside "blitzoom" won't cause issues since we're replacing, not inserting. But watch for `createBitZoom` matching before `BitZoomCanvas` — do longer strings first.
- **Blitzoom-source dataset** — regenerated via `src2snap` after file renames. Node IDs will naturally use `blitzoom-*` paths. Node/edge counts may shift slightly — check presets in `datasets.json`, `index.html`, `about.html`.
- **deno.json task paths** — easy to miss since they're not import statements. Phase 3c covers explicitly.
- **Ground truth TSV files** contain node IDs from the source graph. Must regenerate AFTER `src2snap` (Phase 3d), otherwise node IDs won't match. Values will differ from old ground truth since the dataset is regenerated, not text-replaced.
- **GitHub URLs** — `github.com/wistrand/bitzoom` in ~10 files. Caught by the blanket replace but verified separately (Phase 3e).
- **Benchmark results** are text-replaced, not regenerated — numeric data is unchanged, only labels and paths updated.
- **compare-layouts.py** has a `parse_bitzoom()` function and `--bitzoom` CLI arg — rename to `parse_blitzoom()` / `--blitzoom`.
- **Bundle** must be rebuilt last (Phase 9) — the old bundle has old filenames baked in.
- **Image files** — `bitzoom-1.png` / `bitzoom-2.png` renamed in Phase 2c; references updated in Phase 3g.
