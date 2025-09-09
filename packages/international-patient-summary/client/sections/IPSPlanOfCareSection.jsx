// packages/international-patient-summary/client/sections/IPSPlanOfCareSection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSPlanOfCareSection(props) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Plan of Care (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Expectations for care including proposals, goals, and orders
      </Typography>
      <Alert severity="info">
        No care plan recorded
      </Alert>
    </Box>
  );
}

export default IPSPlanOfCareSection;