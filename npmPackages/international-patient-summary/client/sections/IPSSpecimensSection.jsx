// packages/international-patient-summary/client/sections/IPSSpecimensSection.jsx

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

function IPSSpecimensSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const specimens = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Specimens) return [];
    return window.Collections.Specimens.find({}).fetch();
  }, [selectedPatientId]);

  function getStatus(specimen) {
    const status = get(specimen, 'status', 'unknown');
    const statusColors = {
      'available': 'success',
      'unavailable': 'warning',
      'unsatisfactory': 'error',
      'entered-in-error': 'error'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(specimens.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No specimens recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Specimens collected from the patient
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Collection Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Body Site</TableCell>
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {specimens.map(function(specimen, index) {
              const { status, color } = getStatus(specimen);
              return (
                <TableRow
                  key={specimen._id || index}
                  hover
                  onClick={function() { if(props.onResourceClick) props.onResourceClick(specimen); }}
                  sx={{ cursor: props.onResourceClick ? 'pointer' : 'default' }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {get(specimen, 'type.coding[0].display',
                        get(specimen, 'type.text', 'Unknown specimen'))}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {get(specimen, 'type.coding[0].code', '')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {get(specimen, 'collection.collectedDateTime')
                      ? moment(get(specimen, 'collection.collectedDateTime')).format('YYYY-MM-DD')
                      : get(specimen, 'receivedTime')
                        ? moment(get(specimen, 'receivedTime')).format('YYYY-MM-DD')
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={status}
                      size="small"
                      color={color}
                    />
                  </TableCell>
                  <TableCell>
                    {get(specimen, 'collection.bodySite.coding[0].display',
                      get(specimen, 'collection.bodySite.text', '-'))}
                  </TableCell>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={function(e) { e.stopPropagation(); if(props.onResourceClick) props.onResourceClick(specimen); }}>
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

export default IPSSpecimensSection;
