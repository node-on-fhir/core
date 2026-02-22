// packages/international-patient-summary/client/sections/IPSProceduresSection.jsx

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
  Alert
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

function IPSProceduresSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const procedures = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Procedures) return [];
    return window.Collections.Procedures.find({}).fetch();
  }, [selectedPatientId]);

  function getStatus(procedure) {
    const status = get(procedure, 'status', 'unknown');
    const statusColors = {
      'completed': 'success',
      'in-progress': 'info',
      'preparation': 'warning',
      'not-done': 'default',
      'on-hold': 'warning',
      'stopped': 'error',
      'entered-in-error': 'error'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(procedures.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No procedures recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Significant procedures performed on or for the patient
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Procedure</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Performed</TableCell>
              <TableCell>Body Site</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {procedures.map(function(procedure, index) {
              const { status, color } = getStatus(procedure);
              return (
                <TableRow key={procedure._id || index}>
                  <TableCell>
                    <Typography variant="body2">
                      {get(procedure, 'code.coding[0].display',
                        get(procedure, 'code.text', 'Unknown procedure'))}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {get(procedure, 'code.coding[0].code', '')}
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
                    {get(procedure, 'performedDateTime')
                      ? moment(get(procedure, 'performedDateTime')).format('YYYY-MM-DD')
                      : get(procedure, 'performedPeriod.start')
                        ? moment(get(procedure, 'performedPeriod.start')).format('YYYY-MM-DD')
                        : '-'}
                  </TableCell>
                  <TableCell>
                    {get(procedure, 'bodySite[0].coding[0].display',
                      get(procedure, 'bodySite[0].text', '-'))}
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

export default IPSProceduresSection;
