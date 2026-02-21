// packages/international-patient-summary/client/sections/IPSPregnancySection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSPregnancySection(props) {
  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Pregnancy status and history summary
      </Typography>
      <Alert severity="info">
        No pregnancy history recorded
      </Alert>
    </Box>
  );
}

export default IPSPregnancySection;