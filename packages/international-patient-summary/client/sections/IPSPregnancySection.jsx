// packages/international-patient-summary/client/sections/IPSPregnancySection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSPregnancySection(props) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        History of Pregnancy (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Pregnancy status and history summary
      </Typography>
      <Alert severity="info">
        No pregnancy history recorded
      </Alert>
    </Box>
  );
}

export default IPSPregnancySection;