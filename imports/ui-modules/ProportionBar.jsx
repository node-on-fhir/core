// imports/ui-modules/ProportionBar.jsx
//
// Segmented proportion bar (CBC differential archetype): an 8px-tall flex row
// with 1px gaps, each segment flexed by its value. Segment colors walk from
// the accent down through quieter neutrals so the first segments read as the
// dominant populations. Pure leaf — values in, JSX out.

import React from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

export function ProportionBar(props) {
  const { segments, height } = props || {};
  const list = (segments || []).filter(function (s) { return s && s.value > 0; });
  if (list.length === 0) { return null; }

  const ariaLabel = 'Proportions: ' + list.map(function (s) {
    return (s.label ? s.label + ' ' : '') + s.value + '%';
  }).join(', ');

  return (
    <Box
      role="img"
      aria-label={ariaLabel}
      sx={{
        display: 'flex',
        height: height || 8,
        borderRadius: '4px',
        overflow: 'hidden',
        gap: '1px',
        mt: '2px'
      }}
    >
      {list.map(function (segment, index) {
        return (
          <Box
            key={(segment.label || 'segment') + ':' + index}
            sx={theme => {
              const ramp = [
                theme.palette.primary.main,
                theme.palette.primary.dark,
                alpha(theme.palette.text.primary, 0.45),
                alpha(theme.palette.text.primary, 0.3),
                alpha(theme.palette.text.primary, 0.18)
              ];
              return {
                flex: segment.value,
                bgcolor: segment.color || ramp[Math.min(index, ramp.length - 1)]
              };
            }}
          />
        );
      })}
    </Box>
  );
}

export default ProportionBar;
