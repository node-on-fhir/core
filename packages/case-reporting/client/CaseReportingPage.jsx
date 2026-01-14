// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/case-reporting/client/CaseReportingPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  Stack,
  Divider,
  Badge,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Public as PublicHealthIcon,
  Rule as RuleIcon,
  Notifications as NotificationsIcon,
  ReportProblem as ReportIcon
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { get } from 'lodash';

function CaseReportingPage() {
  // State management
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('CDC');
  const [reportingStatus, setReportingStatus] = useState(null);
  const [ecrQueue, setEcrQueue] = useState([]);
  const [rrHistory, setRrHistory] = useState([]);
  const [isGeneratingEcr, setIsGeneratingEcr] = useState(false);

  // eCR jurisdictions and trigger codes
  const jurisdictions = {
    'CDC': {
      name: 'Centers for Disease Control and Prevention',
      shortName: 'CDC',
      icon: <PublicHealthIcon />,
      description: 'Federal reportable conditions and surveillance',
      endpoint: 'https://reportable.cdc.gov/fhir',
      triggerCodes: ['J09', 'A15', 'Z87.891'],
      reportingFrequency: 'Real-time',
      complianceStatus: 'Active'
    },
    'STATE': {
      name: 'State Health Department',
      shortName: 'STATE',
      description: 'State-specific reportable conditions',
      icon: <SecurityIcon />,
      endpoint: 'https://state.health.gov/fhir',
      triggerCodes: ['J44.1', 'B25.9', 'T88.6'],
      reportingFrequency: 'Within 24 hours',
      complianceStatus: 'Active'
    },
    'LOCAL': {
      name: 'Local Health Department',
      shortName: 'LOCAL',
      description: 'Local jurisdiction reporting requirements',
      icon: <HospitalIcon />,
      endpoint: 'https://local.health.gov/fhir',
      triggerCodes: ['K72.90', 'R50.9'],
      reportingFrequency: 'Same day',
      complianceStatus: 'Active'
    }
  };

  // Sample eCR metrics
  const reportingMetrics = {
    monthlyStats: {
      encounters: 2847,
      eicrsGenerated: 156,
      eicrsTransmitted: 152,
      reportableConfirmed: 89,
      successRate: 97.4
    },
    queueStatus: {
      pending: 8,
      processing: 2,
      transmitted: 152,
      failed: 4
    }
  };

  // Sample eCR queue
  const sampleEcrs = [
    {
      id: 'eICR-2024-00789',
      patientId: 'PAT-45678',
      encounterId: 'ENC-2024-001789',
      condition: 'Influenza, unspecified',
      triggerCode: 'J09',
      provider: 'Dr. Williams',
      date: new Date('2024-01-15'),
      status: 'ready-for-transmission',
      jurisdiction: 'CDC',
      priority: 'high',
      ruleMatch: 'Pediatric influenza mortality reporting'
    },
    {
      id: 'eICR-2024-00790',
      patientId: 'PAT-45679',
      encounterId: 'ENC-2024-001790',
      condition: 'Tuberculosis, unspecified',
      triggerCode: 'A15',
      provider: 'Dr. Chen',
      date: new Date('2024-01-14'),
      status: 'transmitted',
      jurisdiction: 'STATE',
      priority: 'urgent',
      ruleMatch: 'Tuberculosis case reporting'
    },
    {
      id: 'eICR-2024-00791',
      patientId: 'PAT-45680',
      encounterId: 'ENC-2024-001791',
      condition: 'SARS-CoV-2',
      triggerCode: 'U07.1',
      provider: 'Dr. Rodriguez',
      date: new Date('2024-01-13'),
      status: 'reportable-confirmed',
      jurisdiction: 'LOCAL',
      priority: 'medium',
      ruleMatch: 'COVID-19 surveillance'
    }
  ];

  // Sample RR history
  const sampleRRs = [
    {
      id: 'RR-2024-0234',
      ecrId: 'eICR-2024-00791',
      jurisdiction: 'LOCAL',
      receivedDate: new Date('2024-01-13T16:30:00'),
      determination: 'Reportable',
      followUpRequired: true,
      guidance: 'Continue isolation protocols per local guidelines',
      conditionOfInterest: 'COVID-19'
    },
    {
      id: 'RR-2024-0233',
      ecrId: 'eICR-2024-00790',
      jurisdiction: 'STATE',
      receivedDate: new Date('2024-01-14T14:15:00'),
      determination: 'Reportable',
      followUpRequired: true,
      guidance: 'Contact tracing initiated by state health department',
      conditionOfInterest: 'Tuberculosis'
    }
  ];

  useEffect(() => {
    setEcrQueue(sampleEcrs);
    setRrHistory(sampleRRs);
  }, []);

  // Status color mapping
  const getStatusColor = (status) => {
    switch(status) {
      case 'reportable-confirmed': return 'success';
      case 'transmitted': return 'info';
      case 'ready-for-transmission': return 'warning';
      case 'processing': return 'primary';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  // Generate eCR simulation
  const handleGenerateEcr = async () => {
    setIsGeneratingEcr(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedQueue = ecrQueue.map(ecr => 
        ecr.status === 'ready-for-transmission' 
          ? { ...ecr, status: 'transmitted', transmittedAt: new Date() }
          : ecr
      );
      setEcrQueue(updatedQueue);
      
    } catch (error) {
      console.error('eCR generation error:', error);
    } finally {
      setIsGeneratingEcr(false);
    }
  };

  // Compact metrics display
  const MetricCard = ({ title, value, subtitle, color = 'primary' }) => (
    <Paper sx={{ p: 1.5, textAlign: 'center', minHeight: 80 }}>
      <Typography variant="caption" display="block" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" color={color} fontWeight="bold">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  return (
    <Box sx={{ 
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50] 
        : theme.palette.background.default,
      minHeight: '100vh',
      p: 2
    }}>
      {/* Compact header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon color="primary" />
          Electronic Case Reporting (eCR)
          <Chip label="ONC §170.315(f)(5)" size="small" variant="outlined" sx={{ ml: 1 }} />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Automated public health reporting • FHIR R4 • eICR/RR transaction patterns
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Left column: Real-time dashboard and queue */}
        <Grid item xs={12} md={8}>
          {/* Real-time eCR dashboard */}
          <Card sx={{ mb: 2 }}>
            <CardHeader 
              title="eCR Transmission Dashboard"
              subheader="Real-time case reporting and surveillance distribution"
              action={
                <Stack direction="row" spacing={1}>
                  {Object.keys(jurisdictions).map(key => (
                    <Chip
                      key={key}
                      label={key}
                      size="small"
                      color={selectedJurisdiction === key ? 'primary' : 'default'}
                      onClick={() => setSelectedJurisdiction(key)}
                      icon={jurisdictions[key].icon}
                    />
                  ))}
                </Stack>
              }
            />
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <MetricCard 
                    title="Monthly Encounters"
                    value={reportingMetrics.monthlyStats.encounters.toLocaleString()}
                    subtitle="Screened for reportability"
                  />
                </Grid>
                <Grid item xs={3}>
                  <MetricCard 
                    title="Transmission Rate"
                    value={`${reportingMetrics.monthlyStats.successRate}%`}
                    subtitle={`${reportingMetrics.monthlyStats.eicrsTransmitted}/${reportingMetrics.monthlyStats.eicrsGenerated}`}
                    color="success"
                  />
                </Grid>
                <Grid item xs={3}>
                  <MetricCard 
                    title="Pending Queue"
                    value={reportingMetrics.queueStatus.pending}
                    subtitle="Awaiting transmission"
                    color="warning"
                  />
                </Grid>
                <Grid item xs={3}>
                  <MetricCard 
                    title="Confirmed Reportable"
                    value={reportingMetrics.monthlyStats.reportableConfirmed}
                    subtitle="RR received"
                    color="info"
                  />
                </Grid>
              </Grid>

              {/* eCR transmission queue */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Electronic Case Report Queue
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>eCR ID</TableCell>
                      <TableCell>Condition</TableCell>
                      <TableCell>Trigger Code</TableCell>
                      <TableCell>Jurisdiction</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ecrQueue.map((ecr) => (
                      <TableRow key={ecr.id} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {ecr.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {ecr.condition}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {ecr.ruleMatch}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={ecr.triggerCode} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ecr.jurisdiction}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={ecr.priority} 
                            size="small" 
                            color={getPriorityColor(ecr.priority)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={ecr.status.replace('-', ' ')} 
                            size="small" 
                            color={getStatusColor(ecr.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="View eCR Bundle">
                              <IconButton size="small">
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {ecr.status === 'ready-for-transmission' && (
                              <Tooltip title="Transmit to PHA">
                                <IconButton size="small" color="primary">
                                  <SendIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={isGeneratingEcr ? <RefreshIcon /> : <SendIcon />}
                  onClick={handleGenerateEcr}
                  disabled={isGeneratingEcr}
                >
                  {isGeneratingEcr ? 'Processing...' : 'Process Pending eCRs'}
                </Button>
                <Button startIcon={<DownloadIcon />} variant="outlined">
                  Export eRSD
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Jurisdiction info and RR history */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Jurisdiction information */}
            <Card>
              <CardHeader 
                title={jurisdictions[selectedJurisdiction].shortName}
                subheader={jurisdictions[selectedJurisdiction].name}
                avatar={jurisdictions[selectedJurisdiction].icon}
              />
              <CardContent>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Trigger Codes
                    </Typography>
                    {jurisdictions[selectedJurisdiction].triggerCodes.map((code, idx) => (
                      <Chip key={idx} label={code} size="small" sx={{ mr: 0.5, mb: 0.5, fontFamily: 'monospace' }} />
                    ))}
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Endpoint
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                      {jurisdictions[selectedJurisdiction].endpoint}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Reporting Frequency
                    </Typography>
                    <Chip 
                      label={jurisdictions[selectedJurisdiction].reportingFrequency} 
                      size="small" 
                      color="info"
                      icon={<ScheduleIcon />}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Recent RR responses */}
            <Card>
              <CardHeader title="Reportability Responses" />
              <CardContent>
                <Stack spacing={1}>
                  {rrHistory.slice(0, 4).map((rr, index) => (
                    <Paper key={rr.id} sx={{ p: 1.5 }} variant="outlined">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="500">
                          {rr.conditionOfInterest}
                        </Typography>
                        <Chip 
                          label={rr.determination} 
                          size="small" 
                          color={rr.determination === 'Reportable' ? 'success' : 'default'}
                          icon={rr.determination === 'Reportable' ? <CheckCircleIcon /> : <WarningIcon />}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        From: {rr.jurisdiction}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {rr.receivedDate.toLocaleString()}
                      </Typography>
                      {rr.followUpRequired && (
                        <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
                          ⚠ Follow-up required
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        {rr.guidance}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Technical implementation */}
            <Card>
              <CardHeader title="Technical Implementation" />
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>FHIR Version:</strong><br/>
                    R4.0.1
                  </Typography>
                  <Typography variant="body2">
                    <strong>Key Profiles:</strong><br/>
                    • eICR Composition<br/>
                    • Reportability Response<br/>
                    • eRSD PlanDefinition
                  </Typography>
                  <Typography variant="body2">
                    <strong>Transaction Patterns:</strong><br/>
                    • FHIR Messaging<br/>
                    • Bundle $process-message<br/>
                    • Push-based reporting
                  </Typography>
                  <Typography variant="body2">
                    <strong>Trigger Mechanisms:</strong><br/>
                    • RCTC value sets<br/>
                    • Clinical decision support<br/>
                    • Encounter-based rules
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CaseReportingPage;