// imports/ui/themeAlgorithms.js
//
// Pure color math for the Theming Studio (spec:
// fable/superpowers/specs/2026-09-03-theming-studio-design.md; formulas from
// workzone/design_handoff_theming_studio/README.md §Behavior & algorithms).
// ZERO imports — must load under bare `node --test` and the Meteor client.
// App code should import these via themePresets.js re-exports.

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function isValidHex(value) {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

export function normalizeHex(value) {
  if (!isValidHex(value)) { return null; }
  let hex = value.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map(function(c) { return c + c; }).join('');
  }
  return '#' + hex.toLowerCase();
}

export function hexToRgb(value) {
  const hex = normalizeHex(value);
  if (!hex) { return null; }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

export function rgbToHex(r, g, b) {
  function channel(v) {
    return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  }
  return '#' + channel(r) + channel(g) + channel(b);
}

// Accepts '#hex' or 'rgb()/rgba()' strings; anything else → fallback.
export function cssColorToHex(value, fallback) {
  if (isValidHex(value)) { return normalizeHex(value); }
  if (typeof value === 'string') {
    const m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) { return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3])); }
  }
  return fallback === undefined ? null : fallback;
}

// h in [0,360), s/l in [0,100]
export function hexToHsl(value) {
  const rgb = hexToRgb(value);
  if (!rgb) { return null; }
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) { return { h: 0, s: 0, l: l * 100 }; }
  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h;
  if (max === r) { h = (g - b) / delta + (g < b ? 6 : 0); }
  else if (max === g) { h = (b - r) / delta + 2; }
  else { h = (r - g) / delta + 4; }
  return { h: h * 60, s: s * 100, l: l * 100 };
}

export function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const lig = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

// Linear RGB mix; weight = share of hexB in [0,1]. Used by the miniature's
// patient strip (mix(appBar, paper, .5) dark / mix(appBar, #fff, .12) light).
export function mixHex(hexA, hexB, weight) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) { return normalizeHex(hexA) || normalizeHex(hexB); }
  const w = clamp(weight, 0, 1);
  return rgbToHex(a.r + (b.r - a.r) * w, a.g + (b.g - a.g) * w, a.b + (b.b - a.b) * w);
}

// WCAG 2.x relative luminance + contrast ratio.
export function relativeLuminance(hex) {
  const rgb = hexToRgb(cssColorToHex(hex, '#000000'));
  if (!rgb) { return 0; }
  const parts = [rgb.r, rgb.g, rgb.b].map(function(v) {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
}

export function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---- Draft-level operations -------------------------------------------------
// Each takes a draft-shaped object (see themeDraft.js DEFAULT_DRAFT), reads
// only the fields it needs, and returns ONLY the fields it changes.

// Keep primary S/L, rotate hue; rotate secondary by its existing offset; if
// appBarTextDark is linked to primary, keep them linked.
export function setHue(draft, hue) {
  const primary = hexToHsl(cssColorToHex(draft.primary, null));
  if (!primary) { return {}; }
  const next = { primary: hslToHex(hue, primary.s, primary.l) };
  const secondary = hexToHsl(cssColorToHex(draft.secondary, null));
  if (secondary) {
    const offset = secondary.h - primary.h;
    next.secondary = hslToHex(hue + offset, secondary.s, secondary.l);
  }
  if (normalizeHex(cssColorToHex(draft.appBarTextDark, null)) === normalizeHex(cssColorToHex(draft.primary, null))) {
    next.appBarTextDark = next.primary;
  }
  return next;
}

// Primary at new saturation; keep linked app-bar text.
export function setSaturation(draft, sat) {
  const primary = hexToHsl(cssColorToHex(draft.primary, null));
  if (!primary) { return {}; }
  const next = { primary: hslToHex(primary.h, sat, primary.l) };
  if (normalizeHex(cssColorToHex(draft.appBarTextDark, null)) === normalizeHex(cssColorToHex(draft.primary, null))) {
    next.appBarTextDark = next.primary;
  }
  return next;
}

// With S=clamp(s,45,85), L=clamp(l,45,65): secondary = hue+35;
// success = hsl(140, S*.8, L*.85); info = hsl(205,S,L); warning = hsl(38,S,L);
// error = hsl(352,S,L*.9).
export function generateFromAccent(draft) {
  const accent = hexToHsl(cssColorToHex(draft.primary, null));
  if (!accent) { return {}; }
  const S = clamp(accent.s, 45, 85);
  const L = clamp(accent.l, 45, 65);
  return {
    secondary: hslToHex(accent.h + 35, S, L),
    success: hslToHex(140, S * 0.8, L * 0.85),
    info: hslToHex(205, S, L),
    warning: hslToHex(38, S, L),
    error: hslToHex(352, S, L * 0.9)
  };
}

// primary S=8; secondary S=6, L*0.75.
export function makeMono(draft) {
  const primary = hexToHsl(cssColorToHex(draft.primary, null));
  if (!primary) { return {}; }
  const next = { primary: hslToHex(primary.h, 8, primary.l) };
  const secondary = hexToHsl(cssColorToHex(draft.secondary, null));
  if (secondary) {
    next.secondary = hslToHex(secondary.h, 6, secondary.l * 0.75);
  }
  return next;
}

// sat=min(S,30): bgDark=hsl(h, sat*.6, 4%), paperDark=hsl(h, sat*.7, 8%),
// appBarDark=hsl(h, sat*.7, 6%), appBarTextDark=primary.
export function deriveDark(draft) {
  const primary = hexToHsl(cssColorToHex(draft.primary, null));
  if (!primary) { return {}; }
  const sat = Math.min(primary.s, 30);
  return {
    bgDark: hslToHex(primary.h, sat * 0.6, 4),
    paperDark: hslToHex(primary.h, sat * 0.7, 8),
    appBarDark: hslToHex(primary.h, sat * 0.7, 6),
    appBarTextDark: normalizeHex(cssColorToHex(draft.primary, null))
  };
}

// sat=min(S,40): bgLight=hsl(h, sat*.5, 97%), paperLight=#fff,
// appBarLight=hsl(h, min(S,55), min(L,40)), appBarTextLight=#fff.
export function deriveLight(draft) {
  const primary = hexToHsl(cssColorToHex(draft.primary, null));
  if (!primary) { return {}; }
  const sat = Math.min(primary.s, 40);
  return {
    bgLight: hslToHex(primary.h, sat * 0.5, 97),
    paperLight: '#ffffff',
    appBarLight: hslToHex(primary.h, Math.min(primary.s, 55), Math.min(primary.l, 40)),
    appBarTextLight: '#ffffff'
  };
}

// 5 steps: hsl(h, max(S*(1-i*.12), 8), min(L+9i, 90))
export function nivoAuto(primaryCss) {
  const primary = hexToHsl(cssColorToHex(primaryCss, '#9e9e9e'));
  const steps = [];
  for (let i = 0; i < 5; i++) {
    steps.push(hslToHex(primary.h, Math.max(primary.s * (1 - i * 0.12), 8), Math.min(primary.l + 9 * i, 90)));
  }
  return steps;
}

// Representative 5-color strips for the named Nivo schemes (used by the
// Charts group strip and the miniature's biomarker bars).
export const NIVO_SCHEME_SWATCHES = {
  red_grey: ['#b2182b', '#d6604d', '#f4a582', '#bababa', '#878787'],
  blues:    ['#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef'],
  greens:   ['#238b45', '#41ab5d', '#74c476', '#a1d99b', '#c7e9c0'],
  purples:  ['#6a51a3', '#807dba', '#9e9ac8', '#bcbddc', '#dadaeb'],
  oranges:  ['#d94801', '#f16913', '#fd8d3c', '#fdae6b', '#fdd0a2']
};
