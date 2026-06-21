// packages/international-patient-summary/client/sections/IPSMolecularSequencesSection.jsx

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
import SearchIcon from '@mui/icons-material/Search';

function IPSMolecularSequencesSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const molecularSequences = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.MolecularSequences) return [];
    return window.Collections.MolecularSequences.find({}).fetch();
  }, [selectedPatientId]);

  function getTypeChip(sequence) {
    const type = get(sequence, 'type', 'unknown');
    const typeColors = {
      'aa': 'info',
      'dna': 'success',
      'rna': 'warning'
    };
    return { type, color: typeColors[type] || 'default' };
  }

  if(molecularSequences.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No molecular sequences recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Molecular sequence data for the patient
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Coordinate System</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Identifier</TableCell>
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {molecularSequences.map(function(sequence, index) {
              const { type, color } = getTypeChip(sequence);
              return (
                <TableRow
                  key={sequence._id || index}
                  hover
                  onClick={function() { if(props.onResourceClick) props.onResourceClick(sequence); }}
                  sx={{ cursor: props.onResourceClick ? 'pointer' : 'default' }}
                >
                  <TableCell>
                    <Chip
                      label={type.toUpperCase()}
                      size="small"
                      color={color}
                    />
                  </TableCell>
                  <TableCell>
                    {get(sequence, 'coordinateSystem', '-')}
                  </TableCell>
                  <TableCell>
                    {get(sequence, 'patient.display',
                      get(sequence, 'patient.reference', '-'))}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {get(sequence, 'identifier[0].value',
                        get(sequence, 'id', '-'))}
                    </Typography>
                  </TableCell>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={function(e) { e.stopPropagation(); if(props.onResourceClick) props.onResourceClick(sequence); }}>
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

export default IPSMolecularSequencesSection;
