// imports/ui/theme/ambianceComposition.js
//
// The zone composition contract: resolve the active background + curation
// record + persisted axes into the single layout object every enableAmbiance
// route receives ("a background choice never arrives blank" — defaults fill
// every gap). Pure and zero-import (bare-checkout node --test safe); the
// 'color:' check is duplicated from backgroundValue.js deliberately to keep
// this module dependency-free. Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

const FOCUS_VALUES = ['left', 'center', 'right'];
const SURFACE_VALUES = ['solid', 'glass', 'flat'];
const MODE_VALUES = ['light', 'dark'];

function backgroundKind(background) {
  if (!background || typeof background !== 'string') { return 'none'; }
  if (background.indexOf('color:') === 0) { return 'color'; }
  return 'image';
}

export function resolveComposition(options) {
  const opts = options || {};
  const background = (typeof opts.background === 'string') ? opts.background : '';
  const entry = opts.entry || {};
  const kind = backgroundKind(background);

  const focus = FOCUS_VALUES.indexOf(entry.focus) !== -1 ? entry.focus : 'center';

  let scrim = typeof entry.scrimStrength === 'number' ? entry.scrimStrength : 0.55;
  scrim = Math.min(1, Math.max(0, scrim));

  let pageMode = MODE_VALUES.indexOf(opts.pageMode) !== -1 ? opts.pageMode : null;
  if (!pageMode && MODE_VALUES.indexOf(entry.recommendedPageMode) !== -1) {
    pageMode = entry.recommendedPageMode;
  }
  if (kind === 'none') { pageMode = null; }

  // Precedence: per-route user override (Ctrl+Shift+K) > route-declared
  // baseline (route.defaultSurface) > global cardSurface > 'solid'.
  let cardSurface = SURFACE_VALUES.indexOf(opts.surfaceOverride) !== -1 ? opts.surfaceOverride
    : (SURFACE_VALUES.indexOf(opts.surfaceDefault) !== -1 ? opts.surfaceDefault
      : (SURFACE_VALUES.indexOf(opts.cardSurface) !== -1 ? opts.cardSurface : 'solid'));

  return {
    background: background,
    kind: kind,
    focus: kind === 'image' ? focus : 'center',
    scrimStrength: scrim,
    pageMode: pageMode,
    cardSurface: cardSurface
  };
}
