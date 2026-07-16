// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/healthcare-surveys/client/HealthcareSurveysPage.jsx

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
  AccordionDetails
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  LocalHospital as HospitalIcon,
  BusinessCenter as OfficeIcon,
  Description as ReportIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { get } from 'lodash';

function HealthcareSurveysPage() {
  // State management
  const [selectedSurvey, setSelectedSurvey] = useState('NAMCS');
  const [reportingStatus, setReportingStatus] = useState(null);
  const [encounterQueue, setEncounterQueue] = useState([]);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Survey definitions based on NCHS requirements
  const surveyTypes = {
    'NAMCS': {
      name: 'National Ambulatory Medical Care Survey',
      shortName: 'NAMCS',
      icon: <OfficeIcon />,
      description: 'Office-based physician and community health center visits',
      settings: ['Emergency Department', 'Outpatient', 'Ambulatory'],
      dataElements: ['Patient Demographics', 'Visit Information', 'Diagnoses', 'Procedures', 'Medications', 'Providers'],
      triggerCriteria: 'Completed ambulatory encounters with sampled providers',
      reportingFrequency: 'Real-time (48h delay)',
      complianceStatus: 'Active'
    },
    'NHCS': {
      name: 'National Hospital Care Survey',
      shortName: 'NHCS',
      description: 'Inpatient discharges and emergency department visits',
      icon: <HospitalIcon />,
      settings: ['Emergency Department', 'Inpatient Care'],
      dataElements: ['Patient Demographics', 'Encounter Details', 'Diagnoses', 'Procedures', 'Medications', 'Discharge Disposition'],
      triggerCriteria: 'All inpatient discharges and ED visits from sampled hospitals',
      reportingFrequency: 'Real-time (48h delay)',
      complianceStatus: 'Active'
    }
  };

  // Sample reporting data
  const reportingMetrics = {
    monthlyStats: {
      encounters: 1247,
      bundlesGenerated: 1189,
      successful: 1165,
      errors: 24,
      successRate: 98.0
    },
    queueStatus: {
      pending: 12,
      processing: 3,
      completed: 1189,
      failed: 5
    }
  };

  // Sample encounter queue
  const sampleEncounters = [
    {
      id: 'ENC-2024-001234',
      patientId: 'PAT-12345',
      type: 'ambulatory',
      provider: 'Dr. Smith',
      date: new Date('2024-01-15'),
      status: 'ready-for-reporting',
      survey: 'NAMCS',
      diagnoses: ['Z00.00', 'I10'],
      bundle: null
    },
    {
      id: 'ENC-2024-001235',
      patientId: 'PAT-12346',
      type: 'emergency',
      provider: 'Dr. Johnson',
      date: new Date('2024-01-14'),
      status: 'bundle-generated',
      survey: 'NHCS',
      diagnoses: ['S72.001A'],
      bundle: 'Bundle/hcs-2024-001235'
    },
    {
      id: 'ENC-2024-001236',
      patientId: 'PAT-12347',
      type: 'inpatient',
      provider: 'Dr. Brown',
      date: new Date('2024-01-13'),
      status: 'submitted',
      survey: 'NHCS',
      diagnoses: ['J44.1', 'Z87.891'],
      bundle: 'Bundle/hcs-2024-001236'
    }
  ];

  // Sample submission history
  const sampleSubmissions = [
    {
      id: 'SUB-2024-0567',
      bundleId: 'Bundle/hcs-2024-001236',
      survey: 'NHCS',
      submittedDate: new Date('2024-01-13T14:30:00'),
      status: 'acknowledged',
      nchs_id: 'NCHS-NHCS-567890',
      encounterCount: 1,
      validationErrors: 0
    },
    {
      id: 'SUB-2024-0566',
      bundleId: 'Bundle/namcs-2024-batch-034',
      survey: 'NAMCS',
      submittedDate: new Date('2024-01-12T16:45:00'),
      status: 'acknowledged',
      nchs_id: 'NCHS-NAMCS-456789',
      encounterCount: 25,
      validationErrors: 0
    }
  ];

  useEffect(() => {
    setEncounterQueue(sampleEncounters);
    setSubmissionHistory(sampleSubmissions);
  }, []);

  // Status color mapping
  const getStatusColor = (status) => {
    switch(status) {
      case 'acknowledged': return 'success';
      case 'submitted': return 'info';
      case 'bundle-generated': return 'warning';
      case 'ready-for-reporting': return 'primary';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Get appropriate icon for encounter type
  const getEncounterTypeIcon = (type) => {
    switch(type) {
      case 'emergency': return <WarningIcon />;
      case 'inpatient': return <HospitalIcon />;
      case 'ambulatory':
      default: return <OfficeIcon />;
    }
  };

  // Generate report simulation
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update queue status
      const updatedQueue = encounterQueue.map(enc => 
        enc.status === 'ready-for-reporting' 
          ? { ...enc, status: 'bundle-generated', bundle: `Bundle/hcs-${Date.now()}` }
          : enc
      );
      setEncounterQueue(updatedQueue);
      
    } catch (error) {
      console.error('Report generation error:', error);
    } finally {
      setIsGeneratingReport(false);
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
      minHeight: '100vh',
      p: 2
    }}>
      {/* Compact header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon color="primary" />
          Healthcare Surveys Reporting
          <Chip label="ONC §170.315(f)(7)" size="small" variant="outlined" sx={{ ml: 1 }} />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          NCHS NAMCS/NHCS automated reporting system • FHIR R4 • US Core 6.1.0
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Left column: Real-time metrics and queue */}
        <Grid item xs={12} md={8}>
          {/* Real-time dashboard */}
          <Card sx={{ mb: 2 }}>
            <CardHeader 
              title="Reporting Dashboard"
              subheader="Real-time survey submission metrics"
              action={
                <Stack direction="row" spacing={1}>
                  {Object.keys(surveyTypes).map(key => (
                    <Chip
                      key={key}
                      label={key}
                      size="small"
                      color={selectedSurvey === key ? 'primary' : 'default'}
                      onClick={() => setSelectedSurvey(key)}
                      icon={surveyTypes[key].icon}
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
                    subtitle="Current month"
                  />
                </Grid>
                <Grid item xs={3}>
                  <MetricCard 
                    title="Success Rate"
                    value={`${reportingMetrics.monthlyStats.successRate}%`}
                    subtitle={`${reportingMetrics.monthlyStats.successful}/${reportingMetrics.monthlyStats.bundlesGenerated}`}
                    color="success"
                  />
                </Grid>
                <Grid item xs={3}>
                  <MetricCard 
                    title="Pending Queue"
                    value={reportingMetrics.queueStatus.pending}
                    subtitle="Awaiting bundle generation"
                    color="warning"
                  />
                </Grid>
                <Grid item xs={3}>
                  <MetricCard 
                    title="Processing"
                    value={reportingMetrics.queueStatus.processing}
                    subtitle="Active submissions"
                    color="info"
                  />
                </Grid>
              </Grid>

              {/* Encounter queue */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Encounter Processing Queue
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Encounter ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Survey</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {encounterQueue.map((encounter) => (
                      <TableRow key={encounter.id} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {encounter.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={encounter.type} 
                            size="small" 
                            icon={getEncounterTypeIcon(encounter.type)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {encounter.survey}
                          </Typography>
                        </TableCell>
                        <TableCell>{encounter.provider}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {encounter.date.toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={encounter.status.replace('-', ' ')} 
                            size="small" 
                            color={getStatusColor(encounter.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {encounter.bundle && (
                              <Tooltip title="View Bundle">
                                <IconButton size="small">
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {encounter.status === 'bundle-generated' && (
                              <Tooltip title="Submit to NCHS">
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
                  startIcon={isGeneratingReport ? <RefreshIcon /> : <ReportIcon />}
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? 'Generating...' : 'Generate Survey Reports'}
                </Button>
                <Button startIcon={<DownloadIcon />} variant="outlined">
                  Export Queue
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Survey info and recent submissions */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Survey information */}
            <Card>
              <CardHeader 
                title={surveyTypes[selectedSurvey].shortName}
                subheader={surveyTypes[selectedSurvey].name}
                avatar={surveyTypes[selectedSurvey].icon}
              />
              <CardContent>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Care Settings
                    </Typography>
                    {surveyTypes[selectedSurvey].settings.map((setting, idx) => (
                      <Chip key={idx} label={setting} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Data Elements
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {surveyTypes[selectedSurvey].dataElements.join(' • ')}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Trigger Criteria
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {surveyTypes[selectedSurvey].triggerCriteria}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" fontWeight="500" gutterBottom>
                      Reporting Frequency
                    </Typography>
                    <Chip 
                      label={surveyTypes[selectedSurvey].reportingFrequency} 
                      size="small" 
                      color="info"
                      icon={<ScheduleIcon />}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Recent submissions */}
            <Card>
              <CardHeader title="Recent Submissions" />
              <CardContent>
                <Stack spacing={1}>
                  {submissionHistory.slice(0, 5).map((submission, index) => (
                    <Paper key={submission.id} sx={{ p: 1.5 }} variant="outlined">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="500">
                          {submission.survey}
                        </Typography>
                        <Chip 
                          label={submission.status} 
                          size="small" 
                          color={getStatusColor(submission.status)}
                          icon={submission.status === 'acknowledged' ? <CheckCircleIcon /> : <ScheduleIcon />}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {submission.encounterCount} encounter{submission.encounterCount !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {submission.submittedDate.toLocaleString()}
                      </Typography>
                      {submission.nchs_id && (
                        <Typography variant="caption" color="text.secondary" display="block" fontFamily="monospace">
                          NCHS: {submission.nchs_id}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Technical specifications */}
            <Card>
              <CardHeader title="Technical Implementation" />
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>FHIR Version:</strong><br/>
                    R4.0.1
                  </Typography>
                  <Typography variant="body2">
                    <strong>Profile Dependencies:</strong><br/>
                    • US Core 6.1.0<br/>
                    • Healthcare Surveys IG<br/>
                    • Public Health Library
                  </Typography>
                  <Typography variant="body2">
                    <strong>Bundle Types:</strong><br/>
                    • Content Bundle<br/>
                    • Reporting Bundle<br/>
                    • Message Bundle
                  </Typography>
                  <Typography variant="body2">
                    <strong>Automated Triggers:</strong><br/>
                    • Encounter closure + 48h<br/>
                    • Subscription-based<br/>
                    • eCR Now framework
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

export default HealthcareSurveysPage;