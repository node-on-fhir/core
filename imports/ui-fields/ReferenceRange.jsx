// imports/ui-fields/ReferenceRange.jsx
// PURE leaf primitive — value in, JSX out. No data-fetching, no Meteor.
// Renders a lab value against a resolved reference range across five band profiles.
import React from 'react';
import { get } from 'lodash';
import { Box, Chip, Typography, Tooltip, useTheme } from '@mui/material';

function fmt(v) { return (v === undefined || v === null) ? '—' : String(v); }

function interp(value, normal, profile) {
  const low = get(normal, 'low.value');
  const high = get(normal, 'high.value');
  if (typeof value !== 'number') return 'unknown';
  if ((profile === 'low-normal-high' || profile === 'low-normal') && low !== undefined && value < low) return 'low';
  if ((profile === 'low-normal-high' || profile === 'normal-high') && high !== undefined && value > high) return 'high';
  return 'normal';
}

export default function ReferenceRange(props) {
  const theme = useTheme();
  const { value, unit, normal, bandProfile } = props || {};
  const profile = bandProfile || 'low-normal-high';

  // Qualitative and informational profiles render as status chip
  if (profile === 'qualitative' || profile === 'informational') {
    const isQualitative = profile === 'qualitative';
    const chipColor = isQualitative && /pos/i.test(String(value)) ? 'warning' : 'default';
    const label = fmt(value) + (unit ? ' ' + unit : '');

    return (
      <Chip
        size="small"
        color={chipColor}
        label={label}
        role="img"
        aria-label={'Result ' + label}
        tabIndex={0}
      />
    );
  }

  // Bidirectional or one-sided gauge (low-normal-high, normal-high, low-normal)
  const state = interp(value, normal, profile);
  const low = get(normal, 'low.value');
  const high = get(normal, 'high.value');

  const rangeText = (low !== undefined ? low : '') + '–' + (high !== undefined ? high : '') + (unit ? ' ' + unit : '');

  // Map state to theme color tokens
  const stateColor = state === 'normal'
    ? theme.palette.success.main
    : (state === 'high'
      ? theme.palette.error.main
      : theme.palette.warning.main);

  const ariaLabel = 'Value ' + fmt(value) + ' ' + fmt(unit) + ', ' + state + ', reference ' + rangeText;

  return (
    <Tooltip title={'Reference: ' + rangeText}>
      <Box
        role="img"
        tabIndex={0}
        aria-label={ariaLabel}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          outline: 'none',
          '&:focus': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
            borderRadius: '4px'
          }
        }}>
        <Typography
          component="span"
          sx={{
            fontWeight: 600,
            color: stateColor
          }}>
          {fmt(value)}
        </Typography>
        <Typography
          component="span"
          variant="caption"
          sx={{
            color: 'text.secondary'
          }}>
          {rangeText}
        </Typography>
      </Box>
    </Tooltip>
  );
}
