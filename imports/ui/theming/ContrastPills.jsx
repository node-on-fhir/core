// imports/ui/theming/ContrastPills.jsx
//
// WCAG contrast pills for the Theming Studio preview: accent-on-paper,
// text-on-page, app-bar-text. Green >= 4.5, amber >= 3, red below (handoff
// thresholds). Chrome colors use live theme tokens; only the dots encode the
// ratio verdict.

import React from 'react';
import { Box, Typography } from '@mui/material';
import { contrastRatio, cssColorToHex } from '../themeAlgorithms.js';

const TEXT_LIGHT = '#212121';
const TEXT_DARK = '#e6e6e6';

function verdictColor(ratio) {
  if (ratio >= 4.5) { return 'success.main'; }
  if (ratio >= 3) { return 'warning.main'; }
  return 'error.main';
}

export function ContrastPills({ draft, mode }) {
  const isDark = mode === 'dark';
  const label = isDark ? 'Dark' : 'Light';
  const paper = cssColorToHex(isDark ? draft.paperDark : draft.paperLight, isDark ? '#1e1e1e' : '#ffffff');
  const page = cssColorToHex(isDark ? draft.bgDark : draft.bgLight, isDark ? '#121212' : '#f6f6f6');
  const appBar = cssColorToHex((isDark ? draft.appBarDark : draft.appBarLight) || draft.primary, '#9e9e9e');
  const appBarText = cssColorToHex(isDark ? draft.appBarTextDark : draft.appBarTextLight, '#ffffff');
  const text = isDark ? TEXT_DARK : TEXT_LIGHT;

  const pills = [
    { key: 'accent-paper', label: label + ' accent on paper', ratio: contrastRatio(cssColorToHex(draft.primary, '#9e9e9e'), paper) },
    { key: 'text-page', label: label + ' text on page', ratio: contrastRatio(text, page) },
    { key: 'appbar-text', label: label + ' app-bar text', ratio: contrastRatio(appBarText, appBar) }
  ];

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {pills.map(function(pill) {
        return (
          <Box
            key={pill.key}
            id={'themingStudio-contrast-' + mode + '-' + pill.key}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75,
              px: 1.25, py: 0.5, borderRadius: '999px',
              border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: verdictColor(pill.ratio) }} />
            <Typography variant="caption" color="text.secondary">{pill.label}</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{pill.ratio.toFixed(1)}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default ContrastPills;
