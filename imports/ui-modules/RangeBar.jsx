// imports/ui-modules/RangeBar.jsx
//
// The load-bearing Inline Instruments primitive: a 14px-tall horizontal range
// bar — 2px track, 4px reference-range band, and a 2×14px value tick. The
// tick renders in text.primary when the value sits inside the reference range
// and in the accent (primary.main) when it falls outside, matching the design
// handoff (accent marks out-of-range here, deliberately not error/warning —
// imports/ui-fields/ReferenceRange.jsx keeps its own status-color semantics).
// Axis math lives in instrumentHelpers.computeRangeAxis (range ± 60%, clamped
// to include the value). Pure leaf: value in, JSX out.

import React from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { computeRangeAxis, interpretRange } from './instrumentHelpers';
import { INSTRUMENT_MONO_FONT } from './InstrumentCard';

function fmt(v) { return (v === undefined || v === null) ? '—' : String(v); }

export function RangeBar(props) {
  const { value, unit, low, high, bandProfile, boundLabel, height } = props || {};
  const axis = computeRangeAxis(value, low, high, bandProfile);
  const barHeight = height || 14;

  if (!axis) {
    return <Box sx={{ height: barHeight }} aria-hidden="true" />;
  }

  const state = interpretRange(value, low, high, bandProfile);
  const outOfRange = state === 'low' || state === 'high';
  const rangeText = (low !== undefined ? low : '') + '–' + (high !== undefined ? high : '') + (unit ? ' ' + unit : '');
  const ariaLabel = 'Value ' + fmt(value) + (unit ? ' ' + unit : '') + ', ' + state + ', reference ' + rangeText;

  // The optional bound label sits above the range edge nearest the excursion.
  let labelValue = null;
  let labelLeftPct = null;
  if (boundLabel) {
    if (boundLabel === 'low' || (boundLabel === true && state === 'low')) {
      labelValue = low; labelLeftPct = axis.rangeLeftPct;
    } else if (boundLabel === 'high' || (boundLabel === true && state === 'high')) {
      labelValue = high; labelLeftPct = (axis.rangeLeftPct + axis.rangeWidthPct);
    }
  }

  return (
    <Box role="img" aria-label={ariaLabel} sx={{ position: 'relative', height: barHeight }}>
      <Box sx={theme => ({
        position: 'absolute',
        left: 0,
        right: 0,
        top: (barHeight / 2) - 1,
        height: '2px',
        bgcolor: alpha(theme.palette.text.primary, 0.1)
      })} />
      {axis.rangeWidthPct !== null && (
        <Box sx={theme => ({
          position: 'absolute',
          left: axis.rangeLeftPct + '%',
          width: axis.rangeWidthPct + '%',
          top: (barHeight / 2) - 2,
          height: '4px',
          borderRadius: '2px',
          bgcolor: alpha(theme.palette.text.primary, 0.28)
        })} />
      )}
      {axis.valuePct !== null && (
        <Box sx={{
          position: 'absolute',
          left: 'calc(' + axis.valuePct + '% - 1px)',
          top: 0,
          width: '2px',
          height: barHeight,
          bgcolor: outOfRange ? 'primary.main' : 'text.primary'
        }} />
      )}
      {labelValue !== undefined && labelValue !== null && labelLeftPct !== null && (
        <Box component="span" sx={{
          position: 'absolute',
          left: labelLeftPct + '%',
          top: '-9px',
          fontSize: 9,
          fontFamily: INSTRUMENT_MONO_FONT,
          color: 'text.secondary',
          whiteSpace: 'nowrap'
        }}>
          {labelValue}
        </Box>
      )}
    </Box>
  );
}

export default RangeBar;
