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

**Unchanged:** `bz-graph.js`, `bz-compass.js`, `bz-controls.js`, `<bz-graph>`, `<bz-compass>`, `<bz-controls>`, `.bz-*` CSS classes.

---

## Phase 1: Fork repo

1. Fork `wistrand/bitzoom` → `wistrand/blitzoom` (or push current state)
2. Clone `blitzoom` locally
3. All subsequent work in the new repo

---

## Phase 2: Rename JS/CSS files

Rename all 16 `bitzoom-*` files + `bitzoom.js` + `bitzoom.css` + bundle.

```sh
cd docs
for f in bitzoom-*.js bitzoom.js bitzoom.css; do
  mv "$f" "${f/bitzoom/blitzoom}"
done
mv dist/bitzoom.bundle.js dist/blitzoom.bundle.js
```

Data files:
```sh
mv data/bitzoom-source.edges data/blitzoom-source.edges
mv data/bitzoom-source.nodes data/blitzoom-source.nodes
```

**DO NOT run or test yet** — imports are broken until Phase 3.

---

## Phase 3: Update all imports and references

Global find-replace across all files. Order matters — do longer strings first to avoid partial matches.

**Step 3a: JS import paths** (most critical)
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
bitzoom-algo         →  blitzoom-algo
bitzoom-gpu          →  blitzoom-gpu
bitzoom-svg          →  blitzoom-svg
bitzoom.js           →  blitzoom.js
bitzoom.css          →  blitzoom.css
bitzoom.bundle       →  blitzoom.bundle
bitzoom-source       →  blitzoom-source
```

Files to search: `docs/*.js`, `docs/*.html`, `tests/*.ts`, `benchmarks/*.ts`, `benchmarks/*.sh`, `scripts/*.js`, `scripts/*.ts`.

**Step 3b: Class and function names**
```
BitZoomCanvas       →  BlitzoomCanvas
createBitZoomView   →  createBlitzoomView
createBitZoomFromGraph → createBlitzoomFromGraph
class BitZoom        →  class Blitzoom
new BitZoom(         →  new Blitzoom(
```

Files: `docs/blitzoom-canvas.js`, `docs/blitzoom-viewer.js`, `docs/blitzoom.js`, `docs/blitzoom-svg.js`, `docs/blitzoom-gl-renderer.js`, all HTML files, all test files.

**Step 3c: Remaining string references**
```
BitZoom  →  Blitzoom   (display text in HTML, comments, docs)
bitzoom  →  blitzoom   (lowercase in comments, data paths)
```

Files: everything. Be careful with this step — review diffs.

---

## Phase 4: Update documentation

- `CLAUDE.md` — all references
- `README.md` — all references
- `agent_docs/*.md` — all references
- `docs/datasets.json` — "BitZoom Source" → "Blitzoom Source", file paths
- `tmp/show-hn.txt` — project name

---

## Phase 5: Verify

```sh
deno task test          # 177 pipeline tests
deno task test:gt       # 7 ground truth tests
deno test --unstable-webgpu --no-check --allow-read tests/gpu_blend_test.ts
```

Manual:
```sh
deno task serve
# Open viewer — header, title, about page all show "Blitzoom"
# Load each dataset
# Test canvas drop
```

---

## Phase 6: Final audit

```sh
# Should return ZERO hits:
grep -r "BitZoom\|bitzoom" docs/ agent_docs/ CLAUDE.md README.md tests/ benchmarks/ scripts/ \
  --include="*.js" --include="*.ts" --include="*.html" --include="*.css" \
  --include="*.json" --include="*.md" --include="*.sh" --include="*.txt" \
  | grep -v node_modules | grep -v ".bundle.js"
```

Any remaining hits are bugs.

---

## Phase 7: Rebuild bundle

```sh
deno task bundle
```

Produces `docs/dist/blitzoom.bundle.js`.

---

## Phase 8: Push and update GitHub Pages

1. Push to `wistrand/blitzoom`
2. Enable GitHub Pages on the new repo
3. Update old repo README with redirect notice
4. Update `tmp/show-hn.txt` URL

---

## Risk mitigation

- **Broken imports are the #1 risk.** Phase 3a must be exact — one missed rename and the app won't load. The test suite catches this immediately.
- **Partial string matches.** "bitzoom" inside "blitzoom" won't cause issues since we're replacing, not inserting. But watch for `createBitZoom` matching before `BitZoomCanvas` — do longer strings first.
- **Ground truth files** reference `bitzoom-source` in test configs — already removed those tests, but verify no stale references remain.
- **Bundle** must be rebuilt after rename — the old bundle has old filenames baked in.
