// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/antimicrobial-reporting/client/AntimicrobialReportingPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, Typography, Grid, Box, Button, 
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Alert, Tabs, Tab, Badge, IconButton,
  List, ListItem, ListItemText, ListItemIcon, Divider, Stack
} from '@mui/material';
import { 
  Biotech, Send, CheckCircle, Warning, Schedule, Assessment,
  LocalHospital, Public, Science, Timeline, Analytics,
  Description, CloudUpload, Verified, Error, Info, BugReport,
  Shield, Security, Coronavirus, Medication
} from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

function AntimicrobialReportingPage(props) {
  const [activeTab, setActiveTab] = useState(0);
  const [surveillanceStatus, setSurveillanceStatus] = useState(null);
  const [cultureQueue, setCultureQueue] = useState([]);
  const [resistanceAlerts, setResistanceAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load surveillance data
  useEffect(function() {
    loadSurveillanceData();
  }, []);

  function loadSurveillanceData() {
    setLoading(true);
    
    // Load surveillance status
    Meteor.call('antimicrobialReporting.getSurveillanceStatus', 'facility-001', {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    }, function(error, result) {
      if (error) {
        console.error('Error loading surveillance status:', error);
      } else {
        setSurveillanceStatus(result);
      }
      setLoading(false);
    });

    // Simulate culture reporting queue
    setCultureQueue([
      {
        id: 'culture-001',
        patientName: 'Jane Doe',
        patientId: 'P001',
        organism: 'MRSA',
        organismCode: '115329001',
        specimen: 'Blood culture',
        collectionDate: new Date(Date.now() - 86400000).toISOString(),
        testMethod: 'broth-microdilution',
        resistancePattern: ['methicillin', 'clindamycin'],
        status: 'pending',
        priority: 'high',
        reportType: 'nhsn'
      },
      {
        id: 'culture-002',
        patientName: 'Robert Smith',
        patientId: 'P002',
        organism: 'VRE',
        organismCode: '113727004',
        specimen: 'Urine culture',
        collectionDate: new Date(Date.now() - 172800000).toISOString(),
        testMethod: 'automated-system',
        resistancePattern: ['vancomycin', 'ampicillin'],
        status: 'transmitted',
        priority: 'critical',
        reportType: 'nhsn'
      },
      {
        id: 'culture-003',
        patientName: 'Maria Garcia',
        patientId: 'P003',
        organism: 'C. difficile',
        organismCode: '398584003',
        specimen: 'Stool specimen',
        collectionDate: new Date(Date.now() - 259200000).toISOString(),
        testMethod: 'molecular',
        resistancePattern: ['fluoroquinolone'],
        status: 'acknowledged',
        priority: 'high',
        reportType: 'state-health'
      }
    ]);

    // Simulate resistance alerts
    setResistanceAlerts([
      {
        id: 'alert-001',
        patientId: 'P001',
        organism: 'MRSA',
        alertLevel: 'critical',
        detectedAt: new Date(Date.now() - 3600000).toISOString(),
        isolationPrecautions: 'contact-plus'
      },
      {
        id: 'alert-002',
        patientId: 'P004',
        organism: 'CRE',
        alertLevel: 'critical',
        detectedAt: new Date(Date.now() - 7200000).toISOString(),
        isolationPrecautions: 'contact-plus'
      }
    ]);
  }

  function handleTransmitCulture(cultureId) {
    setLoading(true);
    const culture = cultureQueue.find(c => c.id === cultureId);
    
    Meteor.call('antimicrobialReporting.submitToAgency', cultureId, culture.reportType, function(error, result) {
      if (error) {
        console.error('Error transmitting culture:', error);
      } else {
        console.log('Culture transmitted successfully:', result);
        loadSurveillanceData(); // Refresh data
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
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'moderate': return 'info';
      default: return 'default';
    }
  }

  function getAlertColor(level) {
    switch (level) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'moderate': return 'info';
      default: return 'default';
    }
  }

  // Real-time surveillance metrics
  function SurveillanceMetrics() {
    if (!surveillanceStatus) return null;

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
              <Science sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {surveillanceStatus.totalCultures}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Cultures
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            background: theme => theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`,
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <BugReport sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {surveillanceStatus.resistantOrganisms}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Resistant Organisms
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
                {surveillanceStatus.transmittedReports}
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
              <Shield sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {surveillanceStatus.complianceRate}%
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

  // Agency status component
  function AgencyStatus() {
    if (!surveillanceStatus?.agencies) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Surveillance Agency Status"
          avatar={<Public />}
        />
        <CardContent>
          <Grid container spacing={2}>
            {Object.entries(surveillanceStatus.agencies).map(function([agencyCode, agency]) {
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
          
          {/* Resistance Profile */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Resistance Profile (Last 30 Days)</Typography>
            <Grid container spacing={1}>
              {Object.entries(surveillanceStatus.resistanceProfile || {}).map(function([organism, count]) {
                return (
                  <Grid item key={organism}>
                    <Chip 
                      label={`${organism}: ${count}`}
                      variant="outlined"
                      size="small"
                      color={count > 10 ? 'error' : count > 5 ? 'warning' : 'default'}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Culture transmission queue
  function CultureQueue() {
    return (
      <Card>
        <CardHeader 
          title="Culture Surveillance Queue"
          avatar={<CloudUpload />}
          action={
            <Button 
              variant="contained" 
              startIcon={<Send />}
              onClick={() => console.log('Transmit all pending cultures')}
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
                  <TableCell>Patient</TableCell>
                  <TableCell>Organism</TableCell>
                  <TableCell>Specimen</TableCell>
                  <TableCell>Collection Date</TableCell>
                  <TableCell>Test Method</TableCell>
                  <TableCell>Resistance</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Report To</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cultureQueue.map(function(culture) {
                  return (
                    <TableRow key={culture.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {culture.patientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {culture.patientId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Coronavirus sx={{ mr: 1, fontSize: 16, color: 'error.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            {culture.organism}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {culture.specimen}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(culture.collectionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {culture.testMethod}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="column" spacing={0.5}>
                          {culture.resistancePattern.map(function(resistance, index) {
                            return (
                              <Chip 
                                key={index}
                                label={resistance}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            );
                          })}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={culture.priority}
                          color={getPriorityColor(culture.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={culture.status}
                          color={getStatusColor(culture.status)}
                          size="small"
                          icon={
                            culture.status === 'acknowledged' ? <Verified /> :
                            culture.status === 'transmitted' ? <CheckCircle /> :
                            culture.status === 'error' ? <Error /> :
                            <Schedule />
                          }
                        />
                      </TableCell>
                      <TableCell>{culture.reportType}</TableCell>
                      <TableCell>
                        {culture.status === 'pending' && (
                          <IconButton 
                            size="small"
                            onClick={() => handleTransmitCulture(culture.id)}
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

  // Resistance alerts component
  function ResistanceAlerts() {
    return (
      <Card>
        <CardHeader 
          title="Antimicrobial Resistance Alerts"
          avatar={<Security />}
        />
        <CardContent>
          {resistanceAlerts.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No active resistance alerts
            </Typography>
          ) : (
            <Stack spacing={2}>
              {resistanceAlerts.map(function(alert) {
                return (
                  <Paper key={alert.id} sx={{ p: 2, border: theme => `1px solid ${theme.palette.error.main}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Warning sx={{ mr: 1, color: 'error.main' }} />
                      <Typography variant="h6" color="error.main">
                        {alert.organism} Resistance Alert
                      </Typography>
                      <Chip 
                        label={alert.alertLevel}
                        color={getAlertColor(alert.alertLevel)}
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Patient ID: {alert.patientId} | Detected: {new Date(alert.detectedAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Isolation Precautions: <strong>{alert.isolationPrecautions}</strong>
                    </Typography>
                  </Paper>
                );
              })}
            </Stack>
          )}
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
                Antimicrobial Surveillance
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Antimicrobial Use and Resistance Surveillance Reporting
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Automated surveillance and reporting of antimicrobial use and resistance patterns to CDC NHSN, 
              state health departments, and infection control programs for public health monitoring.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <SurveillanceMetrics />

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Culture Queue" icon={<CloudUpload />} />
          <Tab label="Agency Status" icon={<Public />} />
          <Tab label="Resistance Alerts" icon={<Security />} />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && <CultureQueue />}
      
      {activeTab === 1 && <AgencyStatus />}
      
      {activeTab === 2 && <ResistanceAlerts />}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
}

export default AntimicrobialReportingPage;