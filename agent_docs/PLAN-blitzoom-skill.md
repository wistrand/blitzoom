# Plan: BlitZoom Claude Code Skill

## Goal

Create a `/blitzoom` skill that teaches Claude the BlitZoom API — so developers using BlitZoom in their projects get accurate, contextual help without Claude needing to read the source.

## Skill: `/blitzoom` — API Reference

### Location
`docs/skills/blitzoom/SKILL.md`

### Frontmatter
```yaml
---
name: blitzoom
description: BlitZoom graph visualization API. Use when embedding graphs, using addNodes/removeNodes/updateNodes, configuring options, using <bz-graph> web component, or working with BlitZoom's public API.
argument-hint: [topic]
---
```

### Content outline (~400 lines)

1. **Quick start** — minimal `<bz-graph>` embed (3 lines of HTML)
2. **Web component** — `<bz-graph>` attributes, `incremental` mode, `for` binding with `<bz-compass>` and `<bz-controls>`
3. **Canvas API** — `createBlitZoomView`, `createBlitZoomFromGraph`, key options
4. **Incremental updates** — `addNodes`, `removeNodes`, `updateNodes` with examples
5. **Quantization modes** — gaussian (default), rank, norm (for incremental stability)
6. **Strengths & bearings** — `setStrengths`, `setBearing`, `setAlpha`, auto-tune
7. **SVG export** — `exportSVG`, `createSVGView`
8. **Color schemes** — available schemes, `colorBy`, `cycleColorScheme`
9. **Events** — `statechange`, `blend`, `nodesadded`, `nodesremoved`, `nodesupdated`, `ready`
10. **Data formats** — SNAP, CSV, D3 JSON, JGF, GraphML, GEXF, Cytoscape, STIX — with `parseAny` detection
11. **Options reference** — full table of constructor options (in supporting file)

### Supporting files
```
docs/skills/blitzoom/
├── SKILL.md                # Main instructions (<500 lines)
├── options-reference.md    # Full options table with types and defaults
└── data-formats.md         # Detailed format specs and examples
```

---

## Implementation

### Phase 1: Create SKILL.md

Write the main skill file distilled from `docs/howto.html` and `CLAUDE.md`. Focus on:
- Code examples that work (not pseudocode)
- Common patterns first, edge cases in supporting files
- Web component examples preferred over canvas API (simpler for most users)

### Phase 2: Create supporting files

- `options-reference.md` — full options table from howto.html Options Reference section
- `data-formats.md` — format detection, column mapping, SNAP format spec

### Phase 3: Verify

- Skill appears in `What skills are available?`
- `/blitzoom` shows the API reference
- `/blitzoom addNodes` explains incremental API
- Asking "how do I embed a BlitZoom graph?" auto-triggers the skill
- Supporting files load on demand when Claude needs format details or full options

---

## Content sources

| Section       | Source                                                             |
| ------------- | ------------------------------------------------------------------ |
| Quick start   | `docs/howto.html` Getting Started                                  |
| Web component | `docs/howto.html` Web Component section, `CLAUDE.md`               |
| Canvas API    | `docs/howto.html` Embed a View, From JS Objects                    |
| Incremental   | `docs/howto.html` Incremental Updates                              |
| Options       | `docs/howto.html` Options Reference                                |
| Data formats  | `CLAUDE.md` Data Formats, `agent_docs/ARCHITECTURE-data-import.md` |
| Events        | `CLAUDE.md` Key Design Decisions                                   |

---

## Design decisions

- **No `disable-model-invocation`** — skill should auto-trigger when a developer asks about BlitZoom. "/blitzoom" is also available for direct invocation.
- **No `context: fork`** — reference skill, not a task. Runs inline so Claude applies it to the current conversation.
- **No `paths`** — should auto-load in any project that uses BlitZoom, not just the BlitZoom repo itself.
- **No `allowed-tools`** — standard permissions are sufficient.
- **Supporting files** — keep SKILL.md under 500 lines. Detailed tables and format specs in separate files loaded on demand.
