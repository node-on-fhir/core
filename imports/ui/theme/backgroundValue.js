// imports/ui/theme/backgroundValue.js
//
// Pure helpers for the extended background axis: an ambiance background is
// either an image path ('/backgrounds/ambiance/Zen.jpg') or a solid color
// stored as a 'color:'-prefixed string ('color:#a67b5b') on the SAME
// persistence axis (themePersistence backgroundImagePath). Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md
// Zero imports — bare-checkout node --test safe.

export const COLOR_BACKGROUND_PREFIX = 'color:';

export function isColorBackground(value) {
  return typeof value === 'string' && value.indexOf(COLOR_BACKGROUND_PREFIX) === 0;
}

export function colorFromBackground(value) {
  if (!isColorBackground(value)) { return null; }
  return value.slice(COLOR_BACKGROUND_PREFIX.length);
}

export function makeColorBackground(hex) {
  return COLOR_BACKGROUND_PREFIX + hex;
}
