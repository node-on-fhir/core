// imports/ui-modules/Redact.jsx
//
// Blur-redacted inline text for sensitive content (the handoff's "hidden
// under IL lens · hover to reveal" affordance): 6px blur, no text selection,
// un-blurs on hover/focus with a .3s transition. Presentational only — the
// decision of WHAT is sensitive (jurisdiction lens, consent state) belongs to
// the consumer; this just renders the veil.

import React from 'react';
import { Box } from '@mui/material';

export function Redact(props) {
  const { children, reason } = props || {};

  return (
    <Box
      component="span"
      tabIndex={0}
      aria-label={reason || 'Redacted content — hover to reveal'}
      sx={{
        filter: 'blur(6px)',
        userSelect: 'none',
        transition: 'filter .3s',
        '&:hover, &:focus-visible': { filter: 'blur(0)' },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
      }}
    >
      {children || reason}
    </Box>
  );
}

export default Redact;
