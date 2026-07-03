// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/syndromic-surveillance/client/SyndromicSurveillancePage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  Grid, 
  Typography, 
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  Upload as UploadIcon,
  Assessment as ReportIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  Timeline as TrendIcon
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';

function SyndromicSurveillancePage() {
  const [facilityId, setFacilityId] = useState('FAC001');
  const [reportingPeriod, setReportingPeriod] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [measureType, setMeasureType] = useState('COVID_Surveillance');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  // Sample surveillance measures based on CDC/NHSN requirements
  const surveillanceMeasures = [
    { id: 'COVID_Surveillance', name: 'COVID-19 Hospital Surveillance', frequency: 'Daily' },
    { id: 'Influenza_Surveillance', name: 'Influenza-like Illness', frequency: 'Weekly' },
    { id: 'Hospital_Capacity', name: 'Hospital Capacity Reporting', frequency: 'Daily' },
    { id: 'Respiratory_Illness', name: 'Respiratory Illness Syndromic', frequency: 'Daily' }
  ];

  // Sample recent submissions
  const recentSubmissions = [
    { date: '2024-10-04', measure: 'COVID_Surveillance', status: 'Submitted', agency: 'CDC' },
    { date: '2024-10-03', measure: 'Hospital_Capacity', status: 'Submitted', agency: 'State Health' },
    { date: '2024-10-03', measure: 'COVID_Surveillance', status: 'Pending', agency: 'CDC' },
    { date: '2024-10-02', measure: 'Influenza_Surveillance', status: 'Submitted', agency: 'CDC' }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const result = await Meteor.callAsync('surveillance.generateMeasureReport', {
        facilityId,
        reportingPeriod: {
          start: reportingPeriod.start + 'T00:00:00Z',
          end: reportingPeriod.end + 'T23:59:59Z'
        },
        measureType
      });
      setCurrentReport(result);
      setSubmissionStatus({ type: 'success', message: 'Report generated successfully' });
    } catch (error) {
      setSubmissionStatus({ type: 'error', message: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitToPublicHealth = async () => {
    if (!currentReport) return;
    
    try {
      const result = await Meteor.callAsync('surveillance.submitToPublicHealth', 
        currentReport.id, 
        'https://api.cdc.gov/surveillance'
      );
      setSubmissionStatus({ type: 'success', message: 'Successfully submitted to public health agency' });
    } catch (error) {
      setSubmissionStatus({ type: 'error', message: error.message });
    }
  };

  const handleExportCSV = async () => {
    if (!currentReport) return;
    
    try {
      const result = await Meteor.callAsync('surveillance.exportToCSV', currentReport.id);
      // Trigger download
      const csvContent = result.data.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setSubmissionStatus({ type: 'error', message: error.message });
    }
  };

  return (
    <Box sx={{ 
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50] 
        : theme.palette.background.default,
      minHeight: '100vh',
      p: 3
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReportIcon color="primary" />
          Syndromic Surveillance Reporting
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Public health surveillance and reporting for ONC §170.315(f)(2) compliance
        </Typography>
      </Box>

      {submissionStatus && (
        <Alert 
          severity={submissionStatus.type} 
          sx={{ mb: 3 }}
          onClose={() => setSubmissionStatus(null)}
        >
          {submissionStatus.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Report Generation Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Generate Surveillance Report"
              subheader="Create standardized surveillance measures for public health transmission"
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Facility ID"
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={reportingPeriod.start}
                    onChange={(e) => setReportingPeriod({...reportingPeriod, start: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={reportingPeriod.end}
                    onChange={(e) => setReportingPeriod({...reportingPeriod, end: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Surveillance Measure</InputLabel>
                    <Select
                      value={measureType}
                      onChange={(e) => setMeasureType(e.target.value)}
                      label="Surveillance Measure"
                    >
                      {surveillanceMeasures.map(measure => (
                        <MenuItem key={measure.id} value={measure.id}>
                          {measure.name} ({measure.frequency})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {isGenerating && <LinearProgress sx={{ mt: 2 }} />}
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  startIcon={<ReportIcon />}
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  Generate Report
                </Button>
                {currentReport && (
                  <>
                    <Button 
                      variant="outlined" 
                      startIcon={<SendIcon />}
                      onClick={handleSubmitToPublicHealth}
                    >
                      Submit to Public Health
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<DownloadIcon />}
                      onClick={handleExportCSV}
                    >
                      Export CSV
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Surveillance Metrics" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">42</Typography>
                    <Typography variant="caption">Active Cases</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">18</Typography>
                    <Typography variant="caption">ICU Available</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">156</Typography>
                    <Typography variant="caption">ED Visits</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">8</Typography>
                    <Typography variant="caption">Ventilators</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Submissions */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Recent Submissions"
              subheader="Transmission history to public health agencies"
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Measure Type</TableCell>
                      <TableCell>Receiving Agency</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSubmissions.map((submission, index) => (
                      <TableRow key={index}>
                        <TableCell>{submission.date}</TableCell>
                        <TableCell>{submission.measure}</TableCell>
                        <TableCell>{submission.agency}</TableCell>
                        <TableCell>
                          <Chip 
                            label={submission.status}
                            color={submission.status === 'Submitted' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SyndromicSurveillancePage;