// packages/international-patient-summary/client/sections/IPSAdvanceDirectivesSection.jsx

import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

function IPSAdvanceDirectivesSection(props) {
  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Patient's advance directives and supporting documents
      </Typography>
      <Alert severity="info">
        No advance directives recorded
      </Alert>
    </Box>
  );
}

export default IPSAdvanceDirectivesSection;