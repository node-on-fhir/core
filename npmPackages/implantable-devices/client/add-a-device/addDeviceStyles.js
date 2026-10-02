// npmPackages/implantable-devices/client/add-a-device/addDeviceStyles.js
//
// Structural CSS for the /add-a-device flow. Every color comes from the
// --pf-* vars emitted by buildProfileVars(theme) (imports/ui/profile/
// profileVars.js) — the page root carries className="profile-page adv-page"
// so both screens of the design (add flow + Known-devices card) derive from
// the same theme seam and stay legible under every preset.

export const ADD_DEVICE_STATIC_CSS = `
.adv-page {
  min-height: 100%;
  background: var(--pf-canvas);
}

.adv-header {
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 40px 0;
}

.adv-grid {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 48px;
  padding: 20px 40px 40px;
  max-width: 1440px;
  margin: 0 auto;
}

/* ── Header ────────────────────────────────────────────────────────────── */
.adv-h1 {
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--pf-ink);
  margin: 0;
}
.adv-subtitle { font-size: 14px; color: var(--pf-ink-mid); margin: 4px 0 0; }

/* ── Left rail ─────────────────────────────────────────────────────────── */
.adv-rail { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

.adv-source-card {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 14px;
  align-items: center;
  width: 100%;
  padding: 16px 18px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-line);
  border-radius: 14px;
  color: var(--pf-ink);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  font: inherit;
}
.adv-source-card:hover { border-color: var(--pf-accent-deep); }
.adv-source-card--selected {
  border-color: var(--pf-accent);
  box-shadow: 0 0 0 1px var(--pf-accent),
              0 0 28px color-mix(in srgb, var(--pf-accent) 22%, transparent);
}

.adv-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--pf-accent-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pf-accent);
  position: relative;
  flex-shrink: 0;
}
.adv-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid var(--pf-accent);
  border-radius: 50%;
  animation: advPulse 2.2s ease-out infinite;
}
@keyframes advPulse {
  0%   { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(1.8); opacity: 0; }
}

.adv-card {
  background: var(--pf-surface);
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--pf-ring);
  padding: 14px;
}
.adv-kv {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px 14px;
  font-size: 12px;
}
.adv-kv-label { color: var(--pf-ink-dim); }
.adv-kv-value { color: var(--pf-ink); min-width: 0; overflow-wrap: anywhere; }
.adv-footnote { font-size: 12px; color: var(--pf-ink-dim); line-height: 1.5; }

/* ── Right pane ────────────────────────────────────────────────────────── */
.adv-pane {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 640px;
  min-width: 0;
}
.adv-actions {
  margin-top: auto;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 8px;
}
.adv-action-hint { font-size: 12px; color: var(--pf-ink-dim); }

/* ── Segmented control ─────────────────────────────────────────────────── */
.adv-seg {
  display: inline-flex;
  border: 1px solid var(--pf-line);
  border-radius: 8px;
  overflow: hidden;
  width: fit-content;
}
.adv-seg-opt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 13px;
  color: var(--pf-ink-mid);
  background: transparent;
  border: none;
  cursor: pointer;
  font: inherit;
}
.adv-seg-opt + .adv-seg-opt { border-left: 1px solid var(--pf-line); }
.adv-seg-opt--on { color: var(--pf-accent); box-shadow: inset 0 0 0 1px var(--pf-accent); }

/* ── Scan panel + UDI parse strip ──────────────────────────────────────── */
.adv-scan-panel {
  height: 280px;
  border: 1px dashed var(--pf-track);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--pf-ink-dim);
  font-size: 13px;
  position: relative;
  overflow: hidden;
  text-align: center;
  padding: 0 24px;
}
.adv-scan-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

.adv-parse-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--pf-line);
  border-radius: 8px;
  overflow: hidden;
}
.adv-parse-cell { padding: 12px 14px; min-width: 0; }
.adv-parse-cell + .adv-parse-cell { border-left: 1px solid var(--pf-line); }
.adv-parse-label {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pf-ink-dim);
  margin-bottom: 4px;
}
.adv-parse-value {
  font-family: var(--pf-mono);
  font-size: 13.5px;
  color: var(--pf-ink);
  overflow-wrap: anywhere;
}
.adv-parse-value--accent { color: var(--pf-accent); }

/* ── Resolved device card ──────────────────────────────────────────────── */
.adv-resolved {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-accent-deep);
  border-radius: 14px;
  box-shadow: 0 0 30px color-mix(in srgb, var(--pf-accent) 12%, transparent);
}
.adv-icon-circle--lg { width: 52px; height: 52px; }

/* ── Service tiles (Branch B) ──────────────────────────────────────────── */
.adv-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.adv-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-line);
  border-radius: 8px;
  color: var(--pf-ink);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  font: inherit;
  min-width: 0;
}
.adv-tile:hover { border-color: var(--pf-accent-deep); }
.adv-tile--selected {
  border-color: var(--pf-accent);
  box-shadow: 0 0 0 1px var(--pf-accent),
              0 0 28px color-mix(in srgb, var(--pf-accent) 22%, transparent);
}
.adv-tile-logo {
  width: 34px;
  height: 34px;
  border-radius: 4px;
  background: var(--pf-well);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pf-accent);
  flex-shrink: 0;
}

/* ── Exit cards (Branch B) ─────────────────────────────────────────────── */
.adv-exit-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.adv-exit-card {
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--pf-line);
  background: var(--pf-surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.adv-exit-card--primary { border-color: var(--pf-accent); background: var(--pf-accent-tint); }

/* ── Catalog result rows (Branch C) ────────────────────────────────────── */
.adv-result-row {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  gap: 14px;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-line);
  border-radius: 8px;
  color: var(--pf-ink);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  font: inherit;
}
.adv-result-row:hover { border-color: var(--pf-accent-deep); }
.adv-result-row--selected {
  border-color: var(--pf-accent);
  box-shadow: 0 0 0 1px var(--pf-accent),
              0 0 28px color-mix(in srgb, var(--pf-accent) 22%, transparent);
}
.adv-result-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--pf-well);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pf-accent);
}

/* ── Tags ──────────────────────────────────────────────────────────────── */
.adv-tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  letter-spacing: 0.02em;
  padding: 3px 10px;
  border-radius: 6px;
  white-space: nowrap;
}
.adv-tag--accent { background: var(--pf-accent-chip); color: var(--pf-accent-text); }
.adv-tag--neutral { background: var(--pf-well); color: var(--pf-ink-mid); }
.adv-tag--outline { border: 1px solid var(--pf-accent); color: var(--pf-accent); }

/* ── Confirmation ──────────────────────────────────────────────────────── */
.adv-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 48px;
  text-align: center;
}
.adv-confirm-check {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 1px solid var(--pf-accent-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pf-accent);
  position: relative;
}

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .adv-header { padding: 24px 20px 0; }
  .adv-grid { grid-template-columns: minmax(0, 1fr); gap: 24px; padding: 16px 20px 32px; }
  .adv-pane { min-height: 0; }
  .adv-tiles { grid-template-columns: repeat(2, 1fr); }
  .adv-exit-cards { grid-template-columns: 1fr; }
  .adv-parse-strip { grid-template-columns: repeat(2, 1fr); }
  .adv-parse-cell:nth-child(3), .adv-parse-cell:nth-child(4) { border-top: 1px solid var(--pf-line); }
  .adv-parse-cell:nth-child(3) { border-left: none; }
}
`;

// Shared sx for MUI TextFields inside the --pf-* var scope
export const FIELD_SX = {
  '& .MuiInputBase-root': { color: 'var(--pf-ink)', fontSize: 14, background: 'var(--pf-surface)' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--pf-line)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--pf-accent-deep)' },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--pf-accent)' },
  '& .MuiInputLabel-root': { color: 'var(--pf-ink-dim)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--pf-accent)' },
  '& .MuiFormHelperText-root': { color: 'var(--pf-ink-dim)' }
};

// Shared sx for the primary/secondary/ghost button treatments
export const BTN_PRIMARY_SX = {
  color: 'var(--pf-accent)',
  borderColor: 'var(--pf-accent)',
  textTransform: 'none',
  fontSize: 14,
  '&:hover': { borderColor: 'var(--pf-accent)', background: 'var(--pf-accent-tint)' },
  '&.Mui-disabled': { opacity: 0.45, color: 'var(--pf-ink-faint)', borderColor: 'var(--pf-line)' }
};

export const BTN_SECONDARY_SX = {
  color: 'var(--pf-ink-mid)',
  borderColor: 'var(--pf-line)',
  textTransform: 'none',
  fontSize: 14,
  '&:hover': { borderColor: 'var(--pf-ink-mid)', background: 'var(--pf-line-soft)' }
};

export const BTN_GHOST_SX = {
  color: 'var(--pf-accent)',
  textTransform: 'none',
  fontSize: 14,
  '&:hover': { background: 'var(--pf-accent-tint)' }
};
