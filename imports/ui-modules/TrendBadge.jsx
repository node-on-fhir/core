// imports/ui-modules/TrendBadge.jsx
//
// Small presentational badge for a clinically significant trend, fed by
// imports/lib/trendDetection.js detectTrend() results. Renders nothing unless
// the trend cleared all three significance bars (p < 0.05, |slope| above the
// clinical threshold, R² > 0.5) — the badge is an attention tell, not a
// direction indicator, so it stays quiet for ordinary drift.
// Pure leaf: trend result in, JSX out.

import React from 'react';
import { Box, Tooltip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Humane rate formatting: pick the coarsest period that keeps the number ≥ 1.
function formatRate(slopePerDay, unit) {
  const abs = Math.abs(slopePerDay);
  let value = slopePerDay;
  let period = '/day';
  if (abs < 1 && abs * 7 >= 1) {
    value = slopePerDay * 7;
    period = '/week';
  } else if (abs < 1) {
    value = slopePerDay * 30;
    period = '/month';
  }
  const rounded = Math.abs(value) >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return (rounded > 0 ? '+' : '') + rounded + (unit ? ' ' + unit : '') + period;
}

export function TrendBadge(props) {
  const { trend, unit, sx } = props || {};
  if (!trend || !trend.significant) { return null; }

  const rising = trend.direction === 'increasing';
  const Icon = rising ? TrendingUpIcon : TrendingDownIcon;
  const detail = 'Significant trend: ' + formatRate(trend.slope, unit)
    + ' over ' + trend.n + ' values'
    + ' (R² ' + (Math.round(trend.rSquared * 100) / 100) + ')';

  return (
    <Tooltip title={detail}>
      <Box
        component="span"
        role="status"
        aria-label={detail}
        sx={[{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          px: 1,
          py: '2px',
          borderRadius: '6px',
          fontSize: 12,
          fontWeight: 600,
          color: 'warning.main',
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
          whiteSpace: 'nowrap'
        }, ...(Array.isArray(sx) ? sx : [sx || {}])]}
      >
        <Icon sx={{ fontSize: 16 }} />
        {formatRate(trend.slope, unit)}
      </Box>
    </Tooltip>
  );
}

export default TrendBadge;
