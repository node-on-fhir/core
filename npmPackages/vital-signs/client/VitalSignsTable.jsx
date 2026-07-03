// packages/vital-signs/client/VitalSignsTable.jsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';

export function VitalSignsTable({ observations }) {
  // Sort observations by date, newest first
  const sortedObservations = observations.sort((a, b) => {
    const dateA = new Date(a.effectiveDateTime || a.effectivePeriod?.start);
    const dateB = new Date(b.effectiveDateTime || b.effectivePeriod?.start);
    return dateB - dateA;
  });

  const getObservationType = (observation) => {
    const code = get(observation, 'code.coding[0].code');
    const display = get(observation, 'code.coding[0].display', '');
    
    // Map common LOINC codes to friendly names
    const typeMap = {
      '8867-4': 'Heart Rate',
      '8302-2': 'Body Height',
      '29463-7': 'Body Weight',
      '39156-5': 'BMI',
      '8310-5': 'Body Temperature',
      '9279-1': 'Respiratory Rate',
      '8480-6': 'Systolic BP',
      '8462-4': 'Diastolic BP',
      '85354-9': 'Blood Pressure',
      '2708-6': 'Oxygen Saturation'
    };
    
    return typeMap[code] || display || code || 'Unknown';
  };

  const getObservationValue = (observation) => {
    // Check for component-based observations (like blood pressure)
    if (observation.component && observation.component.length > 0) {
      return observation.component.map((comp, index) => {
        const componentDisplay = get(comp, 'code.coding[0].display', '');
        const value = get(comp, 'valueQuantity.value', '');
        const unit = get(comp, 'valueQuantity.unit', '');
        return (
          <div key={index}>
            {componentDisplay}: {value} {unit}
          </div>
        );
      });
    }

    // Single value observation
    const value = get(observation, 'valueQuantity.value', '');
    const unit = get(observation, 'valueQuantity.unit', '');
    const valueString = get(observation, 'valueString', '');
    
    if (value && unit) {
      return `${value} ${unit}`;
    } else if (valueString) {
      return valueString;
    }
    
    return 'No value';
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'final': 'success',
      'preliminary': 'warning',
      'entered-in-error': 'error',
      'unknown': 'default'
    };
    return statusColors[status] || 'default';
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date/Time</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedObservations.map((observation, index) => {
            const dateTime = observation.effectiveDateTime || observation.effectivePeriod?.start;
            const formattedDate = dateTime ? moment(dateTime).format('MMM DD, YYYY h:mm A') : 'Unknown';
            
            return (
              <TableRow key={observation.id || index} hover>
                <TableCell>{formattedDate}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {getObservationType(observation)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>{getObservationValue(observation)}</Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={observation.status || 'unknown'} 
                    size="small" 
                    color={getStatusColor(observation.status)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {get(observation, 'note[0].text', '')}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}