// packages/international-patient-summary/client/sections/IPSAdvanceDirectivesSection.jsx

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

function IPSAdvanceDirectivesSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const consents = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Consents) return [];
    return window.Collections.Consents.find({}).fetch();
  }, [selectedPatientId]);

  function getStatus(consent) {
    const status = get(consent, 'status', 'unknown');
    const statusColors = {
      'active': 'success',
      'inactive': 'default',
      'draft': 'warning',
      'proposed': 'info',
      'rejected': 'error',
      'entered-in-error': 'error'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(consents.length === 0) {
    return (
      <Box>
        <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
          Patient's advance directives and supporting documents
        </Typography>
        <Alert severity="info">
          No advance directives recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Patient's advance directives and supporting documents
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Scope</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Policy Rule</TableCell>
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {consents.map(function(consent, index) {
              const { status, color } = getStatus(consent);
              const periodStart = get(consent, 'provision.period.start');
              const periodEnd = get(consent, 'provision.period.end');
              let periodDisplay = '-';
              if(periodStart) {
                periodDisplay = moment(periodStart).format('YYYY-MM-DD');
                if(periodEnd) {
                  periodDisplay += ' — ' + moment(periodEnd).format('YYYY-MM-DD');
                }
              }

              return (
                <TableRow
                  key={consent._id || index}
                  hover
                  onClick={function() { if(props.onResourceClick) props.onResourceClick(consent); }}
                  sx={{ cursor: props.onResourceClick ? 'pointer' : 'default' }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {get(consent, 'category[0].coding[0].display',
                        get(consent, 'category[0].text', 'Unknown category'))}
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
                    {get(consent, 'scope.coding[0].display',
                      get(consent, 'scope.text', '-'))}
                  </TableCell>
                  <TableCell>
                    {periodDisplay}
                  </TableCell>
                  <TableCell>
                    {get(consent, 'policyRule.coding[0].display',
                      get(consent, 'policyRule.text', '-'))}
                  </TableCell>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={function(e) { e.stopPropagation(); if(props.onResourceClick) props.onResourceClick(consent); }}>
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

export default IPSAdvanceDirectivesSection;
