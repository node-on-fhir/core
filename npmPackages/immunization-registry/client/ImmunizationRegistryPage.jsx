// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/immunization-registry/client/ImmunizationRegistryPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, Typography, Grid, Box, Button, 
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Alert, Tabs, Tab, Badge, IconButton,
  List, ListItem, ListItemText, ListItemIcon, Divider, Stack
} from '@mui/material';
import { 
  Vaccines, Send, CheckCircle, Warning, Schedule, Assessment,
  LocalHospital, Public, Biotech, Timeline, Analytics,
  Description, CloudUpload, Verified, Error, Info, Search,
  PersonSearch, History, Shield
} from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

function ImmunizationRegistryPage(props) {
  const [activeTab, setActiveTab] = useState(0);
  const [registryStatus, setRegistryStatus] = useState(null);
  const [immunizationQueue, setImmunizationQueue] = useState([]);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load registry data
  useEffect(function() {
    loadRegistryData();
  }, []);

  function loadRegistryData() {
    setLoading(true);
    
    // Load registry status
    Meteor.call('immunizationRegistry.getRegistryStatus', 'example-patient', {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    }, function(error, result) {
      if (error) {
        console.error('Error loading registry status:', error);
      } else {
        setRegistryStatus(result);
      }
      setLoading(false);
    });

    // Simulate immunization transmission queue
    setImmunizationQueue([
      {
        id: 'imm-001',
        patientName: 'John Smith',
        patientId: 'P001',
        vaccineCode: '208',
        vaccineName: 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose',
        administrationDate: new Date(Date.now() - 86400000).toISOString(),
        provider: 'ABC Family Clinic',
        lotNumber: 'EW0150',
        status: 'pending',
        priority: 'routine',
        targetRegistry: 'state-iis'
      },
      {
        id: 'imm-002',
        patientName: 'Sarah Johnson',
        patientId: 'P002',
        vaccineCode: '141',
        vaccineName: 'Influenza, seasonal, injectable',
        administrationDate: new Date(Date.now() - 172800000).toISOString(),
        provider: 'City Health Center',
        lotNumber: 'FLU2024',
        status: 'transmitted',
        priority: 'routine',
        targetRegistry: 'state-iis'
      },
      {
        id: 'imm-003',
        patientName: 'Emily Davis',
        patientId: 'P003',
        vaccineCode: '62',
        vaccineName: 'HPV, quadrivalent',
        administrationDate: new Date(Date.now() - 259200000).toISOString(),
        provider: 'Pediatric Associates',
        lotNumber: 'HPV240315',
        status: 'acknowledged',
        priority: 'high',
        targetRegistry: 'citywide-registry'
      }
    ]);
  }

  function handleTransmitImmunization(immunizationId) {
    setLoading(true);
    const immunization = immunizationQueue.find(i => i.id === immunizationId);
    
    Meteor.call('immunizationRegistry.submitToRegistry', immunizationId, immunization.targetRegistry, function(error, result) {
      if (error) {
        console.error('Error transmitting immunization:', error);
      } else {
        console.log('Immunization transmitted successfully:', result);
        loadRegistryData(); // Refresh data
      }
      setLoading(false);
    });
  }

  function handleQueryPatientHistory(patientId) {
    setLoading(true);
    
    Meteor.call('immunizationRegistry.queryPatientHistory', patientId, 'state-iis', function(error, result) {
      if (error) {
        console.error('Error querying patient history:', error); // phi-audit: ok
      } else {
        setPatientHistory(result);
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
  function RegistryMetrics() {
    if (!registryStatus) return null;

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
              <Vaccines sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {registryStatus.totalImmunizations}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Immunizations
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
                {registryStatus.transmittedImmunizations}
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
              ? `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Schedule sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                {registryStatus.pendingImmunizations}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Pending
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
                {registryStatus.complianceRate}%
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

  // Registry status component
  function RegistryStatus() {
    if (!registryStatus?.registries) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Immunization Registry Status"
          avatar={<Public />}
        />
        <CardContent>
          <Grid container spacing={2}>
            {Object.entries(registryStatus.registries).map(function([registryCode, registry]) {
              return (
                <Grid item xs={12} md={6} key={registryCode}>
                  <Paper sx={{ p: 2, bgcolor: theme => theme.palette.background.default }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocalHospital sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">{registry.name}</Typography>
                      <Chip 
                        label={registry.status}
                        color={registry.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                      <Chip 
                        label={`${registry.transmitted} Transmitted`}
                        color="success"
                        size="small"
                        icon={<CheckCircle />}
                      />
                      <Chip 
                        label={`${registry.pending} Pending`}
                        color="warning"
                        size="small"
                        icon={<Schedule />}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Last: {new Date(registry.lastSubmission).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
          
          {/* Vaccine Type Distribution */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Vaccine Type Distribution</Typography>
            <Grid container spacing={1}>
              {Object.entries(registryStatus.vaccineTypes || {}).map(function([vaccine, count]) {
                return (
                  <Grid item key={vaccine}>
                    <Chip 
                      label={`${vaccine}: ${count}`}
                      variant="outlined"
                      size="small"
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

  // Transmission queue component
  function TransmissionQueue() {
    return (
      <Card>
        <CardHeader 
          title="Immunization Transmission Queue"
          avatar={<CloudUpload />}
          action={
            <Button 
              variant="contained" 
              startIcon={<Send />}
              onClick={() => console.log('Transmit all pending immunizations')}
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
                  <TableCell>Vaccine</TableCell>
                  <TableCell>CVX Code</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Lot</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Registry</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {immunizationQueue.map(function(immunization) {
                  return (
                    <TableRow key={immunization.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {immunization.patientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {immunization.patientId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Vaccines sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {immunization.vaccineName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {immunization.vaccineCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(immunization.administrationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {immunization.provider}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {immunization.lotNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={immunization.priority}
                          color={getPriorityColor(immunization.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={immunization.status}
                          color={getStatusColor(immunization.status)}
                          size="small"
                          icon={
                            immunization.status === 'acknowledged' ? <Verified /> :
                            immunization.status === 'transmitted' ? <CheckCircle /> :
                            immunization.status === 'error' ? <Error /> :
                            <Schedule />
                          }
                        />
                      </TableCell>
                      <TableCell>{immunization.targetRegistry}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {immunization.status === 'pending' && (
                            <IconButton 
                              size="small"
                              onClick={() => handleTransmitImmunization(immunization.id)}
                              disabled={loading}
                            >
                              <Send fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton 
                            size="small"
                            onClick={() => handleQueryPatientHistory(immunization.patientId)}
                          >
                            <PersonSearch fontSize="small" />
                          </IconButton>
                        </Stack>
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

  // Patient history component
  function PatientHistoryView() {
    if (!patientHistory) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PersonSearch sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Patient Immunization History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Query a patient's immunization history from registries
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader 
          title="Patient Immunization History"
          avatar={<History />}
          subheader={`Query results for Patient ${patientHistory.patientId}`}
        />
        <CardContent>
          <Typography variant="h6" gutterBottom>Recorded Immunizations</Typography>
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Vaccine</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Lot Number</TableCell>
                  <TableCell>Site</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patientHistory.immunizations.map(function(imm, index) {
                  return (
                    <TableRow key={index}>
                      <TableCell>{imm.vaccineName}</TableCell>
                      <TableCell>{new Date(imm.administrationDate).toLocaleDateString()}</TableCell>
                      <TableCell>{imm.provider}</TableCell>
                      <TableCell>{imm.lotNumber}</TableCell>
                      <TableCell>{imm.site}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" gutterBottom>Recommendations</Typography>
          <Stack spacing={1}>
            {patientHistory.recommendations.map(function(rec, index) {
              return (
                <Paper key={index} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Vaccines sx={{ mr: 1, color: 'warning.main' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1">{rec.vaccineName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Due: {new Date(rec.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip label={rec.priority} color="warning" size="small" />
                  </Box>
                </Paper>
              );
            })}
          </Stack>
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
            <Vaccines sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Immunization Registry
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                ONC §170.315(f)(1) - Transmission to Immunization Registries
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Bi-directional transmission of immunization data with state and local immunization information systems. 
              Supports FHIR R4, US Core Immunization profiles, and HL7 V2 VXU messaging for vaccine surveillance.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <RegistryMetrics />

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Transmission Queue" icon={<CloudUpload />} />
          <Tab label="Registry Status" icon={<Public />} />
          <Tab label="Patient History" icon={<PersonSearch />} />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && <TransmissionQueue />}
      
      {activeTab === 1 && <RegistryStatus />}
      
      {activeTab === 2 && <PatientHistoryView />}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
}

export default ImmunizationRegistryPage;