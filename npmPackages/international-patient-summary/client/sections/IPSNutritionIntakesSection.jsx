// packages/international-patient-summary/client/sections/IPSNutritionIntakesSection.jsx

import React from 'react';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Box,
  IconButton,
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
import SearchIcon from '@mui/icons-material/Search';

function IPSNutritionIntakesSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const nutritionIntakes = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.NutritionIntakes) return [];
    return window.Collections.NutritionIntakes.find({}).fetch();
  }, [selectedPatientId]);

  function getStatus(intake) {
    const status = get(intake, 'status', 'unknown');
    const statusColors = {
      'active': 'success',
      'completed': 'success',
      'entered-in-error': 'error',
      'intended': 'info',
      'stopped': 'warning',
      'on-hold': 'warning',
      'not-done': 'default'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(nutritionIntakes.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No nutrition intakes recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Nutrition and dietary intake records for the patient
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Food / Item</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Performer</TableCell>
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {nutritionIntakes.map(function(intake, index) {
              const { status, color } = getStatus(intake);
              return (
                <TableRow
                  key={intake._id || index}
                  hover
                  onClick={function() { if(props.onResourceClick) props.onResourceClick(intake); }}
                  sx={{ cursor: props.onResourceClick ? 'pointer' : 'default' }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {get(intake, 'code.coding[0].display',
                        get(intake, 'code.text',
                          get(intake, 'consumedItem[0].nutritionProduct.coding[0].display',
                            get(intake, 'consumedItem[0].nutritionProduct.text', 'Unknown item'))))}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {get(intake, 'code.coding[0].code', '')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={status}
                      size="small"
                      color={color}
                    />
                  </TableCell>
                  <TableCell>
                    {get(intake, 'occurrenceDateTime')
                      ? moment(get(intake, 'occurrenceDateTime')).format('YYYY-MM-DD')
                      : get(intake, 'occurrencePeriod.start')
                        ? moment(get(intake, 'occurrencePeriod.start')).format('YYYY-MM-DD')
                        : '-'}
                  </TableCell>
                  <TableCell>
                    {get(intake, 'performer[0].actor.display',
                      get(intake, 'performer[0].actor.reference', '-'))}
                  </TableCell>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={function(e) { e.stopPropagation(); if(props.onResourceClick) props.onResourceClick(intake); }}>
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

export default IPSNutritionIntakesSection;
