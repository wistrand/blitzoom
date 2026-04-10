# Compass: Radial Strength/Bearing Control

`<bz-compass>` is a web component that provides a radial 2D control for adjusting property strengths and bearings simultaneously. Each property group is a spoke radiating from a center point — radial distance = strength, angular offset from home = bearing.

Implemented in [bz-compass.js](../docs/bz-compass.js). ~500 lines, no external dependencies.

## Visual design

```
            group ●───── (strength 8, bearing +20°)
           /
          /  home angle 90°
         /
center ·─────────── alignment (strength 5, bearing 0°)
         \
          \  home angle 210°
           \
            kind ●── (strength 3, bearing -15°)
```

- **Spokes**: faint dashed lines from center to outer ring at evenly-spaced home angles (360°/N, first spoke at 12 o'clock)
- **Concentric rings**: 4 rings at 25%/50%/75%/100% of max strength, scaled with `FLOOR_FRAC = 0.25` so strength 0 sits at 25% radius (not collapsed to center)
- **Floor ring**: dashed circle at 25% radius marking the strength = 0 boundary
- **Handles**: filled circles colored per group. Active/focused handles get an outline
- **Polygon fill**: semi-transparent polygon connecting handles (≥3 groups)
- **Tether lines**: dashed line from each handle back to the outer ring at its home angle (bearing = 0 guide), only shown when bearing ≠ 0
- **Value tooltip**: `strength / bearing°` shown on hover/drag
- **Toolbar**: "0" (reset all) and "A" (auto-tune) buttons, top-right corner, fade in on hover
- **Help overlay**: "?" button in panel titlebar toggles keyboard shortcut reference

## Interaction

| Gesture             | Effect                                        |
| ------------------- | --------------------------------------------- |
| Drag handle         | Set strength + bearing from polar coordinates |
| Shift+drag          | Strength only (bearing locked)                |
| Alt+drag            | Bearing only (strength locked)                |
| Double-click handle | Reset to strength 0, bearing 0                |
| Right-click handle  | Reset bearing only (keep strength)            |
| Tab / Shift+Tab     | Cycle focus between handles                   |
| ↑↓                  | Strength ±1 (Shift ±0.5)                      |
| ←→                  | Bearing ±15° (Shift ±5°)                      |
| Home / 0            | Reset handle                                  |
| Enter               | Toggle colorBy for focused group              |
| 0 button            | Zero all strengths and bearings               |
| A button            | Start/stop auto-tune                          |

Dead zones: ±5° angular snap to 0 bearing near home angle. 8% radial snap to 0 strength near center (within the floor ring).

## Web component API

### Attributes

| Attribute      | Type   | Default | Description                                          |
| -------------- | ------ | ------- | ---------------------------------------------------- |
| `for`          | string | —       | ID of a `<bz-graph>` to bind to (declarative, no JS) |
| `max-strength` | number | 10      | Maximum strength value                               |

### Properties

- `.groups` — get/set array of `{name, color, strength, bearing}`
- `.maxStrength` — get/set max strength value

### Methods

- `update(name, strength, bearing)` — update one group
- `updateAll(arr)` — bulk update all groups
- `toSVG(opts)` — returns SVG string of current state

### Events

| Event      | Detail                      | When                        |
| ---------- | --------------------------- | --------------------------- |
| `input`    | `{name, strength, bearing}` | Continuous during drag      |
| `change`   | `{name, strength, bearing}` | On drag end                 |
| `colorby`  | `{name}`                    | Enter key on focused handle |
| `autotune` | —                           | A button clicked            |

## Declarative binding (`for` attribute)

```html
<bz-graph id="myGraph" edges="data/karate.edges" nodes="data/karate.nodes"
          level="3" legend strengths="group:5"></bz-graph>
<bz-compass for="myGraph"></bz-compass>
```

No JavaScript needed. The compass:

1. Listens for the `ready` event on the target `<bz-graph>`
2. Pulls groups, strengths, bearings, and colors from `el.view`
3. Wires `input` events → updates `view.propStrengths` / `view.propBearings`, rAF-gated re-blend
4. Monkey-patches `view.render` to detect `_blendGen` changes and sync back (with equality check to prevent loops)
5. Wires `autotune` event → dynamically imports `autoTuneStrengths` + `autoTuneBearings`, runs them

Cleanup: on disconnect or `for` change, restores original `view.render`, removes event listeners.

## Viewer integration

In the viewer ([blitzoom-viewer.js](../docs/blitzoom-viewer.js)), the compass lives in a floating draggable panel:

- **Toggle**: toolbar button (◎) or R key
- **Panel**: `#compassPanel` div with `.compass-titlebar` (drag handle) + `<bz-compass>` element
- **CSS**: `.compass-panel` — fixed position, z-index 12, `resize: both`, min 180×200
- **Dragging**: mousedown on titlebar + mousemove/mouseup on window (touch-compatible)
- **Close**: Escape key, close button, or toggle
- **Hidden on loader screen**: `_toggleCompass(false)` called in `showLoaderScreen()`

### Sync architecture (viewer)

The canvas dispatches a `statechange` event at the start of every `_blend()` call. A single listener syncs all UI:

```
Any state change (slider drag, compass drag, autotune, preset, dataset load)
  ↓ modifies v.propStrengths / v.propBearings
  ↓ triggers _blend()
  ↓ statechange event fires (before blend work)
  ↓ listener calls _syncControls() + _syncCompass()
  ↓ <bz-controls> and <bz-compass> update via updateAll()
```

Input flows the other direction too — compass and controls fire `input`/`change` events which set canvas state and schedule a rebuild. The `statechange` from the resulting blend syncs all other UI components.

The A button in the compass triggers `autoTuneBtn.click()` in the viewer, reusing the existing tune start/stop toggle.

## SVG export

`toSVG(opts)` returns an SVG `<g>` element with all visual components (rings, spokes, labels, polygon, tether lines, handles with tooltips, center dot). Used by `exportSVG` when the compass panel is open — positioned/sized to match the on-screen panel via `_compassSVGOpts()`.

## Accessibility

- `role="application"` on canvas with descriptive `aria-label`
- `aria-live="assertive"` region announces handle name + values on focus change and value change
- Tab cycles handles, arrow keys adjust values
- All pointer interactions have keyboard equivalents
- Focus ring on active handle
- `.nonzero` visual state is non-color-only (border width + opacity)

## File structure

| File                                             | Role                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| [bz-compass.js](../docs/bz-compass.js)           | Web component — rendering, interaction, SVG export, `for` binding |
| [blitzoom-viewer.js](../docs/blitzoom-viewer.js) | Panel toggle, drag, sync wiring, A button integration             |
| [blitzoom.css](../docs/blitzoom.css)             | `.compass-panel`, `.compass-titlebar`, `.compass-close` styles    |
| [viewer.html](../docs/viewer.html)               | Panel markup, toolbar button, script import                       |
| [bz-graph-demo.html](../docs/demo/bz-graph-demo.html) | Live examples of declarative `for` binding                   |
