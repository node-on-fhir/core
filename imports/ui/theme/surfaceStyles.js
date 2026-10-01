// imports/ui/theme/surfaceStyles.js
//
// Shared card-surface styles for the three states (solid | glass | flat) —
// the DirectoryConsole overlay recipe generalized so AmbianceZone's
// MuiCard/MuiPaper overrides and Meteor.StyledCard share one source of
// truth. Pure and zero-import (bare-checkout node --test safe); hexAlpha is
// a local helper so we don't pull in @mui utilities. Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

export const SURFACE_TRANSITION =
  'background-color 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, opacity 0.35s ease';

export function hexAlpha(hex, alpha) {
  if (typeof hex !== 'string' || hex[0] !== '#') { return hex; }
  let h = hex.slice(1);
  if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) { return hex; }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}

export function buildSurfaceStyles(options) {
  const opts = options || {};
  const surface = opts.surface;

  if (surface === 'glass') {
    return {
      root: {
        backgroundColor: hexAlpha(opts.paperColor, 0.72),
        backgroundImage: 'none',
        backdropFilter: 'blur(8px)',
        border: '1px solid ' + (opts.dividerColor || 'rgba(128,128,128,0.3)'),
        boxShadow: 'none',
        transition: SURFACE_TRANSITION
      }
    };
  }
  if (surface === 'flat') {
    return {
      root: {
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        border: 'none',
        boxShadow: 'none',
        transition: SURFACE_TRANSITION
      }
    };
  }
  return { root: { transition: SURFACE_TRANSITION } };
}
