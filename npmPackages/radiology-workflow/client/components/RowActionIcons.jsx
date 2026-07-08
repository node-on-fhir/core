// npmPackages/radiology-workflow/client/components/RowActionIcons.jsx

import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';

// =============================================================================
// ROW ACTION ICONS - Configurable per-row action icon buttons
// =============================================================================
//
// Renders a horizontal row of icon buttons for worklist row actions.
// Each action: { icon: <MuiIcon />, tooltip: 'Label', onClick: fn, color: 'default' }
// =============================================================================

function RowActionIcons({ actions, row }) {
  if (!actions || actions.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
      {actions.map(function(action, index) {
        if (action.hidden && action.hidden(row)) return null;

        return (
          <Tooltip key={index} title={action.tooltip || ''} arrow>
            <span>
              <IconButton
                size="small"
                color={action.color || 'default'}
                disabled={action.disabled ? action.disabled(row) : false}
                onClick={function(e) {
                  e.stopPropagation();
                  if (action.onClick) {
                    action.onClick(row);
                  }
                }}
                sx={{ p: 0.5 }}
              >
                {action.icon}
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Box>
  );
}

export default RowActionIcons;
