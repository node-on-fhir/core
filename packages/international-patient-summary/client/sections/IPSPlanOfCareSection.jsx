// packages/international-patient-summary/client/sections/IPSPlanOfCareSection.jsx

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

function IPSPlanOfCareSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const carePlans = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.CarePlans) return [];
    return window.Collections.CarePlans.find({}).fetch();
  }, [selectedPatientId]);

  function getStatus(carePlan) {
    const status = get(carePlan, 'status', 'unknown');
    const statusColors = {
      'active': 'success',
      'completed': 'default',
      'draft': 'warning',
      'revoked': 'error',
      'on-hold': 'warning',
      'entered-in-error': 'error'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(carePlans.length === 0) {
    return (
      <Box>
        <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
          Expectations for care including proposals, goals, and orders
        </Typography>
        <Alert severity="info">
          No care plan recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Expectations for care including proposals, goals, and orders
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Intent</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Description</TableCell>
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {carePlans.map(function(carePlan, index) {
              const { status, color } = getStatus(carePlan);
              const periodStart = get(carePlan, 'period.start');
              const periodEnd = get(carePlan, 'period.end');
              let periodDisplay = '-';
              if(periodStart) {
                periodDisplay = moment(periodStart).format('YYYY-MM-DD');
                if(periodEnd) {
                  periodDisplay += ' — ' + moment(periodEnd).format('YYYY-MM-DD');
                }
              }

              return (
                <TableRow
                  key={carePlan._id || index}
                  hover
                  onClick={function() { if(props.onResourceClick) props.onResourceClick(carePlan); }}
                  sx={{ cursor: props.onResourceClick ? 'pointer' : 'default' }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {get(carePlan, 'title', 'Untitled care plan')}
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
                    {get(carePlan, 'intent', '-')}
                  </TableCell>
                  <TableCell>
                    {get(carePlan, 'category[0].coding[0].display',
                      get(carePlan, 'category[0].text', '-'))}
                  </TableCell>
                  <TableCell>
                    {periodDisplay}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {get(carePlan, 'description', '-')}
                    </Typography>
                  </TableCell>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={function(e) { e.stopPropagation(); if(props.onResourceClick) props.onResourceClick(carePlan); }}>
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

export default IPSPlanOfCareSection;
