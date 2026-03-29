# Auto-Tune: Architecture and Implementation

Heuristic optimizer for BitZoom weight/alpha/quant parameters. Implemented in
[bitzoom-utils.js](../docs/bitzoom-utils.js). Exploits the O(n) blend+quantize
cost to evaluate many configurations and find a well-structured layout.

## Objective function

**spread x clumpiness** at an adaptive grid level.

- **Spread** = occupied cells / total cells. Penalizes collapse.
- **Clumpiness** = coefficient of variation of per-cell node counts. Penalizes
  uniform scatter (all cells equal) and rewards clusters with gaps.

Computation: O(n) per evaluation. Count cell occupancy via Map on shifted gx/gy.

### Adaptive grid level

The grid level scales with dataset size so the metric has meaningful resolution:

```
level = clamp(round(log2(n) - 2), 3, 7)
```

| Nodes | Level | Grid     | Cells |
| ----: | ----: | -------- | ----: |
|    34 |     3 | 8x8      |    64 |
| 1,000 |     5 | 32x32    | 1,024 |
| 5,000 |     5 | 32x32    | 1,024 |
|  367K |     7 | 128x128  | 16,384 |

## Tunable groups

Only semantically meaningful property groups are tuned: `group` and extra properties
from the `.nodes` file.

**Always excluded:** `label` (too high cardinality), `structure` (degree buckets),
`neighbors` (auto-generated). These produce high spread/CV scores but meaningless
layouts.

**Conditionally included:** `edgetype` is tuned only when it has >2 distinct values
(checked via early-exit scan). Datasets like Epstein (5+ edge types) get it tuned;
datasets with one or two types don't.

### Edge-only detection

Before starting the search, the optimizer scans tunable groups for distinct values.
If all have <=1 distinct value (e.g., all nodes have group='unknown'), weight search
is skipped entirely. Only alpha and quant are tuned. This avoids wasting blends on
meaningless property configurations.

## Search strategy

### Phase 1: Preset scan

Evaluate preset weight configurations crossed with alpha values and quant modes:
- **Balanced**: all tunable groups at weight 3
- **Solo**: each tunable group at weight 8 (others at 0)
- **Interaction**: top 2 solo winners combined at weight 5 each

Crossed with alpha = {0, 0.25, 0.5, 0.75, 1.0} and quant = {rank, gaussian}.
The interaction preset catches common two-group combinations that coordinate
descent alone would miss.

### Phase 2: Coordinate descent (3 rounds)

From the best preset, optimize one parameter at a time:
1. Sweep each tunable group's weight over {0, 3, 8, 10}.
2. Sweep alpha over {0, 0.25, 0.5, 0.75, 1.0}.
3. For each blend, try both quant modes (quant-only re-quantize is cheap).
4. Early exit if no improvement in a round.

### Blend/quantize separation

Each `blendAndScore` call blends once (expensive: 5 passes x O(n+E)), then
sweeps quant modes by re-quantizing only (O(n) gaussian or O(n log n) rank).
This halves the blend count when testing both quant modes.

## Label auto-selection

After optimization, the result includes recommended `labelProps`:

1. **Primary**: the dominant weight group (highest tuned weight). Labels match
   what the layout clusters by.
2. **Secondary**: `label` (node name) included when its cardinality is moderate
   (>1 and <=80% of nodes). High cardinality means every supernode label is
   unique (not useful for pattern recognition). Low cardinality means every
   label is the same.

Explicit `labelProps` in opts take precedence over auto-tuned values.

## Async execution

The optimizer is `async`. It yields to the browser via `requestAnimationFrame`
when >50ms has elapsed since the last yield. This keeps the UI responsive during
optimization. Phase boundaries always yield for progress updates.

### Stopping

- **AbortSignal**: pass `signal` in opts. Checked at every yield point.
- **Timeout**: pass `timeout` in ms (default: 20000). Checked alongside signal.
- **Viewer button**: toggles between "Auto" (start) and "Stop" (abort).

On abort or timeout, the optimizer returns the best result found so far.

## API

```javascript
import { autoTuneWeights } from './bitzoom-utils.js';

const result = await autoTuneWeights(nodes, groupNames, adjList, nodeIndexFull, {
  weights: true,      // tune property weights
  alpha: true,        // tune topology weight
  quant: true,        // tune quantization mode
  signal: controller.signal,  // AbortSignal (optional)
  timeout: 20000,     // max ms (default 20000, 0 = no limit)
  onProgress(info) {  // { phase, step, total, score }
    console.log(`${info.phase} ${info.step}/${info.total}`);
  },
});
// result: { weights, alpha, quantMode, labelProps, score, blends, quants, timeMs }
```

## Integration

### Embedded (createBitZoomView)

```javascript
const view = createBitZoomView(canvas, edgesText, nodesText, {
  autoTune: { weights: true, alpha: true, quant: true },
});
```

Returns `BitZoomCanvas` synchronously with default weights. The optimizer runs
async in the background, shows progress overlay on the canvas, and re-renders
with tuned parameters (including label props) when done. Explicit `weights`,
`smoothAlpha`, `quantMode`, `labelProps` in opts take precedence.

### Viewer

"Auto" button in the toolbar. Click to start (button shows "Stop"), click again
to abort and apply best-so-far. Progress displayed as overlay on the canvas.
After completion, weight sliders, alpha slider, quant button, and label
checkboxes sync to reflect the tuned values.

## Performance

Each evaluation = `unifiedBlend` (5 passes x (n+E)) + quantize + score.

| Dataset    | Nodes | Edges  | Per eval | Typical total |
| ---------- | ----: | -----: | -------: | ------------: |
| BZ Source  |   433 |    940 |   ~0.2ms |        ~100ms |
| Email-EU   | 1,005 | 25,571 |   ~0.5ms |        ~250ms |
| Synth Pkg  | 1,868 |  4,044 |   ~0.8ms |        ~400ms |
| MITRE      | 4,736 | 25,856 |   ~2.0ms |        ~800ms |
| Facebook   | 4,039 | 88,234 |   ~3.0ms |       ~1200ms |

## Limitations

- Optimizes for visual structure (spread x clumpiness), not semantic meaning.
- Cannot know which properties the user cares about.
- Does not measure topology preservation (TopoNbrP) or property-similarity
  preservation (PropNbrP). These require O(n^2) computation.
- Coordinate descent can miss weight interactions beyond the top-2 combination.
- Excluded infrastructure groups may occasionally contain useful signal.
- Edge-only datasets get minimal tuning (alpha + quant only).
