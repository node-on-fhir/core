// packages/international-patient-summary/client/sections/IPSProblemsSection.jsx

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

function IPSProblemsSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const conditions = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Conditions) return [];
    return window.Collections.Conditions.find({}).fetch();
  }, [selectedPatientId]);

  function getSeverity(condition) {
    const severity = get(condition, 'severity.coding[0].display', 
                        get(condition, 'severity.text', 'Unknown'));
    return severity;
  }

  function getClinicalStatus(condition) {
    const status = get(condition, 'clinicalStatus.coding[0].code', 'unknown');
    const statusColors = {
      'active': 'warning',
      'recurrence': 'warning',
      'relapse': 'warning',
      'inactive': 'default',
      'remission': 'success',
      'resolved': 'success'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(conditions.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Problem List (Required)
        </Typography>
        <Alert severity="info">
          No problems recorded for this patient
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Problem List (Required)
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Clinical problems or conditions currently being monitored for the patient
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Condition</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Onset</TableCell>
              <TableCell>Recorded</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conditions.map((condition, index) => {
              const { status, color } = getClinicalStatus(condition);
              return (
                <TableRow key={condition._id || index}>
                  <TableCell>
                    <Typography variant="body2">
                      {get(condition, 'code.coding[0].display', 
                        get(condition, 'code.text', 'Unknown condition'))}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {get(condition, 'code.coding[0].code', '')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={status} 
                      size="small" 
                      color={color}
                    />
                  </TableCell>
                  <TableCell>{getSeverity(condition)}</TableCell>
                  <TableCell>
                    {get(condition, 'onsetDateTime') 
                      ? moment(get(condition, 'onsetDateTime')).format('YYYY-MM-DD')
                      : get(condition, 'onsetPeriod.start') 
                        ? moment(get(condition, 'onsetPeriod.start')).format('YYYY-MM-DD')
                        : '-'}
                  </TableCell>
                  <TableCell>
                    {get(condition, 'recordedDate') 
                      ? moment(get(condition, 'recordedDate')).format('YYYY-MM-DD')
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

export default IPSProblemsSection;