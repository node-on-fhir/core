// packages/international-patient-summary/client/sections/IPSSocialHistorySection.jsx

import React from 'react';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

function IPSSocialHistorySection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const observations = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Observations) return [];
    return window.Collections.Observations.find({
      'category.coding.code': 'social-history'
    }).fetch();
  }, [selectedPatientId]);

  function getValue(observation) {
    const valueCodeable = get(observation, 'valueCodeableConcept.coding[0].display',
      get(observation, 'valueCodeableConcept.text'));
    if(valueCodeable) return valueCodeable;

    const valueQuantity = get(observation, 'valueQuantity.value');
    const valueUnit = get(observation, 'valueQuantity.unit', '');
    if(valueQuantity !== undefined) return valueQuantity + ' ' + valueUnit;

    const valueString = get(observation, 'valueString');
    if(valueString) return valueString;

    return '-';
  }

  if(observations.length === 0) {
    return (
      <Box>
        <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
          Tobacco use, alcohol use, and other social factors
        </Typography>
        <Alert severity="info">
          No social history recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Tobacco use, alcohol use, and other social factors
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Observation</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {observations.map(function(observation, index) {
              return (
                <TableRow key={observation._id || index}>
                  <TableCell>
                    <Typography variant="body2">
                      {get(observation, 'code.coding[0].display',
                        get(observation, 'code.text', 'Unknown observation'))}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {get(observation, 'code.coding[0].code', '')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getValue(observation)}
                  </TableCell>
                  <TableCell>
                    {get(observation, 'effectiveDateTime')
                      ? moment(get(observation, 'effectiveDateTime')).format('YYYY-MM-DD')
                      : get(observation, 'effectivePeriod.start')
                        ? moment(get(observation, 'effectivePeriod.start')).format('YYYY-MM-DD')
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

export default IPSSocialHistorySection;
