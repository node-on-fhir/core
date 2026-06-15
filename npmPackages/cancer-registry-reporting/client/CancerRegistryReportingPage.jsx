// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/cancer-registry-reporting/client/CancerRegistryReportingPage.jsx

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
  Biotech as BiotechIcon,
  Rule as RuleIcon,
  Notifications as NotificationsIcon,
  HealthAndSafety as HealthIcon,
  Science as ScienceIcon,
  Timeline as TimelineIcon,
  DataUsage as DataIcon
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { get } from 'lodash';

function CancerRegistryReportingPage() {
  // State management
  const [selectedRegistry, setSelectedRegistry] = useState('NAACCR');
  const [reportingStatus, setReportingStatus] = useState(null);
  const [cancerCaseQueue, setCancerCaseQueue] = useState([]);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Cancer registries and specifications
  const cancerRegistries = {
    'NAACCR': {
      name: 'North American Association of Central Cancer Registries',
      shortName: 'NAACCR',
      icon: <HealthIcon />,
      description: 'National standards for cancer surveillance and reporting',
      endpoint: 'https://registry.naaccr.org/fhir',
      standards: ['NAACCR v21', 'mCODE FHIR IG', 'US Core 6.1.0'],
      reportingFrequency: 'Monthly batches',
      complianceStatus: 'Active'
    },
    'STATE': {
      name: 'State Cancer Registry',
      shortName: 'STATE',
      description: 'State-level cancer surveillance system',
      icon: <SecurityIcon />,
      endpoint: 'https://state.cancer.registry/fhir',
      standards: ['State-specific', 'SEER*DMS', 'HL7 FHIR R4'],
      reportingFrequency: 'Real-time + monthly',
      complianceStatus: 'Active'
    },
    'CDC': {
      name: 'Centers for Disease Control NPCR',
      shortName: 'CDC NPCR',
      description: 'National Program of Cancer Registries',
      icon: <ScienceIcon />,
      endpoint: 'https://cdc.gov/npcr/fhir',
      standards: ['NPCR CSS', 'mCODE', 'Cancer Pathology IG'],
      reportingFrequency: 'Quarterly + annual',
      complianceStatus: 'Active'
    }
  };

  // Sample cancer registry metrics
  const reportingMetrics = {
    monthlyStats: {
      cancerCases: 127,
      reportsGenerated: 118,
      reportsTransmitted: 115,
      completionRate: 97.4,
      avgProcessingTime: 2.3
    },
    queueStatus: {
      pending: 5,
      processing: 2,
      transmitted: 115,
      failed: 3
    },
    caseTypes: {
      'Breast': 32,
      'Lung': 28,
      'Colorectal': 19,
      'Prostate': 16,
      'Other': 32
    }
  };

  // Sample cancer case queue
  const sampleCancerCases = [
    {
      id: 'CC-2024-00891',
      patientId: 'PAT-56789',
      encounterId: 'ENC-2024-001891',
      primarySite: 'Breast',
      histology: 'Invasive ductal carcinoma',
      stageGroup: 'Stage IIA',
      dateDiagnosis: new Date('2024-01-10'),
      provider: 'Dr. Oncologist',
      status: 'ready-for-transmission',
      registry: 'NAACCR',
      priority: 'standard',
      completeness: 92,
      mCodeCompliant: true
    },
    {
      id: 'CC-2024-00892',
      patientId: 'PAT-56790',
      encounterId: 'ENC-2024-001892',
      primarySite: 'Lung',
      histology: 'Adenocarcinoma',
      stageGroup: 'Stage IIIB',
      dateDiagnosis: new Date('2024-01-08'),
      provider: 'Dr. Pulmonologist',
      status: 'transmitted',
      registry: 'STATE',
      priority: 'urgent',
      completeness: 96,
      mCodeCompliant: true
    },
    {
      id: 'CC-2024-00893',
      patientId: 'PAT-56791',
      encounterId: 'ENC-2024-001893',
      primarySite: 'Colon',
      histology: 'Adenocarcinoma',
      stageGroup: 'Stage II',
      dateDiagnosis: new Date('2024-01-06'),
      provider: 'Dr. Gastroenterologist',
      status: 'validation-complete',
      registry: 'CDC',
      priority: 'standard',
      completeness: 89,
      mCodeCompliant: false
    }
  ];

  // Sample submission history
  const sampleSubmissions = [
    {
      id: 'SUB-2024-0789',
      bundleId: 'Bundle/ccrr-2024-001893',
      registry: 'CDC',
      submittedDate: new Date('2024-01-06T18:45:00'),
      status: 'acknowledged',
      caseCount: 1,
      validationScore: 89,
      nccrId: 'NCCR-CDC-789012'
    },
    {
      id: 'SUB-2024-0788',
      bundleId: 'Bundle/naaccr-2024-batch-089',
      registry: 'NAACCR',
      submittedDate: new Date('2024-01-05T14:30:00'),
      status: 'processed',
      caseCount: 15,
      validationScore: 94,
      nccrId: 'NAACCR-89015'
    }
  ];

  useEffect(() => {
    setCancerCaseQueue(sampleCancerCases);
    setSubmissionHistory(sampleSubmissions);
  }, []);

  // Status color mapping
  const getStatusColor = (status) => {
    switch(status) {
      case 'processed': return 'success';
      case 'acknowledged': return 'success';
      case 'transmitted': return 'info';
      case 'validation-complete': return 'warning';
      case 'ready-for-transmission': return 'primary';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'standard': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  // Generate cancer registry report simulation
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedQueue = cancerCaseQueue.map(ccase => 
        ccase.status === 'ready-for-transmission' 
          ? { ...ccase, status: 'transmitted', transmittedAt: new Date() }
          : ccase
      );
      setCancerCaseQueue(updatedQueue);
      
    } catch (error) {
      console.error('Cancer registry report generation error:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Compact metrics display
  const MetricCard = ({ title, value, subtitle, color = 'primary', icon }) => (
    <Paper sx={{ p: 1.5, textAlign: 'center', minHeight: 85 }}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 0.5 }}>
        {icon}
        <Typography variant="caption" display="block" color="text.secondary">
          {title}
        </Typography>
      </Stack>
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
          <BiotechIcon color="primary" />
          Cancer Registry Reporting
          <Chip label="ONC §170.315(f)(4)" size="small" variant="outlined" sx={{ ml: 1 }} />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Central cancer registry transmission • FHIR R4 • mCODE FHIR IG • NAACCR v21
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Left column: Real-time dashboard and queue */}
        <Grid item xs={12} md={8}>
          {/* Real-time cancer registry dashboard */}
          <Card sx={{ mb: 2 }}>
            <CardHeader 
              title="Cancer Registry Transmission Dashboard"
              subheader="Automated cancer case reporting and surveillance distribution"
              action={
                <Stack direction="row" spacing={1}>
                  {Object.keys(cancerRegistries).map(key => (
                    <Chip
                      key={key}
                      label={key}
                      size="small"
                      color={selectedRegistry === key ? 'primary' : 'default'}
                      onClick={() => setSelectedRegistry(key)}
                      icon={cancerRegistries[key].icon}
                    />
                  ))}
                </Stack>
              }
            />
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={2.4}>
                  <MetricCard 
                    title="Cases"
                    value={reportingMetrics.monthlyStats.cancerCases}
                    subtitle="Monthly total"
                    icon={<DataIcon fontSize="small" />}
                  />
                </Grid>
                <Grid item xs={2.4}>
                  <MetricCard 
                    title="Completion"
                    value={`${reportingMetrics.monthlyStats.completionRate}%`}
                    subtitle={`${reportingMetrics.monthlyStats.reportsTransmitted}/${reportingMetrics.monthlyStats.reportsGenerated}`}
                    color="success"
                    icon={<CheckCircleIcon fontSize="small" />}
                  />
                </Grid>
                <Grid item xs={2.4}>
                  <MetricCard 
                    title="Processing"
                    value={reportingMetrics.queueStatus.processing}
                    subtitle="Active submissions"
                    color="warning"
                    icon={<TimelineIcon fontSize="small" />}
                  />
                </Grid>
                <Grid item xs={2.4}>
                  <MetricCard 
                    title="Avg Time"
                    value={`${reportingMetrics.monthlyStats.avgProcessingTime}h`}
                    subtitle="Processing time"
                    color="info"
                    icon={<ScheduleIcon fontSize="small" />}
                  />
                </Grid>
                <Grid item xs={2.4}>
                  <MetricCard 
                    title="Failed"
                    value={reportingMetrics.queueStatus.failed}
                    subtitle="Requiring attention"
                    color="error"
                    icon={<WarningIcon fontSize="small" />}
                  />
                </Grid>
              </Grid>

              {/* Cancer case processing queue */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Cancer Case Processing Queue
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Case ID</TableCell>
                      <TableCell>Primary Site</TableCell>
                      <TableCell>Histology</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell>Registry</TableCell>
                      <TableCell>Completeness</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cancerCaseQueue.map((ccase) => (
                      <TableRow key={ccase.id} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {ccase.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {ccase.primarySite}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ccase.histology}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={ccase.stageGroup} 
                            size="small" 
                            variant="outlined"
                            color={ccase.stageGroup.includes('I') ? 'success' : ccase.stageGroup.includes('IV') ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {ccase.registry}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="body2" fontWeight="500">
                              {ccase.completeness}%
                            </Typography>
                            {ccase.mCodeCompliant && (
                              <Chip label="mCODE" size="small" color="success" sx={{ fontSize: '0.6rem' }} />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={ccase.status.replace('-', ' ')} 
                            size="small" 
                            color={getStatusColor(ccase.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="View Case Details">
                              <IconButton size="small">
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {ccase.status === 'ready-for-transmission' && (
                              <Tooltip title="Submit to Registry">
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
                  startIcon={isGeneratingReport ? <RefreshIcon /> : <SendIcon />}
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? 'Processing...' : 'Process Pending Cases'}
                </Button>
                <Button startIcon={<DownloadIcon />} variant="outlined">
                  Export NAACCR XML
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Registry info and submissions */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Registry information */}
            <Card>
              <CardHeader 
                title={cancerRegistries[selectedRegistry].shortName}
                subheader={cancerRegistries[selectedRegistry].name}
                avatar={cancerRegistries[selectedRegistry].icon}
              />
              <CardContent>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Standards & Profiles
                    </Typography>
                    {cancerRegistries[selectedRegistry].standards.map((standard, idx) => (
                      <Chip key={idx} label={standard} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Endpoint
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
                      {cancerRegistries[selectedRegistry].endpoint}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Reporting Frequency
                    </Typography>
                    <Chip 
                      label={cancerRegistries[selectedRegistry].reportingFrequency} 
                      size="small" 
                      color="info"
                      icon={<ScheduleIcon />}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Case distribution */}
            <Card>
              <CardHeader title="Cancer Case Distribution" />
              <CardContent>
                <Stack spacing={1}>
                  {Object.entries(reportingMetrics.caseTypes).map(([type, count]) => (
                    <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{type}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight="500">{count}</Typography>
                        <Box sx={{ 
                          width: 40, 
                          height: 6, 
                          bgcolor: 'primary.main', 
                          borderRadius: 3,
                          transform: `scaleX(${count / Math.max(...Object.values(reportingMetrics.caseTypes))})`
                        }} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Recent submissions */}
            <Card>
              <CardHeader title="Recent Submissions" />
              <CardContent>
                <Stack spacing={1}>
                  {submissionHistory.slice(0, 4).map((submission) => (
                    <Paper key={submission.id} sx={{ p: 1.5 }} variant="outlined">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="500">
                          {submission.registry}
                        </Typography>
                        <Chip 
                          label={submission.status} 
                          size="small" 
                          color={getStatusColor(submission.status)}
                          icon={submission.status === 'processed' ? <CheckCircleIcon /> : <ScheduleIcon />}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {submission.caseCount} case{submission.caseCount !== 1 ? 's' : ''} • {submission.validationScore}% validation
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {submission.submittedDate.toLocaleString()}
                      </Typography>
                      {submission.nccrId && (
                        <Typography variant="caption" color="text.secondary" display="block" fontFamily="monospace">
                          ID: {submission.nccrId}
                        </Typography>
                      )}
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
                    • mCODE Primary Cancer Condition<br/>
                    • CCRR Composition<br/>
                    • Cancer Pathology Reports
                  </Typography>
                  <Typography variant="body2">
                    <strong>Data Standards:</strong><br/>
                    • NAACCR v21 Dictionary<br/>
                    • SEER Site/Histology<br/>
                    • AJCC Staging Manual
                  </Typography>
                  <Typography variant="body2">
                    <strong>Transmission Methods:</strong><br/>
                    • FHIR Messaging Bundle<br/>
                    • SMART Backend Services<br/>
                    • Subscription-based triggers
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

export default CancerRegistryReportingPage;