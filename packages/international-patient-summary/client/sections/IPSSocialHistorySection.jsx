// packages/international-patient-summary/client/sections/IPSSocialHistorySection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSSocialHistorySection(props) {
  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Tobacco use, alcohol use, and other social factors
      </Typography>
      <Alert severity="info">
        No social history recorded
      </Alert>
    </Box>
  );
}

export default IPSSocialHistorySection;