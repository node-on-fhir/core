// packages/international-patient-summary/client/sections/IPSVitalSignsSection.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { Box, Typography, Alert, Paper, Grid, Card, CardContent } from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';

function IPSVitalSignsSection(props) {
  const [vitalSigns, setVitalSigns] = useState([]);
  
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  useEffect(function(){
    async function loadVitalSigns() {
      if(selectedPatientId && window.Collections?.Observations) {
        const vitals = await window.Collections.Observations.find({
          'subject.reference': `Patient/${selectedPatientId}`,
          'category.coding.code': 'vital-signs'
        }).fetch();
        setVitalSigns(vitals);
      }
    }
    loadVitalSigns();
  }, [selectedPatientId]);

  if(vitalSigns.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Vital Signs (Optional)
        </Typography>
        <Alert severity="info">
          No vital signs recorded
        </Alert>
      </Box>
    );
  }

  // Group vital signs by type
  const vitalsByType = {};
  vitalSigns.forEach(vital => {
    const code = get(vital, 'code.coding[0].code', 'unknown');
    if(!vitalsByType[code]) {
      vitalsByType[code] = [];
    }
    vitalsByType[code].push(vital);
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Vital Signs (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Recent vital signs including blood pressure, temperature, heart rate, and respiratory rate
      </Typography>
      
      <Grid container spacing={2}>
        {Object.entries(vitalsByType).map(([type, vitals]) => {
          const latestVital = vitals[0];
          return (
            <Grid item xs={12} sm={6} md={4} key={type}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    {get(latestVital, 'code.coding[0].display', type)}
                  </Typography>
                  <Typography variant="h5">
                    {get(latestVital, 'valueQuantity.value', '-')} {get(latestVital, 'valueQuantity.unit', '')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {get(latestVital, 'effectiveDateTime')
                      ? moment(get(latestVital, 'effectiveDateTime')).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default IPSVitalSignsSection;