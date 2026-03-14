// packages/international-patient-summary/client/sections/IPSPastProblemsSection.jsx

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
  Chip,
  Alert,
  IconButton
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';
import SearchIcon from '@mui/icons-material/Search';

function IPSPastProblemsSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const pastConditions = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Conditions) return [];
    return window.Collections.Conditions.find({
      'clinicalStatus.coding.0.code': { $in: ['inactive', 'resolved', 'remission'] }
    }).fetch();
  }, [selectedPatientId]);

  function getSeverity(condition) {
    const severity = get(condition, 'severity.coding[0].display',
                        get(condition, 'severity.text', 'Unknown'));
    return severity;
  }

  function getClinicalStatus(condition) {
    const status = get(condition, 'clinicalStatus.coding[0].code', 'unknown');
    const statusColors = {
      'inactive': 'default',
      'remission': 'success',
      'resolved': 'success'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(pastConditions.length === 0) {
    return (
      <Box>
        <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
          Conditions the patient suffered in the past that are no longer active
        </Typography>
        <Alert severity="info">
          No past problems recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Conditions the patient suffered in the past that are no longer active
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
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {pastConditions.map(function(condition, index) {
              const { status, color } = getClinicalStatus(condition);
              return (
                <TableRow
                  key={condition._id || index}
                  hover
                  onClick={function() { if(props.onResourceClick) props.onResourceClick(condition); }}
                  sx={{ cursor: props.onResourceClick ? 'pointer' : 'default' }}
                >
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
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={function(e) { e.stopPropagation(); if(props.onResourceClick) props.onResourceClick(condition); }}>
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

export default IPSPastProblemsSection;
