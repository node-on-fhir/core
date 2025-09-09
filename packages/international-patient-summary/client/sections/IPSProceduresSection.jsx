// packages/international-patient-summary/client/sections/IPSProceduresSection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSProceduresSection(props) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        History of Procedures (Recommended)
      </Typography>
      <Alert severity="info">
        No procedures recorded
      </Alert>
    </Box>
  );
}

export default IPSProceduresSection;