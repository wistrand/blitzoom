# BlitZoom Data Formats

BlitZoom accepts multiple input formats through `parseAny(text, filenameHint?)` which auto-detects format from content and filename.

## SNAP Text (primary format)

Two-file format, processed via Web Workers:

### .edges file

Tab-delimited, `#` comments. 2 columns (undirected) or 3 columns (with edge type).

```
# My graph
# Nodes: 100 Edges: 250
A	B
B	C	FRIEND
C	D	COLLEAGUE
```

### .nodes file (optional)

Tab-delimited. First comment line defines column names.

```
# NodeId	Label	Group	Score	Department
A	Alice	engineer	95	backend
B	Bob	designer	82	frontend
C	Carol	engineer		backend
```

- Columns 1-3: NodeId, Label, Group (required structure)
- Additional columns become MinHash property groups
- Numeric columns auto-detected (>=80% parseable) and tokenized at 3 resolution levels (coarse/medium/fine)
- Empty fields = undefined (neutral projection, no false clustering)

## CSV / TSV / SSV

Auto-detects delimiter (`,`, `\t`, `;`, `|`). Header row maps columns to roles:

- **id**: columns named `id`, `ID`, `node`, `name`, `key` (first unique column)
- **label**: columns named `label`, `name`, `title`
- **group**: columns named `group`, `class`, `category`, `type`, `cluster`
- Everything else becomes extra property groups

```csv
id,name,group,score,department
A,Alice,engineer,95,backend
B,Bob,designer,82,frontend
```

Handles: quoted fields, escaped quotes, embedded newlines, CRLF, BOM.

## D3 Force JSON

```json
{
  "nodes": [
    {"id": "a", "group": 1, "name": "Alice"},
    {"id": "b", "group": 2, "name": "Bob"}
  ],
  "links": [
    {"source": "a", "target": "b"}
  ]
}
```

- Also accepts `edges` key as alias for `links`
- Falls back to `name` as id (Miserables convention)
- Numeric link endpoints resolved as both string-id matches and array indices
- Extra node properties become property groups

## JGF (JSON Graph Format)

```json
{
  "graph": {
    "nodes": {
      "a": {"label": "Alice", "metadata": {"group": "x"}},
      "b": {"label": "Bob", "metadata": {"group": "y"}}
    },
    "edges": [
      {"source": "a", "target": "b"}
    ]
  }
}
```

Single-graph or multi-graph form. Nodes as array or dict (JGF v1).

## GraphML

```xml
<graphml>
  <key id="d0" for="node" attr.name="group" attr.type="string"/>
  <graph>
    <node id="a"><data key="d0">x</data></node>
    <node id="b"><data key="d0">y</data></node>
    <edge source="a" target="b"/>
  </graph>
</graphml>
```

Two-pass parser with key/attribute registry resolution.

## GEXF

```xml
<gexf>
  <graph>
    <attributes class="node">
      <attribute id="0" title="group" type="string"/>
    </attributes>
    <nodes>
      <node id="a" label="Alice">
        <attvalues><attvalue for="0" value="x"/></attvalues>
      </node>
    </nodes>
    <edges>
      <edge source="a" target="b"/>
    </edges>
  </graph>
</gexf>
```

## Cytoscape JSON

Grouped form:
```json
{
  "elements": {
    "nodes": [{"data": {"id": "a", "group": "x"}}],
    "edges": [{"data": {"source": "a", "target": "b"}}]
  }
}
```

Also supports flat-array form: `{"elements": [{"group": "nodes", "data": {...}}]}`.

## STIX 2.1 Bundle

```json
{
  "type": "bundle",
  "objects": [
    {"type": "attack-pattern", "id": "attack-pattern--1", "name": "Phishing"},
    {"type": "relationship", "source_ref": "...", "target_ref": "..."}
  ]
}
```

Parsed via `parseSTIX`. Extracts platforms, kill chain phases as property groups.

## Detection Logic

`detectFormat(text, filenameHint?)` checks in order:
1. Filename extension (`.edges`, `.nodes`, `.csv`, `.json`, `.graphml`, `.gexf`)
2. Content sniffing: XML tags, JSON structure, tab-delimited with `#` comments
3. Falls back to `unknown`

`parseAny(text, filenameHint?)` dispatches to the correct parser based on `detectFormat`.

All parsers return `{nodes: Map, edges: Array|null, extraPropNames: string[]}` consumable by `runPipelineFromObjects`.
