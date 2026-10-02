// imports/ui/profile/profileVars.js
//
// Theme seam for the My Profile page (Nocturne design handoff). Per the
// apply-advanced-theming procedure, buildProfileVars(theme) is the ONLY place
// the page derives color from the live MUI theme — every component below the
// page root consumes var(--pf-*) (+ color-mix for tints) and stays
// theme-agnostic. PROFILE_STATIC_CSS carries structure that never changes with
// the theme (rules, transitions, media queries, print).
//
// Under the Nocturne preset the derived values land on (or imperceptibly near)
// the handoff token sheet; under Limestone/Tron/Vaporwave/light they re-derive
// from that palette so the page stays legible everywhere.

import { alpha, darken, lighten } from '@mui/material/styles';

// Object form of the token sheet — the single source of truth. Components
// that must render OUTSIDE the .profile-page scope (e.g. PatientCard's
// profile layout on /patient-chart) apply this map via sx on their root so
// they carry their own vars; inside /my-profile it re-declares identical
// values, harmlessly.
export function buildProfileVarMap(theme) {
  const p = theme.palette;
  const dark = p.mode === 'dark';
  // "Deeper than the surface" heads toward the canvas in both modes.
  const sink = dark ? darken : lighten;
  const raise = dark ? lighten : darken;

  return {
    '--pf-canvas':      p.background.default,
    '--pf-surface':     p.background.paper,
    '--pf-well':        sink(p.background.paper, 0.25),
    '--pf-ink':         p.text.primary,
    '--pf-ink-mid':     p.text.secondary,
    '--pf-ink-dim':     p.text.disabled,
    '--pf-ink-faint':   alpha(p.text.primary, 0.38),
    '--pf-line':        alpha(p.text.primary, 0.16),
    '--pf-line-soft':   alpha(p.text.primary, 0.08),
    '--pf-ring':        alpha(p.text.primary, 0.16),
    '--pf-track':       alpha(p.text.primary, 0.12),
    '--pf-accent':      p.primary.main,
    '--pf-accent-hi':   raise(p.primary.main, 0.45),
    '--pf-accent-text': raise(p.primary.main, 0.78),
    '--pf-accent-deep': sink(p.primary.main, 0.35),
    '--pf-accent-chip': dark ? darken(p.primary.main, 0.55) : lighten(p.primary.main, 0.80),
    '--pf-accent-well': dark ? darken(p.primary.main, 0.70) : lighten(p.primary.main, 0.90),
    '--pf-accent-tint': alpha(p.primary.main, 0.14),
    '--pf-mono': 'ui-monospace, Menlo, monospace'
  };
}

export function buildProfileVars(theme) {
  const vars = buildProfileVarMap(theme);
  const body = Object.keys(vars).map(function(name) {
    return `  ${name}: ${vars[name]};`;
  }).join('\n');
  return `.profile-page {\n${body}\n}`;
}

export const PROFILE_STATIC_CSS = `
/* Animated conic strength ring — registered so the percentage transitions. */
@property --pf-ring-pct {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

.profile-page {
  height: 100%;
  overflow: auto;
}

/* ── Page grids ──────────────────────────────────────────────────────── */
/* Scroll mode: the card stack is a centered container (max 1200px); the
   rails float in the side gutters, hugging the container edges. Grid mode
   stays full-width. */
.profile-page-grid {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(0, 1200px) minmax(200px, 1fr);
  column-gap: 24px;
  padding: 22px 28px 36px;
}
.profile-page-grid--empty {           /* 1g: centered main + right rail only */
  grid-template-columns: minmax(200px, 1fr) minmax(0, 1200px) minmax(200px, 1fr);
}
.profile-page-grid--empty .pf-main { grid-column: 2; }
.profile-page-grid--empty .pf-rail--right { grid-column: 3; }
.profile-page-grid--grid-mode {       /* 1f: no rails, full width */
  display: block;
  padding: 22px 28px 36px;
}
.pf-rail {
  position: sticky;
  top: 20px;
  align-self: start;
  min-width: 0;
  width: 200px;
}
.pf-rail--left { justify-self: end; }   /* hug the container's left edge */
.pf-rail--right { justify-self: start; } /* hug the container's right edge */
.pf-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

/* Page header aligns with the centered container in scroll mode */
.pf-page-header--rails {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(0, 1200px) minmax(200px, 1fr);
  column-gap: 24px;
}
.pf-page-header--rails > .pf-page-header-inner { grid-column: 2; }
.pf-page-header-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  min-width: 0;
}

/* ── Rules ───────────────────────────────────────────────────────────── */
.pf-fading-rule {
  height: 1px;
  border: none;
  margin: 0;
  background: linear-gradient(to right,
    transparent,
    var(--pf-line) 48px,
    var(--pf-line) calc(100% - 48px),
    transparent);
}
.pf-row + .pf-row {
  border-top: 1px solid var(--pf-line-soft);
}

/* ── Cards ───────────────────────────────────────────────────────────── */
.pf-card {
  background: var(--pf-surface);
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--pf-ring);
  overflow: hidden;
}

/* ── Add-row (dashed, expands in place) ──────────────────────────────── */
.pf-add-row {
  border: 1px dashed var(--pf-track);
  border-radius: 8px;
  color: var(--pf-ink-mid);
  cursor: pointer;
  transition: border-color 160ms ease-out, color 160ms ease-out;
}
.pf-add-row:hover {
  border-color: var(--pf-accent-deep);
  color: var(--pf-accent);
}
.pf-add-row--disabled {
  cursor: default;
  color: var(--pf-ink-faint);
}
.pf-add-row--disabled:hover {
  border-color: var(--pf-track);
  color: var(--pf-ink-faint);
}
.pf-add-row-body {
  overflow: hidden;
  transition: max-height 160ms ease-out, opacity 160ms ease-out;
}

/* ── Typography helpers ──────────────────────────────────────────────── */
.pf-kicker {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pf-ink-dim);
  font-weight: 500;
}
.pf-mono {
  font-family: var(--pf-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
}

/* Strength ring animates its conic fill (registered property above). */
.pf-ring { transition: --pf-ring-pct 300ms ease; }

/* ── Focus ───────────────────────────────────────────────────────────── */
.profile-page :is(button, a, [tabindex]):focus-visible {
  outline: 2px solid var(--pf-accent);
  outline-offset: 2px;
}

/* ── Layout cross-fade ───────────────────────────────────────────────── */
.pf-layout-fade {
  animation: pf-fade-in 160ms ease-out;
}
@keyframes pf-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Responsive ──────────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .profile-page-grid,
  .pf-page-header--rails {
    grid-template-columns: 200px minmax(0, 1fr);
  }
  .profile-page-grid--empty { grid-template-columns: minmax(0, 1fr); }
  .profile-page-grid--empty .pf-main { grid-column: auto; }
  .pf-rail--right { display: none; }
}
@media (max-width: 860px) {
  .profile-page-grid,
  .profile-page-grid--empty,
  .pf-page-header--rails {
    grid-template-columns: minmax(0, 1fr);
  }
  .profile-page-grid--empty .pf-main { grid-column: auto; }
  .pf-rail--left, .pf-rail--right { display: none; }
  .pf-photo-col { width: 96px; }
}
@media (max-width: 600px) {
  .pf-card--patient {
    grid-template-columns: 1fr !important;
  }
  .pf-photo-col {
    width: 72px;
    height: 72px;
    min-height: 72px;
  }
}

/* ── Print (always-light is handled globally in client/main.css) ────────── */
.pf-print-idcard { display: none; }
@media print {
  .pf-rail, .pf-add-row, .pf-layout-toggle { display: none !important; }
  /* "Print ID card" quick action: show ONLY the stamp card */
  .pf-printing-idcard .profile-page-grid,
  .pf-printing-idcard .pf-page-header { display: none !important; }
  .pf-printing-idcard .pf-print-idcard { display: block !important; max-width: 420px; }
}
`;
