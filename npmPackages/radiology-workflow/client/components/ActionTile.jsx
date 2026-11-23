// npmPackages/radiology-workflow/client/components/ActionTile.jsx

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

// =============================================================================
// ACTION TILE - Clickable action button styled to match TabTiles/StatCounters
// =============================================================================
//
// A tile-shaped button for dashboard action rows (e.g. "New Patient",
// "DICOM Studies"). Visual language mirrors TabTile: rounded, bordered,
// alpha-accented hover.
//
//   icon: ReactNode (an @mui/icons-material element)
//   label: string
//   onClick: () => void
//   color: palette key for the accent (default 'primary')
// =============================================================================

function ActionTile({ icon, label, onClick, color }) {
  const theme = useTheme();
  const accent = color && theme.palette[color]
    ? theme.palette[color].main
    : theme.palette.primary.main;

  return (
    <Box
      onClick={onClick}
      role="button"
      aria-label={label}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 0.5,
        borderRadius: 1,
        cursor: 'pointer',
        minWidth: 120,
        border: '1px solid',
        borderColor: alpha(accent, 0.5),
        color: accent,
        transition: 'background-color 0.15s, border-color 0.15s',
        '&:hover': { backgroundColor: alpha(accent, 0.08) }
      }}
    >
      {icon}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
          color: accent
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default ActionTile;
