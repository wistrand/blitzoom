// blitzoom.js — Public API entrypoint for BlitZoom.
// Import this file (unbundled) or dist/blitzoom.bundle.js (minified single file).

// Core class
export { BlitZoomCanvas } from './blitzoom-canvas.js';
// Factories
export { createBlitZoomView, createBlitZoomFromGraph } from './blitzoom-factory.js';

// Web component (<bz-graph> custom element, auto-registers on import)
export { BzGraph } from './bz-graph.js';

// Utilities
export { autoTuneStrengths, autoTuneStrengths as autoTuneWeights, autoTuneBearings } from './blitzoom-utils.js';
export { exportSVG, createSVGView } from './blitzoom-svg.js';

// Feature probes
export { isWebGL2Available } from './blitzoom-gl-renderer.js';
export { initGPU } from './blitzoom-gpu.js';

// Color schemes
export {
  generateGroupColors,
  SCHEME_VIVID, SCHEME_VIRIDIS, SCHEME_PLASMA, SCHEME_INFERNO, SCHEME_THERMAL,
  SCHEME_GRAYSCALE, SCHEME_DIVERGING, SCHEME_GREENS, SCHEME_REDS,
  COLOR_SCHEME_NAMES,
} from './blitzoom-colors.js';
