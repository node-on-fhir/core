// packages/international-patient-summary/client/sections/IPSMedicationsSection.jsx

import React from 'react';
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

function IPSMedicationsSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const medications = useTracker(function(){
    if(!selectedPatientId) return [];
    const meds = [];

    // Try MedicationStatements first
    if(window.Collections?.MedicationStatements) {
      const statements = window.Collections.MedicationStatements.find({}).fetch();
      meds.push(...statements.map(s => ({ ...s, _source: 'statement' })));
    }

    // Also check MedicationRequests
    if(window.Collections?.MedicationRequests) {
      const requests = window.Collections.MedicationRequests.find({}).fetch();
      meds.push(...requests.map(r => ({ ...r, _source: 'request' })));
    }

    return meds;
  }, [selectedPatientId]);

  function getStatus(medication) {
    if(medication._source === 'statement') {
      return get(medication, 'status', 'unknown');
    } else {
      return get(medication, 'status', 'unknown');
    }
  }

  function getStatusColor(status) {
    const statusColors = {
      'active': 'success',
      'completed': 'default',
      'entered-in-error': 'error',
      'intended': 'info',
      'stopped': 'warning',
      'on-hold': 'warning',
      'unknown': 'default',
      'not-taken': 'error'
    };
    return statusColors[status] || 'default';
  }

  function getMedicationName(medication) {
    // Try different paths for medication name
    return get(medication, 'medicationCodeableConcept.coding[0].display',
      get(medication, 'medicationCodeableConcept.text',
        get(medication, 'medicationReference.display', 'Unknown medication')));
  }

  function getDosage(medication) {
    if(medication._source === 'statement') {
      const dosage = get(medication, 'dosage[0]', {});
      const dose = get(dosage, 'doseAndRate[0].doseQuantity');
      const frequency = get(dosage, 'timing.repeat.frequency');
      const period = get(dosage, 'timing.repeat.period');
      const periodUnit = get(dosage, 'timing.repeat.periodUnit');
      
      if(dose) {
        let dosageStr = `${dose.value} ${dose.unit}`;
        if(frequency && period && periodUnit) {
          dosageStr += ` ${frequency}/${period} ${periodUnit}`;
        }
        return dosageStr;
      }
      return get(dosage, 'text', '-');
    } else {
      const dosage = get(medication, 'dosageInstruction[0]', {});
      return get(dosage, 'text', 
        get(dosage, 'doseAndRate[0].doseQuantity.value', '-') + ' ' +
        get(dosage, 'doseAndRate[0].doseQuantity.unit', ''));
    }
  }

  if(medications.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No medications recorded for this patient
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Patient's current and relevant medications
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Medication</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Dosage</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medications.map((medication, index) => {
              const status = getStatus(medication);
              return (
                <TableRow key={medication._id || index}>
                  <TableCell>
                    <Typography variant="body2">
                      {getMedicationName(medication)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {get(medication, 'medicationCodeableConcept.coding[0].code', '')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={status} 
                      size="small" 
                      color={getStatusColor(status)}
                    />
                  </TableCell>
                  <TableCell>{getDosage(medication)}</TableCell>
                  <TableCell>
                    {medication._source === 'statement'
                      ? get(medication, 'dosage[0].route.coding[0].display', 
                          get(medication, 'dosage[0].route.text', '-'))
                      : get(medication, 'dosageInstruction[0].route.coding[0].display',
                          get(medication, 'dosageInstruction[0].route.text', '-'))}
                  </TableCell>
                  <TableCell>
                    {get(medication, 'effectivePeriod.start')
                      ? moment(get(medication, 'effectivePeriod.start')).format('YYYY-MM-DD')
                      : get(medication, 'effectiveDateTime')
                        ? moment(get(medication, 'effectiveDateTime')).format('YYYY-MM-DD')
                        : get(medication, 'authoredOn')
                          ? moment(get(medication, 'authoredOn')).format('YYYY-MM-DD')
                          : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={medication._source} 
                      size="small" 
                      variant="outlined"
                    />
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

export default IPSMedicationsSection;