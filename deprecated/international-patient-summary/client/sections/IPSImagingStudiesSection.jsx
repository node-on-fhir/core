// packages/international-patient-summary/client/sections/IPSImagingStudiesSection.jsx

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

function IPSImagingStudiesSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const imagingStudies = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.ImagingStudies) return [];
    return window.Collections.ImagingStudies.find({}).fetch();
  }, [selectedPatientId]);

  function getStatus(study) {
    const status = get(study, 'status', 'unknown');
    const statusColors = {
      'registered': 'default',
      'available': 'success',
      'cancelled': 'error',
      'entered-in-error': 'error',
      'unknown': 'default'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(imagingStudies.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No imaging studies recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Imaging studies performed on the patient
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Modality</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Status</TableCell>
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {imagingStudies.map(function(study, index) {
              const { status, color } = getStatus(study);
              return (
                <TableRow
                  key={study._id || index}
                  hover
                  onClick={function() { if(props.onResourceClick) props.onResourceClick(study); }}
                  sx={{ cursor: props.onResourceClick ? 'pointer' : 'default' }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {get(study, 'modality[0].coding[0].display',
                        get(study, 'modality[0].coding[0].code',
                          get(study, 'modality[0].code', '-')))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {get(study, 'description',
                        get(study, 'note[0].text', '-'))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {get(study, 'started')
                      ? moment(get(study, 'started')).format('YYYY-MM-DD')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={status}
                      size="small"
                      color={color}
                    />
                  </TableCell>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={function(e) { e.stopPropagation(); if(props.onResourceClick) props.onResourceClick(study); }}>
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

export default IPSImagingStudiesSection;
