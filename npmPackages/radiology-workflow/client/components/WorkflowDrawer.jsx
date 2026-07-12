// npmPackages/radiology-workflow/client/components/WorkflowDrawer.jsx

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// =============================================================================
// WORKFLOW DRAWER - Right-anchored MUI Drawer wrapper
// =============================================================================
//
// Right-anchored persistent drawer (~480px, full-width on mobile).
// Wraps workflow panels (safety screening, reading/signing).
// =============================================================================

function WorkflowDrawer({ open, onClose, title, subtitle, children }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 480 },
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          backgroundColor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2
        }}
      >
        {children}
      </Box>
    </Drawer>
  );
}

export default WorkflowDrawer;
