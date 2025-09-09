// packages/international-patient-summary/client/sections/IPSMedicalDevicesSection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSMedicalDevicesSection(props) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Medical Devices (Recommended)
      </Typography>
      <Alert severity="info">
        No medical devices recorded
      </Alert>
    </Box>
  );
}

export default IPSMedicalDevicesSection;