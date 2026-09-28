// npmPackages/implantable-devices/client/add-a-device/FlowPrimitives.jsx
//
// Small shared pieces of the add-a-device flow: status tags, the data-stream
// checklist, the consent row, and the bottom action row. All colors via the
// --pf-* vars provided by the page root.

import React from 'react';
import { Box, Typography, Button, Checkbox, FormControlLabel, CircularProgress } from '@mui/material';

import { BTN_PRIMARY_SX, BTN_SECONDARY_SX } from './addDeviceStyles.js';

const CHECK_SX = {
  color: 'var(--pf-ink-dim)',
  '&.Mui-checked': { color: 'var(--pf-accent)' },
  py: 0.25
};

// ── Tag: status chip in the three design treatments ─────────────────────
export function Tag({ label, variant = 'neutral' }) {
  return <Box component="span" className={'adv-tag adv-tag--' + variant}>{label}</Box>;
}

export function statusTagVariant(status) {
  if (status === 'active' || status === 'ready to link') { return 'accent'; }
  if (status === 'draft') { return 'outline'; }
  return 'neutral';  // incomplete / awaiting data
}

// ── StreamChecklist: capability checkboxes derived from catalog/service ──
export function StreamChecklist({ available, selected, onToggle }) {
  if (!available || available.length === 0) { return null; }
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Data streams
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2 }}>
        {available.map(function(stream) {
          return (
            <FormControlLabel
              key={stream}
              control={
                <Checkbox
                  size="small"
                  checked={selected.indexOf(stream) !== -1}
                  onChange={function() { onToggle(stream); }}
                  sx={CHECK_SX}
                />
              }
              label={stream}
              sx={{ '& .MuiFormControlLabel-label': { fontSize: 13, color: 'var(--pf-ink)' } }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

// ── ConsentRow: the continuous-write permission checkbox ────────────────
export function ConsentRow({ checked, onChange, label }) {
  return (
    <Box sx={{ border: '1px solid var(--pf-line)', borderRadius: '8px', px: 1.5, py: 0.5 }}>
      <FormControlLabel
        control={<Checkbox size="small" checked={checked} onChange={function(event) { onChange(event.target.checked); }} sx={CHECK_SX} />}
        label={label || 'Allow this device to write to my record continuously'}
        sx={{ '& .MuiFormControlLabel-label': { fontSize: 13, color: 'var(--pf-ink)' } }}
      />
      <Typography sx={{ fontSize: 11, color: 'var(--pf-ink-dim)', pl: 3.5, pb: 0.5 }}>
        Recorded as a Consent you can revoke anytime from Known devices.
      </Typography>
    </Box>
  );
}

// ── ActionRow: Link device / Save as incomplete + hint ──────────────────
export function ActionRow({ onLink, onSaveIncomplete, linkDisabled, busy, hint, linkLabel }) {
  return (
    <Box className="adv-actions">
      <Button
        id="advLinkDeviceButton"
        variant="outlined"
        disabled={linkDisabled || busy}
        onClick={onLink}
        startIcon={busy ? <CircularProgress size={14} sx={{ color: 'var(--pf-ink-dim)' }} /> : null}
        sx={BTN_PRIMARY_SX}
      >
        {linkLabel || 'Link device'}
      </Button>
      {onSaveIncomplete && (
        <Button variant="outlined" disabled={busy} onClick={onSaveIncomplete} sx={BTN_SECONDARY_SX}>
          Save as incomplete
        </Button>
      )}
      {hint && <Typography className="adv-action-hint">{hint}</Typography>}
    </Box>
  );
}
