// imports/ui/theme/contrastInk.js
//
// Single-color contrast math — the ambiance AUTO idea applied to one color
// instead of an image (Rec. 709 luminance, same formula as
// ambianceAnalysis.js). Two consumers:
//   - inkForColor(): CustomThemeProvider defaults app-bar TEXT from the
//     resolved bar color when no explicit appBarTextColor(/Dark) exists.
//   - readableAccent()/inverseHueSaturationBrightness(): AmbianceZone keeps
//     accents legible on ambiance pages — a bright accent on a light surface
//     gets its brightness inverted (hue/saturation preserved), so Tron cyan
//     stays cyan but reads on paper-white.
// Pure and zero-import (bare-checkout node --test safe).

// First parseable color token in the string: #rgb / #rrggbb, rgb() / rgba().
// Gradients resolve to their first color stop. Low-alpha colors (< 0.5)
// return null — the effective color depends on an unknown backdrop, so the
// caller should fall back rather than guess.
export function parseFirstColor(value) {
  if (typeof value !== 'string' || !value) { return null; }

  const rgbMatch = value.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([0-9.]+)\s*)?\)/i);
  const hexMatch = value.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i);

  // Take whichever token appears first in the string.
  const rgbIndex = rgbMatch ? value.indexOf(rgbMatch[0]) : -1;
  const hexIndex = hexMatch ? value.indexOf(hexMatch[0]) : -1;

  if (rgbMatch && (hexIndex === -1 || rgbIndex < hexIndex)) {
    const alpha = rgbMatch[4] === undefined ? 1 : parseFloat(rgbMatch[4]);
    if (!(alpha >= 0.5)) { return null; }
    return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
  }
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }
  return null;
}

// Rec. 709 relative luminance, 0..1 (matches ambianceAnalysis.js).
export function relativeLuminance(rgb) {
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

// 'dark' (bright surface → dark text) | 'light' | null (unparseable).
export function inkForColor(value) {
  const rgb = parseFirstColor(value);
  if (!rgb) { return null; }
  return relativeLuminance(rgb) >= 0.5 ? 'dark' : 'light';
}

// ---------------------------------------------------------------------------
// Hue-preserving brightness inversion — "the cyan stays cyan, but readable".

function rgbToHsl(rgb) {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) { return { h: 0, s: 0, l: l }; }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) { h = ((g - b) / d + (g < b ? 6 : 0)); }
  else if (max === g) { h = (b - r) / d + 2; }
  else { h = (r - g) / d + 4; }
  return { h: h * 60, s: s, l: l };
}

function hue2rgb(p, q, t) {
  if (t < 0) { t += 1; }
  if (t > 1) { t -= 1; }
  if (t < 1 / 6) { return p + (q - p) * 6 * t; }
  if (t < 1 / 2) { return q; }
  if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
  return p;
}

function hslToHex(hsl) {
  const h = ((hsl.h % 360) + 360) % 360 / 360;
  const s = Math.min(1, Math.max(0, hsl.s));
  const l = Math.min(1, Math.max(0, hsl.l));
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = function(v) {
    const x = Math.round(v * 255).toString(16);
    return x.length === 1 ? '0' + x : x;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

// Invert a color's brightness while preserving hue and saturation
// (HSL: L' = 1 - L). Bright cyan becomes deep teal-cyan; deep navy becomes
// a pale sky. Unparseable input returns the input unchanged.
export function inverseHueSaturationBrightness(value) {
  const rgb = parseFirstColor(value);
  if (!rgb) { return value; }
  const hsl = rgbToHsl(rgb);
  return hslToHex({ h: hsl.h, s: hsl.s, l: 1 - hsl.l });
}

// Accent legibility guard: invert brightness ONLY when the accent's polarity
// matches the surface it sits on — a bright accent on a light surface (or a
// dark accent on a dark surface) is washed out; opposite-polarity accents
// pass through untouched. Conservative bands so mid-range colors are stable,
// and the inversion is kept only when it genuinely moved luminance away from
// the surface (HSL lightness and Rec. 709 luminance can disagree).
export function readableAccent(value, surfaceMode) {
  const rgb = parseFirstColor(value);
  if (!rgb) { return value; }
  const lum = relativeLuminance(rgb);
  let inverted = null;
  if (surfaceMode === 'light' && lum >= 0.55) { inverted = inverseHueSaturationBrightness(value); }
  else if (surfaceMode === 'dark' && lum <= 0.25) { inverted = inverseHueSaturationBrightness(value); }
  if (!inverted || inverted === value) { return value; }
  const invLum = relativeLuminance(parseFirstColor(inverted));
  if (surfaceMode === 'light' && invLum >= lum) { return value; }
  if (surfaceMode === 'dark' && invLum <= lum) { return value; }
  return inverted;
}
