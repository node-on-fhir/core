// npmPackages/radiology-workflow/client/components/StatCounters.jsx

import React from 'react';
import { Box, Typography, Badge } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

// =============================================================================
// STAT COUNTERS - Summary badge counts for the header area
// =============================================================================
//
// Displays a row of count boxes showing STAT/priority/TAT threshold tallies.
// Each counter: { label: 'STAT', count: 3, color: 'error', key?, filter? }
//
// Tiles can optionally act as quick filters. When the parent passes
// `onTileClick(key)` + `activeKey`, each box becomes clickable and the matching
// tile renders in an active state (mirrors TabTiles' active treatment).
// =============================================================================

function StatCounterBox({ label, count, color, clickable, active, onClick }) {
  const theme = useTheme();

  const accent = color && theme.palette[color]
    ? theme.palette[color].main
    : theme.palette.text.primary;

  // Read-only resting background (unchanged from the original display tile).
  const restBg = color && theme.palette[color]
    ? alpha(theme.palette[color].main, 0.12)
    : alpha(theme.palette.text.primary, 0.08);

  const bgColor = clickable
    ? (active ? alpha(accent, 0.16) : 'transparent')
    : restBg;

  const textColor = accent;

  return (
    <Box
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      aria-pressed={clickable ? !!active : undefined}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        backgroundColor: bgColor,
        minWidth: 120,
        ...(clickable ? {
          cursor: 'pointer',
          border: '1px solid',
          borderColor: active ? alpha(accent, 0.5) : 'divider',
          transition: 'background-color 0.15s, border-color 0.15s',
          '&:hover': { backgroundColor: alpha(accent, 0.08) }
        } : {})
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, lineHeight: 1.2, color: textColor }}
      >
        {count}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
          color: textColor,
          fontSize: '0.6rem'
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function StatCounters({ counters, onTileClick, activeKey }) {
  if (!counters || counters.length === 0) return null;

  const clickable = typeof onTileClick === 'function';

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {counters.map(function(counter, index) {
        const tileKey = counter.key != null ? counter.key : counter.label;
        return (
          <StatCounterBox
            key={index}
            label={counter.label}
            count={counter.count}
            color={counter.color}
            clickable={clickable}
            active={clickable && activeKey != null && activeKey === tileKey}
            onClick={clickable ? function() { onTileClick(tileKey); } : undefined}
          />
        );
      })}
    </Box>
  );
}

export default StatCounters;
