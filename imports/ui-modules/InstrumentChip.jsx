// imports/ui-modules/InstrumentChip.jsx
//
// Small status chip for the Inline Instruments family: 11px text, 2×8 padding,
// 6px radius. The default variant is a quiet filled chip; variant="due"
// renders transparent with a dashed accent border (immunization "due" items).
// Pure leaf — value in, JSX out.

import React from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

export function InstrumentChip(props) {
  const { label, suffix, variant } = props || {};
  const isDue = variant === 'due';

  return (
    <Box
      component="span"
      sx={theme => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: 11,
        px: 1,
        py: '2px',
        borderRadius: '6px',
        whiteSpace: 'nowrap',
        ...(isDue ? {
          bgcolor: 'transparent',
          border: '1px dashed',
          borderColor: 'primary.dark',
          color: 'primary.light'
        } : {
          bgcolor: alpha(theme.palette.text.primary, 0.1),
          color: 'text.primary'
        })
      })}
    >
      {label}
      {suffix && <Box component="span" sx={{ opacity: 0.6 }}>{suffix}</Box>}
    </Box>
  );
}

export default InstrumentChip;
