// packages/international-patient-summary/client/sections/IPSImmunizationsSection.jsx

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
  Chip
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

function IPSImmunizationsSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const immunizations = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Immunizations) return [];
    return window.Collections.Immunizations.find({}).fetch();
  }, [selectedPatientId]);

  if(immunizations.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No immunization records found
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Patient's immunization status and history
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vaccine</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Site</TableCell>
              <TableCell>Lot Number</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {immunizations.map((immunization, index) => (
              <TableRow key={immunization._id || index}>
                <TableCell>
                  <Typography variant="body2">
                    {get(immunization, 'vaccineCode.coding[0].display', 
                      get(immunization, 'vaccineCode.text', 'Unknown vaccine'))}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={get(immunization, 'status', 'unknown')} 
                    size="small" 
                    color={get(immunization, 'status') === 'completed' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {get(immunization, 'occurrenceDateTime') 
                    ? moment(get(immunization, 'occurrenceDateTime')).format('YYYY-MM-DD')
                    : '-'}
                </TableCell>
                <TableCell>
                  {get(immunization, 'site.coding[0].display', '-')}
                </TableCell>
                <TableCell>
                  {get(immunization, 'lotNumber', '-')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default IPSImmunizationsSection;