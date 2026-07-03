// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/lab-test-reporting/client/LabTestReportingPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, Typography, Grid, Box, Button, 
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Alert, Tabs, Tab, Badge, IconButton,
  List, ListItem, ListItemText, ListItemIcon, Divider, Stack
} from '@mui/material';
import { 
  Science, Send, CheckCircle, Warning, Schedule, Assessment,
  LocalHospital, Public, Biotech, Timeline, Analytics,
  Description, CloudUpload, Verified, Error, Info
} from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

function LabTestReportingPage(props) {
  const [activeTab, setActiveTab] = useState(0);
  const [reportingStatus, setReportingStatus] = useState(null);
  const [transmissionQueue, setTransmissionQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load reporting data
  useEffect(function() {
    loadReportingData();
  }, []);

  function loadReportingData() {
    setLoading(true);
    
    // Simulate loading reporting status
    Meteor.call('labTestReporting.getReportingStatus', 'example-patient', {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    }, function(error, result) {
      if (error) {
        console.error('Error loading reporting status:', error);
      } else {
        setReportingStatus(result);
      }
      setLoading(false);
    });

    // Simulate transmission queue
    setTransmissionQueue([
      {
        id: 'lab-001',
        testType: 'SARS-CoV-2 RNA PCR',
        loincCode: '94500-6',
        result: 'Positive',
        patientId: 'P001',
        collectedDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'pending',
        priority: 'high',
        targetAgency: 'state-doh'
      },
      {
        id: 'lab-002', 
        testType: 'HIV-1 RNA Quantitative',
        loincCode: '16128-1',
        result: '< 20 copies/mL',
        patientId: 'P002',
        collectedDate: new Date(Date.now() - 172800000).toISOString(),
        status: 'transmitted',
        priority: 'routine',
        targetAgency: 'cdc'
      },
      {
        id: 'lab-003',
        testType: 'Hepatitis B Surface Antigen',
        loincCode: '32018-4', 
        result: 'Reactive',
        patientId: 'P003',
        collectedDate: new Date(Date.now() - 259200000).toISOString(),
        status: 'acknowledged',
        priority: 'urgent',
        targetAgency: 'state-doh'
      }
    ]);
  }

  function handleTransmitTest(testId) {
    setLoading(true);
    const test = transmissionQueue.find(t => t.id === testId);
    
    Meteor.call('labTestReporting.submitToAgency', testId, test.targetAgency, function(error, result) {
      if (error) {
        console.error('Error transmitting test:', error);
      } else {
        console.log('Test transmitted successfully:', result);
        loadReportingData(); // Refresh data
      }
      setLoading(false);
    });
  }

  function getStatusColor(status) {
    switch (status) {
      case 'pending': return 'warning';
      case 'transmitted': return 'info';
      case 'acknowledged': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'routine': return 'info';
      default: return 'default';
    }
  }

  // Real-time metrics component
  function ReportingMetrics() {
    if (!reportingStatus) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: theme => theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Assessment sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {reportingStatus.totalTests}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Lab Tests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: theme => theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Warning sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {reportingStatus.reportableTests}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Reportable Tests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: theme => theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Send sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {reportingStatus.transmittedTests}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Transmitted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: theme => theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Timeline sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {reportingStatus.complianceRate}%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Compliance Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // Public health agencies component
  function AgencyStatus() {
    if (!reportingStatus?.agencies) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Public Health Agency Status"
          avatar={<Public />}
        />
        <CardContent>
          <Grid container spacing={2}>
            {Object.entries(reportingStatus.agencies).map(function([agencyCode, agency]) {
              return (
                <Grid item xs={12} md={6} key={agencyCode}>
                  <Paper sx={{ p: 2, bgcolor: theme => theme.palette.background.default }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocalHospital sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">{agency.name}</Typography>
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                      <Chip 
                        label={`${agency.transmitted} Transmitted`}
                        color="success"
                        size="small"
                        icon={<CheckCircle />}
                      />
                      <Chip 
                        label={`${agency.pending} Pending`}
                        color="warning"
                        size="small"
                        icon={<Schedule />}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Last: {new Date(agency.lastSubmission).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  // Transmission queue component
  function TransmissionQueue() {
    return (
      <Card>
        <CardHeader 
          title="Laboratory Test Transmission Queue"
          avatar={<CloudUpload />}
          action={
            <Button 
              variant="contained" 
              startIcon={<Send />}
              onClick={() => console.log('Transmit all pending tests')}
              disabled={loading}
            >
              Transmit All
            </Button>
          }
        />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Test Type</TableCell>
                  <TableCell>LOINC</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Collected</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Agency</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transmissionQueue.map(function(test) {
                  return (
                    <TableRow key={test.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Science sx={{ mr: 1, fontSize: 16 }} />
                          {test.testType}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {test.loincCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: test.result.includes('Positive') || test.result.includes('Reactive') ? 'bold' : 'normal',
                            color: test.result.includes('Positive') || test.result.includes('Reactive') ? 'error.main' : 'text.primary'
                          }}
                        >
                          {test.result}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(test.collectedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={test.priority}
                          color={getPriorityColor(test.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={test.status}
                          color={getStatusColor(test.status)}
                          size="small"
                          icon={
                            test.status === 'acknowledged' ? <Verified /> :
                            test.status === 'transmitted' ? <CheckCircle /> :
                            test.status === 'error' ? <Error /> :
                            <Schedule />
                          }
                        />
                      </TableCell>
                      <TableCell>{test.targetAgency}</TableCell>
                      <TableCell>
                        {test.status === 'pending' && (
                          <IconButton 
                            size="small"
                            onClick={() => handleTransmitTest(test.id)}
                            disabled={loading}
                          >
                            <Send fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{
      p: 3,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Biotech sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Laboratory Test Reporting
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                ONC §170.315(f)(3) - Transmission to Public Health Agencies
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Automated transmission of reportable laboratory tests and values/results to public health agencies. 
              Supports FHIR R4, US Core Lab profiles, and HL7 V2 messaging for public health surveillance.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <ReportingMetrics />

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Transmission Queue" icon={<CloudUpload />} />
          <Tab label="Agency Status" icon={<Public />} />
          <Tab label="Compliance Analytics" icon={<Analytics />} />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && <TransmissionQueue />}
      
      {activeTab === 1 && <AgencyStatus />}
      
      {activeTab === 2 && (
        <Card>
          <CardHeader 
            title="Reporting Compliance Analytics"
            avatar={<Analytics />}
          />
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Advanced analytics dashboard for monitoring lab test reporting compliance, 
              transmission rates, and public health agency response times.
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Description sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Reportable Test Detection
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automated identification of reportable laboratory tests using LOINC codes and jurisdiction-specific requirements.
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Timeline sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Transmission Monitoring
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time tracking of test result transmissions with acknowledgment receipts and error handling.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
}

export default LabTestReportingPage;