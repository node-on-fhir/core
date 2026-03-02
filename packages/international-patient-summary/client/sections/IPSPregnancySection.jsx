// packages/international-patient-summary/client/sections/IPSPregnancySection.jsx

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
  Alert,
  IconButton
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

// IPS pregnancy-related LOINC codes
const pregnancyLoinCodes = [
  '82810-3',  // Pregnancy status
  '11636-8',  // Number of births live
  '11637-6',  // Number of births preterm
  '11638-4',  // Number of births still living
  '11639-2',  // Number of births term
  '11640-0',  // Number of pregnancies
  '33065-4'   // Expected delivery date (corrected code)
];

function IPSPregnancySection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const observations = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Observations) return [];

    // Try LOINC codes first
    let results = window.Collections.Observations.find({
      'code.coding.code': { $in: pregnancyLoinCodes }
    }).fetch();

    // Fallback to category-based query
    if(results.length === 0) {
      results = window.Collections.Observations.find({
        'category.coding.code': 'pregnancy'
      }).fetch();
    }

    return results;
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

    const valueDateTime = get(observation, 'valueDateTime');
    if(valueDateTime) return moment(valueDateTime).format('YYYY-MM-DD');

    return '-';
  }

  if(observations.length === 0) {
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

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Pregnancy status and history summary
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Observation</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Date</TableCell>
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {observations.map(function(observation, index) {
              return (
                <TableRow
                  key={observation._id || index}
                  hover
                  onClick={function() { if(props.onResourceClick) props.onResourceClick(observation); }}
                  sx={{ cursor: props.onResourceClick ? 'pointer' : 'default' }}
                >
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
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={function(e) { e.stopPropagation(); if(props.onResourceClick) props.onResourceClick(observation); }}>
                      <SearchIcon fontSize="small" />
                    </IconButton>
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

export default IPSPregnancySection;
