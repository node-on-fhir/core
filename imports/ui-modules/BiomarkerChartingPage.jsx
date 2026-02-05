// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-modules/BiomarkerChartingPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Button, 
  Grid, 
  Card,
  CardHeader, 
  CardContent, 
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';

import { useTracker, useSubscribe } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { get, groupBy, orderBy, uniqBy } from 'lodash';
import moment from 'moment';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Observations } from '../lib/schemas/SimpleSchemas/Observations';

import { ResponsiveLine } from '@nivo/line'

// Get theme from Honeycomb's custom hook
let useAppTheme;
if (Meteor.isClient) {
  Meteor.startup(function(){
    useAppTheme = Meteor.useTheme;
  });
}

// Helper functions to replace clinical:hl7-fhir-data-infrastructure components
function DynamicSpacer() {
  return <div style={{ height: 20 }} />;
}

function calcHeaderHeight() {
  return get(Meteor, 'settings.public.defaults.prominentHeader') ? 148 : 84;
}

function calcCanvasPaddingWidth() {
  return Session.get('appWidth') < 768 ? 20 : 40;
}

function NoDataWrapper({ dataCount, noDataImagePath, history, title, buttonLabel, redirectPath }) {
  const navigate = useNavigate();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Card
        sx={{
          maxWidth: '600px',
          width: '100%',
          borderRadius: 3,
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: borderColor,
          bgcolor: cardBgColor
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                color: cardTextColor,
                mb: 2
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                lineHeight: 1.7,
                maxWidth: '480px',
                mx: 'auto'
              }}
            >
              Please select a patient to view biomarker data.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<GroupIcon />}
            onClick={() => navigate(redirectPath)}
            sx={{
              mt: 2,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              }
            }}
          >
            {buttonLabel}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export function BiomarkerChartingPage(props){
  const navigate = useNavigate();

  // State management
  const [timescale, setTimescale] = useState(0);
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [codeAnalysis, setCodeAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Get current theme
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  // Layout calculations
  const headerHeight = calcHeaderHeight();
  const paddingWidth = calcCanvasPaddingWidth();
  const chartHeight = 180;
  
  // Get selected patient
  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);
  const selectedPatient = useTracker(() => Session.get('selectedPatient'), []);
  
  // Subscribe to Observations for the selected patient
  const isLoadingSubscription = useSubscribe(() => {
    if (selectedPatientId) {
      // Use autopublish.Observations with patient filter query
      const query = {
        $or: [
          { 'subject.reference': 'Patient/' + selectedPatientId },
          { 'subject.reference': selectedPatientId },
          { 'subject.id': selectedPatientId }
        ]
      };
      return Meteor.subscribe('autopublish.Observations', query, {});
    }
    return null;
  });
  
  // Fetch observations for the selected patient
  const observations = useTracker(() => {
    if (!selectedPatientId) return [];
    
    // First try to get observations without any filter to see if they exist
    const allObs = Observations.find().fetch();
    console.log('Total observations in collection:', allObs.length);
    
    if (allObs.length === 0) {
      // If Observations collection is empty, return mock data for now
      // This suggests the subscription isn't populating this collection
      console.warn('Observations collection is empty - subscription may not be working');
      return [];
    }
    
    const query = {
      $or: [
        { 'subject.reference': 'Patient/' + selectedPatientId },
        { 'subject.reference': selectedPatientId },
        { 'subject.id': selectedPatientId }
      ]
    };
    
    const patientObs = Observations.find(query, { sort: { effectiveDateTime: -1 } }).fetch();
    console.log('Observations for patient:', patientObs.length);
    return patientObs;
  }, [selectedPatientId]);
  
  // Analyze observations to discover unique codes
  useEffect(() => {
    if (observations.length > 0 && !codeAnalysis) {
      console.log('Starting analysis of', observations.length, 'observations...');
      analyzeObservationCodes(observations);
    }
  }, [observations]);
  
  function analyzeObservationCodes(observationsToAnalyze) {
    console.log('Analyzing observation codes for', observationsToAnalyze.length, 'observations');
    
    try {
      const codeMap = new Map();
      
      observationsToAnalyze.forEach(obs => {
        // Extract code information
        let codeInfo = {
          system: null,
          code: null,
          display: null,
          text: get(obs, 'code.text'),
          count: 0,
          latestValue: null,
          unit: null,
          dates: []
        };
        
        // Try to get SNOMED code
        const snomedCoding = get(obs, 'code.coding', []).find(c => 
          c.system && c.system.includes('snomed')
        );
        
        // Try to get LOINC code
        const loincCoding = get(obs, 'code.coding', []).find(c => 
          c.system && c.system.includes('loinc')
        );
        
        // Use whichever coding we found
        const coding = snomedCoding || loincCoding || get(obs, 'code.coding[0]', {});
        
        if (coding.code) {
          codeInfo.system = coding.system;
          codeInfo.code = coding.code;
          codeInfo.display = coding.display || codeInfo.text;
        }
        
        // Create unique key for this code
        const codeKey = codeInfo.code || codeInfo.text || 'unknown';
        
        if (codeMap.has(codeKey)) {
          const existing = codeMap.get(codeKey);
          existing.count++;
          existing.dates.push(get(obs, 'effectiveDateTime'));
          if (!existing.latestValue && get(obs, 'valueQuantity.value')) {
            existing.latestValue = get(obs, 'valueQuantity.value');
            existing.unit = get(obs, 'valueQuantity.unit');
          }
        } else {
          codeInfo.count = 1;
          codeInfo.dates = [get(obs, 'effectiveDateTime')];
          codeInfo.latestValue = get(obs, 'valueQuantity.value');
          codeInfo.unit = get(obs, 'valueQuantity.unit');
          codeMap.set(codeKey, codeInfo);
        }
      });
      
      console.log('Code analysis complete. Found', codeMap.size, 'unique codes');
      
      // Convert map to array and sort by count
      const codeArray = Array.from(codeMap.values());
      const sortedCodes = orderBy(codeArray, ['count'], ['desc']);
      
      console.log('Top 5 codes:', sortedCodes.slice(0, 5).map(c => ({
        code: c.code || c.text,
        count: c.count,
        hasValue: c.latestValue !== null
      })));
      
      setCodeAnalysis(sortedCodes);
      
      // Auto-select top 6 codes with values and at least 2 measurements
      const topCodes = sortedCodes
        .filter(c => c.latestValue !== null && c.count >= 2)
        .slice(0, 6)
        .map(c => c.code || c.text);
      
      console.log('Auto-selected codes:', topCodes);
      setSelectedCodes(topCodes);
      
    } catch (error) {
      console.error('Error analyzing observations:', error);
      setCodeAnalysis([]);
      setSelectedCodes([]);
    } finally {
      setIsAnalyzing(false);
      console.log('Analysis state set to false');
    }
  }
  
  // Get data for selected codes - only include codes with 2+ measurements
  const chartData = useMemo(() => {
    if (!selectedCodes.length || !observations.length) return [];
    
    return selectedCodes.map(codeId => {
      // Find observations for this code
      const codeObs = observations.filter(obs => {
        const hasCode = get(obs, 'code.coding', []).some(c => c.code === codeId);
        const hasText = get(obs, 'code.text') === codeId;
        return hasCode || hasText;
      });
      
      // Get display name
      const codeInfo = codeAnalysis?.find(c => c.code === codeId || c.text === codeId);
      const displayName = codeInfo?.display || codeInfo?.text || codeId;
      
      return {
        code: codeId,
        display: displayName,
        unit: codeInfo?.unit || '',
        observations: orderBy(codeObs, ['effectiveDateTime'], ['asc'])
      };
    }).filter(data => data.observations.length >= 2); // Only show graphs with 2+ data points
  }, [selectedCodes, observations, codeAnalysis]);
  
  // Format data for time display
  function getTimeFormat() {
    switch (timescale) {
      case 0: return 'MMM DD, YYYY';  // all
      case 1: return 'YYYY';           // year
      case 2: return 'YYYY [Q]Q';      // season/quarter
      case 3: return 'YYYY-MM';        // month
      case 4: return 'YYYY [W]ww';     // week
      case 5: return 'YYYY-MM-DD';     // day
      case 6: return 'HH:00';          // hour
      case 7: return 'HH:mm';          // minute
      default: return 'MMM DD, YYYY';
    }
  }
  
  function handleCodeToggle(codeId) {
    setSelectedCodes(prev => {
      if (prev.includes(codeId)) {
        return prev.filter(c => c !== codeId);
      } else {
        return [...prev, codeId];
      }
    });
  }
  
  function handleTimescaleChange(event) {
    setTimescale(event.target.value);
  }
  
  // Render content
  if (!selectedPatient) {
    return (
      <Box 
        sx={{
          minHeight: '100vh',
          backgroundColor: theme => theme.palette.mode === 'light' 
            ? theme.palette.grey[50]  // Off-white in light mode for card contrast
            : theme.palette.background.default,  // Default dark background
          paddingTop: '40px',
          paddingLeft: paddingWidth + 'px',
          paddingRight: paddingWidth + 'px'
        }}
      >
        <NoDataWrapper 
          dataCount={0} 
          noDataImagePath=""
          history={props.history} 
          title="No Patient Selected"
          subheader="Please select a patient to view their comprehensive medical dashboard. The dashboard will display encounters, conditions, procedures, observations, and other clinical data."
          buttonLabel="Lookup Patient"
          redirectPath="/patient-directory"
          titleVariant="h5"
        />
      </Box>
    );
  }
  
  // Check if we're still loading
  const subscriptionLoading = isLoadingSubscription();
  
  // Debug logging
  console.log('Subscription loading:', subscriptionLoading);
  console.log('Is analyzing:', isAnalyzing);
  console.log('Observations count:', observations.length);
  console.log('Code analysis:', codeAnalysis);
  
  // Don't show loading if we have already analyzed the data
  // The subscription might stay "loading" but if we have data, show it
  if (!codeAnalysis && (subscriptionLoading || isAnalyzing)) {
    return (
      <div style={{paddingTop: 40, paddingLeft: paddingWidth, paddingRight: paddingWidth}}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="h6" style={{marginLeft: 20}}>
            {isAnalyzing ? `Analyzing ${observations.length} observations...` : 'Loading observations...'}
          </Typography>
        </Box>
      </div>
    );
  }
  
  return (
    <div id='biomarkerChartingPage' style={{paddingTop: 40, paddingLeft: paddingWidth, paddingRight: paddingWidth}}>

      {/* Settings Modal */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: cardBgColor,
            color: cardTextColor
          },
          '& .MuiDialogTitle-root': { color: cardTextColor },
          '& .MuiDialogContent-root': {
            borderColor: borderColor
          },
          '& .MuiInputLabel-root': { color: cardTextColor },
          '& .MuiSelect-root': { color: cardTextColor },
          '& .MuiSelect-icon': { color: cardTextColor },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
          '& .MuiMenuItem-root': {
            color: cardTextColor
          },
          '& .MuiIconButton-root': { color: cardTextColor },
          '& .MuiButton-root': { color: cardTextColor }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            Biomarker Charting Settings
            <IconButton onClick={() => setSettingsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="timescale-label">Timescale</InputLabel>
                <Select
                  labelId="timescale-label"
                  value={timescale}
                  onChange={handleTimescaleChange}
                  label="Timescale"
                >
                  <MenuItem value={0}>All</MenuItem>
                  <MenuItem value={1}>Year</MenuItem>
                  <MenuItem value={2}>Quarter</MenuItem>
                  <MenuItem value={3}>Month</MenuItem>
                  <MenuItem value={4}>Week</MenuItem>
                  <MenuItem value={5}>Day</MenuItem>
                  <MenuItem value={6}>Hour</MenuItem>
                  <MenuItem value={7}>Minute</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Select Biomarkers to Display:
              </Typography>
              <Typography variant="body2" sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
              }} gutterBottom>
                Click chips to toggle biomarkers on/off. Only biomarkers with 2+ measurements will display charts.
              </Typography>
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                maxHeight: '300px',
                overflow: 'auto',
                padding: '12px',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                bgcolor: isDark ? '#2a2a2a' : '#f5f5f5'
              }}>
                {codeAnalysis?.filter(c => c.latestValue !== null && c.count >= 2).map(code => (
                  <Chip
                    key={code.code || code.text}
                    label={`${code.display || code.text} (${code.count})`}
                    onClick={() => handleCodeToggle(code.code || code.text)}
                    variant={selectedCodes.includes(code.code || code.text) ? "filled" : "outlined"}
                    color={selectedCodes.includes(code.code || code.text) ? "primary" : "default"}
                    size="small"
                    sx={!selectedCodes.includes(code.code || code.text) ? {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                      color: cardTextColor,
                      borderColor: borderColor
                    } : {}}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3} style={{marginBottom: '84px'}}>
        
        {/* Two column layout - Table on left, Graphs on right */}
        {codeAnalysis && codeAnalysis.length > 0 && (
          <>
            {/* Left Column - Discovered Observation Codes Table */}
            <Grid item xs={12} md={6}>
              <Card sx={{
                bgcolor: cardBgColor,
                color: cardTextColor,
                '& .MuiCardHeader-title': { color: cardTextColor },
                '& .MuiTableCell-root': {
                  color: cardTextColor,
                  borderColor: borderColor
                },
                '& .MuiTableCell-head': {
                  bgcolor: cardBgColor,
                  color: cardTextColor,
                  fontWeight: 'bold'
                },
                '& .MuiTypography-root': {
                  color: cardTextColor
                },
                '& .MuiTypography-colorTextSecondary': {
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                },
                '& .MuiIconButton-root': {
                  color: cardTextColor,
                  borderColor: borderColor
                }
              }}>
                <CardHeader
                  title="Discovered Observation Codes"
                  action={
                    <IconButton
                      onClick={() => setSettingsOpen(true)}
                      aria-label="settings"
                      sx={{
                        border: `1px solid ${borderColor}`,
                        '&:hover': {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <SettingsIcon />
                    </IconButton>
                  }
                />
                <CardContent>
                  <TableContainer component={Paper} variant="outlined" sx={{
                    bgcolor: cardBgColor,
                    borderColor: borderColor
                  }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ py: 1 }}>Code / System</TableCell>
                          <TableCell sx={{ py: 1 }}>Display Name / Date Range</TableCell>
                          <TableCell sx={{ py: 1 }} align="right">Latest Value</TableCell>
                          <TableCell sx={{ py: 1 }}>Unit</TableCell>
                          <TableCell sx={{ py: 1 }} align="center">Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {codeAnalysis.slice(0, 20).map((code, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ py: '10px' }}>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {code.code || 'N/A'}
                                </Typography>
                                <Typography variant="caption" sx={{
                                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                                }}>
                                  {code.system ? code.system.split('/').pop() : 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: '10px' }}>
                              <Box>
                                <Typography variant="body2">
                                  {code.display || code.text || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" sx={{
                                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                                }}>
                                  {code.dates.length > 0 ? (
                                    <>
                                      {moment(Math.min(...code.dates.map(d => new Date(d)))).format('MMM YYYY')}
                                      {' - '}
                                      {moment(Math.max(...code.dates.map(d => new Date(d)))).format('MMM YYYY')}
                                    </>
                                  ) : 'No dates'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: '10px' }} align="right">
                              <Typography variant="body2">
                                {code.latestValue || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: '10px' }}>
                              <Typography variant="body2">
                                {code.unit || ''}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: '10px' }} align="center">
                              <Chip
                                label={code.count}
                                size="small"
                                color={code.count >= 10 ? "primary" : "default"}
                                variant={code.count >= 10 ? "filled" : "outlined"}
                                sx={code.count < 10 ? {
                                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                                  color: cardTextColor,
                                  borderColor: borderColor
                                } : {}}
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
            
            {/* Right Column - All Charts */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                {chartData.map((data, index) => {
                  // Calculate Y-axis range with some padding
                  const values = data.observations.map(obs => get(obs, 'valueQuantity.value', 0));
                  const minValue = Math.min(...values);
                  const maxValue = Math.max(...values);
                  const padding = (maxValue - minValue) * 0.1;
                  
                  return (
                    <Grid item xs={12} key={data.code}>
                      <Card sx={{
                        bgcolor: cardBgColor,
                        color: cardTextColor,
                        '& .MuiCardHeader-title': { color: cardTextColor },
                        '& .MuiCardHeader-subheader': {
                          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                        }
                      }}>
                <CardHeader
                  title={data.display}
                  subheader={`${data.observations.length} measurements`}
                  style={{paddingBottom: '0px'}}
                />
                <CardContent style={{paddingTop: '0px'}}>
                  <div style={{ width: '100%', height: chartHeight }}>
                    <ResponsiveLine
                      data={[{
                        id: data.display,
                        color: "hsl(" + (index * 60) + ", 70%, 50%)",
                        data: data.observations.map(obs => ({
                          x: moment(get(obs, 'effectiveDateTime')).format(getTimeFormat()),
                          y: get(obs, 'valueQuantity.value', 0)
                        }))
                      }]}
                      margin={{
                        top: 20,
                        right: 40,
                        bottom: 60,
                        left: 60
                      }}
                      xScale={{ type: 'point' }}
                      yScale={{ 
                        type: 'linear',
                        min: minValue - padding,
                        max: maxValue + padding,
                        stacked: false,
                        reverse: false
                      }}
                      yFormat=" >-.2f"
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45,
                        legend: 'Date',
                        legendOffset: 50,
                        legendPosition: 'middle',
                        tickValues: data.observations.length > 10 ? 
                          `every ${Math.ceil(data.observations.length / 8)}` : 
                          undefined
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: data.unit || 'Value',
                        legendOffset: -45,
                        legendPosition: 'middle',
                        format: v => `${v}`
                      }}
                      curve='monotoneX'
                      pointSize={6}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      pointLabelYOffset={-12}
                      useMesh={true}
                      enableGridX={false}
                      enableGridY={true}
                      enableArea={false}
                      animate={true}
                      motionConfig="gentle"
                      tooltip={({ point }) => (
                        <div style={{
                          background: cardBgColor,
                          color: cardTextColor,
                          padding: '9px 12px',
                          border: `1px solid ${borderColor}`,
                          borderRadius: '3px'
                        }}>
                          <div><strong>{point.data.xFormatted}</strong></div>
                          <div>{point.data.yFormatted} {data.unit}</div>
                        </div>
                      )}
                    />
                  </div>
                </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
                
                {chartData.length === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{
                      bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                      color: cardTextColor,
                      '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
                      '& .MuiAlertTitle-root': { color: cardTextColor }
                    }}>
                      <AlertTitle>No Charts Selected</AlertTitle>
                      Select biomarkers from the chips above to display their charts. Only biomarkers with 2 or more measurements can be charted.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </div>
  );
}

export default BiomarkerChartingPage;