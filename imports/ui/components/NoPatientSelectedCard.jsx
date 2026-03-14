// imports/ui/components/NoPatientSelectedCard.jsx

import React from 'react';
import { Card, CardHeader, CardContent, Box } from '@mui/material';

export function NoPatientSelectedCard() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, p: 4 }}>
      <Card sx={{ minHeight: '200px', maxWidth: '600px', width: '100%', backgroundColor: 'background.paper' }}>
        <CardContent sx={{ fontSize: '100%', pb: '28px', pt: '50px', textAlign: 'center' }}>
          <CardHeader
            title="Cohort data available."
            subheader="Please select a patient."
            sx={{ fontSize: '100%', whiteSpace: 'nowrap' }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

export default NoPatientSelectedCard;
