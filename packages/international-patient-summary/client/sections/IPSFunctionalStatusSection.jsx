// packages/international-patient-summary/client/sections/IPSFunctionalStatusSection.jsx

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

function IPSFunctionalStatusSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const clinicalImpressions = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.ClinicalImpressions) return [];
    return window.Collections.ClinicalImpressions.find({}).fetch();
  }, [selectedPatientId]);

  function getStatus(impression) {
    const status = get(impression, 'status', 'unknown');
    const statusColors = {
      'in-progress': 'info',
      'completed': 'success',
      'entered-in-error': 'error'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(clinicalImpressions.length === 0) {
    return (
      <Box>
        <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
          Patient's capability to perform activities of daily living
        </Typography>
        <Alert severity="info">
          No functional status assessment recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Patient's capability to perform activities of daily living
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Finding</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clinicalImpressions.map(function(impression, index) {
              const { status, color } = getStatus(impression);
              return (
                <TableRow key={impression._id || index}>
                  <TableCell>
                    <Typography variant="body2">
                      {get(impression, 'description',
                        get(impression, 'summary', 'No description'))}
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
                    {get(impression, 'finding[0].itemCodeableConcept.coding[0].display',
                      get(impression, 'finding[0].itemCodeableConcept.text', '-'))}
                  </TableCell>
                  <TableCell>
                    {get(impression, 'effectiveDateTime')
                      ? moment(get(impression, 'effectiveDateTime')).format('YYYY-MM-DD')
                      : get(impression, 'effectivePeriod.start')
                        ? moment(get(impression, 'effectivePeriod.start')).format('YYYY-MM-DD')
                        : get(impression, 'date')
                          ? moment(get(impression, 'date')).format('YYYY-MM-DD')
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

export default IPSFunctionalStatusSection;
