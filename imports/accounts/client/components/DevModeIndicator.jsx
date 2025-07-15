// imports/accounts/client/components/DevModeIndicator.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Box, Chip, Tooltip } from '@mui/material';
import { Warning } from '@mui/icons-material';

export function DevModeIndicator() {
  const user = Meteor.user();
  const isDevelopment = Meteor.isDevelopment;
  const isDevAccount = user?.profile?.isDevelopmentAccount;
  const autoLoginEnabled = user?.profile?.autoLoginEnabled;
  
  if (!isDevelopment || !isDevAccount || !autoLoginEnabled) {
    return null;
  }
  
  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: 16, 
        right: 16, 
        zIndex: 9999 
      }}
    >
      <Tooltip 
        title="This account was automatically logged in for development. This feature is disabled in production."
        placement="left"
      >
        <Chip
          icon={<Warning />}
          label="DEV AUTO-LOGIN"
          color="warning"
          variant="filled"
          sx={{
            backgroundColor: '#ff6b6b',
            color: 'white',
            fontWeight: 'bold',
            '& .MuiChip-icon': {
              color: 'white'
            }
          }}
        />
      </Tooltip>
    </Box>
  );
}