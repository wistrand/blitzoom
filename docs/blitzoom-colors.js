// blitzoom-colors.js — Color scheme generation for Blitzoom.

export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Lerp between RGB ramp stops at position t in [0,1]
function sampleRamp(ramp, t) {
  t = Math.max(0, Math.min(1, t));
  const idx = t * (ramp.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, ramp.length - 1);
  const f = idx - lo;
  return rgbToHex(
    Math.round(ramp[lo][0] + (ramp[hi][0] - ramp[lo][0]) * f),
    Math.round(ramp[lo][1] + (ramp[hi][1] - ramp[lo][1]) * f),
    Math.round(ramp[lo][2] + (ramp[hi][2] - ramp[lo][2]) * f),
  );
}

// Build a scheme function from a color ramp (array of [r,g,b] stops)
function rampScheme(ramp) {
  return (values) => {
    const c = {};
    const n = values.length;
    for (let i = 0; i < n; i++) c[values[i]] = sampleRamp(ramp, n === 1 ? 0.5 : i / (n - 1));
    return c;
  };
}

// ─── Perceptually uniform ramps (sampled from matplotlib) ─────────────────────

// Ramp stops: darkest values raised to stay visible on dark (#12122a) backgrounds

const VIRIDIS = [
  [72,35,116],[64,67,135],[52,94,141],[41,120,142],
  [32,144,140],[34,167,132],[68,190,112],[121,209,81],[189,222,38],[253,231,37],
];

const PLASMA = [
  [126,3,167],[168,34,150],[203,70,121],
  [229,107,93],[248,148,65],[253,195,40],[239,248,33],
];

const INFERNO = [
  [106,23,110],[147,38,103],
  [188,55,84],[221,81,58],[243,118,27],[252,165,10],[246,215,70],[252,255,164],
];

const THERMAL = [
  [80,50,155],[120,40,160],
  [165,30,140],[200,35,100],[225,60,60],[240,100,30],[250,155,15],[255,220,50],
];

const GREENS = [
  [45,100,55],[60,135,65],[80,165,80],[100,190,100],
  [130,210,130],[170,228,160],[210,243,200],
];

const REDS = [
  [140,30,30],[175,40,35],[210,55,40],
  [230,80,50],[240,120,75],[248,165,110],[252,210,165],
];

const DIVERGING = [
  [69,117,180],[116,173,209],[171,217,233],[224,243,248],
  [255,255,191],[254,224,144],[253,174,97],[244,109,67],[215,48,39],
];

const GRAYSCALE = [
  [90,90,100],[120,120,130],[150,150,160],
  [180,180,190],[210,210,218],[235,235,242],
];

// ─── Scheme registry ──────────────────────────────────────────────────────────

export const SCHEME_VIVID     = 0;
export const SCHEME_VIRIDIS   = 1;
export const SCHEME_PLASMA    = 2;
export const SCHEME_INFERNO   = 3;
export const SCHEME_THERMAL   = 4;
export const SCHEME_GRAYSCALE = 5;
export const SCHEME_DIVERGING = 6;
export const SCHEME_GREENS    = 7;
export const SCHEME_REDS      = 8;

export const COLOR_SCHEME_NAMES = [
  'vivid', 'viridis', 'plasma', 'inferno', 'thermal',
  'grayscale', 'diverging', 'greens', 'reds',
];

export const COLOR_SCHEMES = [
  // 0: vivid (default) — golden angle, high saturation
  (values) => {
    const c = {}; const golden = 137.508;
    for (let i = 0; i < values.length; i++) c[values[i]] = hslToHex((i * golden) % 360, 65, 62);
    return c;
  },
  // 1-8: ramp-based schemes
  rampScheme(VIRIDIS),
  rampScheme(PLASMA),
  rampScheme(INFERNO),
  rampScheme(THERMAL),
  rampScheme(GRAYSCALE),
  rampScheme(DIVERGING),
  rampScheme(GREENS),
  rampScheme(REDS),
];

export function generateGroupColors(values, scheme = 0) {
  return COLOR_SCHEMES[scheme % COLOR_SCHEMES.length](values);
}
