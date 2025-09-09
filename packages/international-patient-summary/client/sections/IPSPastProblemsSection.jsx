// packages/international-patient-summary/client/sections/IPSPastProblemsSection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSPastProblemsSection(props) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        History of Past Problems (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Conditions the patient suffered in the past that are no longer active
      </Typography>
      <Alert severity="info">
        No past problems recorded
      </Alert>
    </Box>
  );
}

export default IPSPastProblemsSection;