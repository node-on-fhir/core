// packages/international-patient-summary/client/sections/IPSPastProblemsSection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSPastProblemsSection(props) {
  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Conditions the patient suffered in the past that are no longer active
      </Typography>
      <Alert severity="info">
        No past problems recorded
      </Alert>
    </Box>
  );
}

export default IPSPastProblemsSection;