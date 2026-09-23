// npmPackages/structured-data-capture/client/consoleTheme.js
//
// SDC CONSOLE — the questionnaire skin, following the DirectoryConsole
// advanced-theming pattern (npmPackages/provider-directory/client/DirectoryConsole.jsx):
// the `.sdc-console` CSS-var block is generated from the active MUI theme
// (buildSdcConsoleVars), so ThemeDialog presets restyle the form live and the
// print light-swap re-derives everything. Static CSS (fonts, keyframes, class
// rules, scoped MUI control overrides) is theme-agnostic — every color routes
// through a var or a color-mix() against one. Subcomponents never read the
// theme; QuestionnaireForm is the single seam.
//
// Fonts are app-wide (client/main.css @font-face) but kept here too so the
// package renders standalone — the workflow parser copies top-level asset
// files into public/workflows/structured-data-capture/.

import React from 'react';
import { Box } from '@mui/material';
import { alpha, darken, lighten } from '@mui/material/styles';

const FONT_BASE = '/workflows/structured-data-capture';

// ---------------------------------------------------------------------------
// Theme-driven vars — the single seam between the MUI palette and the skin.
// ---------------------------------------------------------------------------

export function buildSdcConsoleVars(theme) {
  const p = theme.palette;
  const canvas = p.background.default;
  const displayFont = (theme.typography.h1 && theme.typography.h1.fontFamily) || theme.typography.fontFamily;
  return `.sdc-console {
  --void: ${canvas};
  --void-hi: ${lighten(canvas, 0.05)};
  --panel: ${alpha(p.background.paper, 0.72)};
  --panel-hard: ${p.background.paper};
  --accent: ${p.primary.main};
  --accent-dim: ${alpha(p.primary.main, 0.42)};
  --stone: ${p.text.secondary};
  --stone-dim: ${alpha(p.text.secondary, 0.30)};
  --green: ${(p.success && p.success.main) || '#69f0ae'};
  --error: ${p.error.main};
  --ink: ${p.text.primary};
  --ink-dim: ${p.text.disabled};
  --hairline: ${p.divider};
  --display: ${displayFont && String(displayFont).indexOf('Chakra') !== -1 ? displayFont : `'Chakra Petch', ${displayFont}`};
  --mono: 'Martian Mono', 'SF Mono', ui-monospace, monospace;
}`;
}

// ---------------------------------------------------------------------------
// Static CSS — fonts, keyframes, class rules, scoped MUI control overrides.
// Injected once; colors only via vars / color-mix.
// ---------------------------------------------------------------------------

export const SDC_CONSOLE_STATIC_CSS = `
@font-face {
  font-family: 'Chakra Petch';
  src: url('${FONT_BASE}/chakra-petch-500.woff2') format('woff2');
  font-weight: 500; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Chakra Petch';
  src: url('${FONT_BASE}/chakra-petch-700.woff2') format('woff2');
  font-weight: 700; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Martian Mono';
  src: url('${FONT_BASE}/martian-mono-variable.woff2') format('woff2');
  font-weight: 100 800; font-style: normal; font-display: swap;
}

.sdc-console *::selection { background: var(--accent-dim); color: var(--void); }

.sdc-console ::-webkit-scrollbar { width: 10px; height: 10px; }
.sdc-console ::-webkit-scrollbar-track { background: transparent; }
.sdc-console ::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--stone) 18%, transparent);
  border: 2px solid var(--void); border-radius: 6px;
}
.sdc-console ::-webkit-scrollbar-thumb:hover { background: var(--accent-dim); }

/* -- boot / reveal -------------------------------------------------------- */
@keyframes sdcBoot {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sdcRowIn {
  from { opacity: 0; transform: translateX(-10px); clip-path: inset(0 100% 0 0); }
  to   { opacity: 1; transform: translateX(0);     clip-path: inset(0 0 0 0); }
}
@keyframes sdcDrawIn {
  from { transform: scaleX(0); } to { transform: scaleX(1); }
}
@keyframes sdcShimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
@keyframes sdcCaret { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }

.sdc-boot { animation: sdcBoot 0.7s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
.sdc-rule { transform-origin: left; animation: sdcDrawIn 0.8s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
.sdc-row  {
  animation: sdcRowIn 0.45s cubic-bezier(0.2, 0.9, 0.25, 1) both;
  animation-delay: min(calc(var(--sdc-i, 0) * 40ms), 600ms);
}
.sdc-caret { animation: sdcCaret 1.1s step-end infinite; }

/* Respect reduced-motion (and paper): no reveals, no shimmer. */
@media (prefers-reduced-motion: reduce), print {
  .sdc-boot, .sdc-rule, .sdc-row, .sdc-caret { animation: none !important; }
}

/* -- chip buttons (choice segments + actions) ----------------------------- */
.sdc-chip-btn {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
  color: var(--stone); background: transparent; border: 1px solid var(--stone-dim);
  padding: 8px 16px; cursor: pointer; transition: all 0.18s ease;
  text-transform: uppercase; border-radius: 0; line-height: 1.4;
}
.sdc-chip-btn:hover:not(:disabled) {
  border-color: var(--accent); color: var(--accent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}
.sdc-chip-btn--on {
  border-color: var(--accent); color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  box-shadow: inset 2px 0 0 var(--accent);
}
.sdc-chip-btn--accent {
  border-color: var(--accent); color: var(--void);
  background: var(--accent); font-weight: 600;
}
.sdc-chip-btn--accent:hover:not(:disabled) {
  color: var(--void);
  background: color-mix(in srgb, var(--accent) 85%, var(--void));
}
.sdc-chip-btn--danger:hover:not(:disabled) {
  border-color: var(--error); color: var(--error);
  background: color-mix(in srgb, var(--error) 6%, transparent);
}
.sdc-chip-btn:disabled { opacity: 0.35; cursor: default; }

/* -- mono microcopy chips (MULTI / AI·VERIFY / required dot) -------------- */
.sdc-micro-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em;
  color: var(--stone); border: 1px solid var(--stone-dim);
  padding: 2px 8px; margin-left: 10px; vertical-align: middle;
  text-transform: uppercase; white-space: nowrap;
}
.sdc-micro-chip--ai { color: var(--accent); border-color: var(--accent-dim); }

/* -- question rows -------------------------------------------------------- */
.sdc-question-row {
  border-left: 2px solid transparent;
  transition: border-color 0.18s ease, background 0.18s ease;
}
.sdc-question-row:hover, .sdc-question-row:focus-within {
  border-left-color: var(--accent);
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 5%, transparent), transparent 65%);
}

/* -- scoped MUI control overrides (underline inputs, accent controls) ----- */
.sdc-console .MuiOutlinedInput-notchedOutline {
  border: none; border-bottom: 1px solid var(--hairline); border-radius: 0;
}
.sdc-console .MuiOutlinedInput-root {
  font-family: var(--mono); font-size: 13px; letter-spacing: 0.04em;
  background: transparent; border-radius: 0;
}
.sdc-console .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
  border-bottom-color: var(--stone);
}
.sdc-console .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
  border-bottom: 1px solid var(--accent);
}
.sdc-console .MuiInputBase-input::placeholder {
  font-family: var(--mono); letter-spacing: 0.06em; opacity: 0.55;
}
.sdc-console .MuiRadio-root.Mui-checked,
.sdc-console .MuiCheckbox-root.Mui-checked { color: var(--accent) !important; }
.sdc-console .MuiSwitch-switchBase.Mui-checked { color: var(--accent) !important; }
.sdc-console .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
  background-color: var(--accent) !important;
}
.sdc-console .MuiFormHelperText-root { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; }
`;

// ---------------------------------------------------------------------------
// Idempotent style injection — static once, vars refreshed on theme change.
// ---------------------------------------------------------------------------

export function injectSdcConsoleStyles(theme) {
  if (typeof document === 'undefined') { return; }

  if (!document.getElementById('sdc-console-static')) {
    const staticEl = document.createElement('style');
    staticEl.id = 'sdc-console-static';
    staticEl.textContent = SDC_CONSOLE_STATIC_CSS;
    document.head.appendChild(staticEl);
  }

  const vars = buildSdcConsoleVars(theme);
  let varsEl = document.getElementById('sdc-console-vars');
  if (!varsEl) {
    varsEl = document.createElement('style');
    varsEl.id = 'sdc-console-vars';
    document.head.appendChild(varsEl);
  }
  if (varsEl.textContent !== vars) {
    varsEl.textContent = vars;
  }
}

// ---------------------------------------------------------------------------
// Brackets — the console's signature corner framing device.
// ---------------------------------------------------------------------------

export function Brackets({ color = 'var(--stone-dim)', size = 14 }) {
  const common = { position: 'absolute', width: size, height: size, pointerEvents: 'none' };
  const b = '1px solid ' + color;
  return (
    <>
      <Box sx={{ ...common, top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <Box sx={{ ...common, top: 0, right: 0, borderTop: b, borderRight: b }} />
      <Box sx={{ ...common, bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <Box sx={{ ...common, bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}
