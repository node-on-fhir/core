// imports/ui/profile/ProfileBarcode.jsx
//
// Barcode as a design element (handoff: "hover shows full id in a tooltip;
// click copies and shows a snackbar. Never spell out a UUID inline except in
// truncated mono form"). Rendered with the app's existing Code 39 barcode
// font (client/main.css `.barcode` → /fonts/3OF9_NEW.TTF) — the same
// treatment as the patient-directory FHIR ID column. Scannability is not a
// requirement; the tooltip + copy carry the data.

import React from 'react';
import { Tooltip } from '@mui/material';
import { notify } from '/imports/lib/notify.js';

export function copyWithToast(value, label) {
  if (!value) { return; }
  navigator.clipboard.writeText(value).then(function() {
    notify({ title: 'Copied', message: label || value, severity: 'success', duration: 2000 });
  }).catch(function(err) {
    console.warn('[ProfileBarcode] clipboard write failed:', err.message);
    notify({ title: 'Copy failed', message: err.message, severity: 'error' });
  });
}

export default function ProfileBarcode({
  value,
  width = 220,
  height = 22,
  color = 'var(--pf-ink-mid)',
  tooltip = true,
  copyOnClick = true,
  ghost = false,          // 1g placeholder: hatched stand-in, no encode
  sx = {},
  ...rest
}) {
  const box = {
    maxWidth: width,
    height: height,
    display: 'inline-block',
    color: color,
    cursor: copyOnClick && value ? 'pointer' : 'default',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    ...sx
  };

  if (ghost || !value) {
    return (
      <span
        className="pf-barcode pf-barcode--ghost"
        style={{
          ...box,
          width: width,
          background: 'repeating-linear-gradient(90deg, var(--pf-track) 0 2px, transparent 2px 5px)'
        }}
        {...rest}
      />
    );
  }

  const barcode = (
    <span
      className="pf-barcode barcode"
      style={{
        ...box,
        fontSize: height,
        lineHeight: `${height}px`
      }}
      onClick={copyOnClick ? function() { copyWithToast(value); } : undefined}
      {...rest}
    >
      {String(value)}
    </span>
  );

  if (!tooltip) { return barcode; }
  return (
    <Tooltip title={String(value)} placement="top" arrow>
      {barcode}
    </Tooltip>
  );
}
