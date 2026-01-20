// packages/international-patient-summary/client/sections/IPSAllergiesSection.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

function IPSAllergiesSection(props) {
  const [allergies, setAllergies] = useState([]);

  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  useEffect(function(){
    async function loadAllergies() {
      if(selectedPatientId && window.Collections?.AllergyIntolerances) {
        const patientAllergies = await window.Collections.AllergyIntolerances.find({
          'patient.reference': `Patient/${selectedPatientId}`
        }).fetch();
        setAllergies(patientAllergies);
      }
    }
    loadAllergies();
  }, [selectedPatientId]);

  function getCriticality(allergy) {
    const criticality = get(allergy, 'criticality', 'unknown');
    const criticalityColors = {
      'low': 'success',
      'high': 'error',
      'unable-to-assess': 'default'
    };
    return { criticality, color: criticalityColors[criticality] || 'default' };
  }

  function getVerificationStatus(allergy) {
    const status = get(allergy, 'verificationStatus.coding[0].code', 'unconfirmed');
    const statusColors = {
      'confirmed': 'success',
      'unconfirmed': 'warning',
      'refuted': 'default',
      'entered-in-error': 'error'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(allergies.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Allergies and Intolerances (Required)
        </Typography>
        <Alert severity="info">
          No known allergies or intolerances
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Allergies and Intolerances (Required)
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Relevant allergies or intolerances, including reaction type and criticality
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Allergen</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Criticality</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reaction</TableCell>
              <TableCell>Onset</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allergies.map((allergy, index) => {
              const { criticality, color: critColor } = getCriticality(allergy);
              const { status, color: statusColor } = getVerificationStatus(allergy);
              return (
                <TableRow key={allergy._id || index}>
                  <TableCell>
                    <Typography variant="body2">
                      {get(allergy, 'code.coding[0].display', 
                        get(allergy, 'code.text', 'Unknown allergen'))}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {get(allergy, 'code.coding[0].code', '')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {get(allergy, 'type', 'allergy')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={criticality} 
                      size="small" 
                      color={critColor}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={status} 
                      size="small" 
                      color={statusColor}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {get(allergy, 'reaction[0].manifestation[0].coding[0].display',
                      get(allergy, 'reaction[0].manifestation[0].text', '-'))}
                  </TableCell>
                  <TableCell>
                    {get(allergy, 'onsetDateTime') 
                      ? moment(get(allergy, 'onsetDateTime')).format('YYYY-MM-DD')
                      : get(allergy, 'onsetPeriod.start') 
                        ? moment(get(allergy, 'onsetPeriod.start')).format('YYYY-MM-DD')
                        : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default IPSAllergiesSection;