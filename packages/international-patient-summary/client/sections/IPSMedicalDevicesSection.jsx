// packages/international-patient-summary/client/sections/IPSMedicalDevicesSection.jsx

import React from 'react';
import { Box, Alert } from '@mui/material';

function IPSMedicalDevicesSection(props) {
  return (
    <Box>
      <Alert severity="info">
        No medical devices recorded
      </Alert>
    </Box>
  );
}

export default IPSMedicalDevicesSection;