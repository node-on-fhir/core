// npmPackages/radiology-workflow/client/components/TabTiles.jsx

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

// =============================================================================
// TAB TILES - Clickable count tiles that double as worklist tabs
// =============================================================================
//
// Replaces a text <Tabs> row. Each tile shows a live count + label and acts as
// the active-tab selector. Visual style mirrors StatCounters' StatCounterBox.
//
//   tabs: [{ key, label, count, color? }]
//   activeIndex: number
//   onChange: (index) => void
// =============================================================================

function TabTile({ label, count, active, color, onClick }) {
  const theme = useTheme();
  const accent = color && theme.palette[color]
    ? theme.palette[color].main
    : theme.palette.primary.main;

  return (
    <Box
      onClick={onClick}
      role="tab"
      aria-selected={active}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        py: 0.5,
        borderRadius: 1,
        cursor: 'pointer',
        minWidth: 120,
        backgroundColor: active ? alpha(accent, 0.16) : 'transparent',
        border: '1px solid',
        borderColor: active ? alpha(accent, 0.5) : 'divider',
        transition: 'background-color 0.15s, border-color 0.15s',
        '&:hover': { backgroundColor: alpha(accent, 0.08) }
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, lineHeight: 1.1, color: active ? accent : 'text.primary' }}
      >
        {count}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
          color: active ? accent : 'text.secondary'
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function TabTiles({ tabs, activeIndex, onChange }) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <Box role="tablist" sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', py: 1 }}>
      {tabs.map(function(tab, i) {
        return (
          <TabTile
            key={tab.key != null ? tab.key : i}
            label={tab.label}
            count={tab.count}
            color={tab.color}
            active={i === activeIndex}
            onClick={function() { onChange(i); }}
          />
        );
      })}
    </Box>
  );
}

export default TabTiles;
