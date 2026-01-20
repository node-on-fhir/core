// packages/international-patient-summary/client/sections/IPSFunctionalStatusSection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSFunctionalStatusSection(props) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Functional Status (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Patient's capability to perform activities of daily living
      </Typography>
      <Alert severity="info">
        No functional status assessment recorded
      </Alert>
    </Box>
  );
}

export default IPSFunctionalStatusSection;