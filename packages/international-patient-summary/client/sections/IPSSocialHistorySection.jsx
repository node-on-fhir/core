// packages/international-patient-summary/client/sections/IPSSocialHistorySection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSSocialHistorySection(props) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Social History (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Tobacco use, alcohol use, and other social factors
      </Typography>
      <Alert severity="info">
        No social history recorded
      </Alert>
    </Box>
  );
}

export default IPSSocialHistorySection;