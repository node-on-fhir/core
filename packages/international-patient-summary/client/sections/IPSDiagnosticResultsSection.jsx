// packages/international-patient-summary/client/sections/IPSDiagnosticResultsSection.jsx

import React, { useState } from 'react';
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
  Tabs,
  Tab
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

function IPSDiagnosticResultsSection(props) {
  const [tabIndex, setTabIndex] = useState(0);

  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const observations = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Observations) return [];
    return window.Collections.Observations.find({
      'category.coding.code': { $in: ['laboratory', 'vital-signs'] }
    }).fetch();
  }, [selectedPatientId]);

  const diagnosticReports = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.DiagnosticReports) return [];
    return window.Collections.DiagnosticReports.find({}).fetch();
  }, [selectedPatientId]);

  if(observations.length === 0 && diagnosticReports.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No diagnostic results available
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Laboratory, pathology, and radiology results
      </Typography>
      
      <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{ mb: 2 }}>
        <Tab label={`Lab Results (${observations.length})`} />
        <Tab label={`Reports (${diagnosticReports.length})`} />
      </Tabs>
      
      {tabIndex === 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Test</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Reference Range</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {observations.map((obs, index) => (
                <TableRow key={obs._id || index}>
                  <TableCell>
                    {get(obs, 'code.coding[0].display', 
                      get(obs, 'code.text', 'Unknown test'))}
                  </TableCell>
                  <TableCell>
                    {get(obs, 'valueQuantity.value', '')} {get(obs, 'valueQuantity.unit', '')}
                    {get(obs, 'valueString', '')}
                  </TableCell>
                  <TableCell>
                    {get(obs, 'referenceRange[0].text', '-')}
                  </TableCell>
                  <TableCell>
                    {get(obs, 'effectiveDateTime') 
                      ? moment(get(obs, 'effectiveDateTime')).format('YYYY-MM-DD')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {get(obs, 'status', 'unknown')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {tabIndex === 1 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Report</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {diagnosticReports.map((report, index) => (
                <TableRow key={report._id || index}>
                  <TableCell>
                    {get(report, 'code.coding[0].display', 
                      get(report, 'code.text', 'Unknown report'))}
                  </TableCell>
                  <TableCell>
                    {get(report, 'category[0].coding[0].display', '-')}
                  </TableCell>
                  <TableCell>
                    {get(report, 'effectiveDateTime') 
                      ? moment(get(report, 'effectiveDateTime')).format('YYYY-MM-DD')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {get(report, 'status', 'unknown')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default IPSDiagnosticResultsSection;