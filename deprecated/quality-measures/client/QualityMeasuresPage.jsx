// packages/quality-measures/client/QualityMeasuresPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  CircularProgress,
  Alert,
  AlertTitle,
  Badge,
  Tooltip,
  Collapse,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import CQMFilterPanel from './CQMFilterPanel';
import QMSDashboard from './QMSDashboard';
import PacioMeasureDetail from './components/PacioMeasureDetail';
import { isPacioMeasure } from '../lib/pacio-measures';

// Icons
import {
  Assessment as AssessmentIcon,
  Calculate as CalculateIcon,
  CloudDownload as ExportIcon,
  CloudUpload as ImportIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Group as PopulationIcon,
  Person as PatientIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Description as DocumentIcon,
  Code as CQLIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  BarChart as ChartIcon,
  Timeline as TimelineIcon,
  PlayArrow as RunIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon
} from '@mui/icons-material';

// Sample CMS measures
const CMS_MEASURES = [
  {
    id: 'CMS2v13',
    nqfNumber: '0418',
    title: 'Preventive Care and Screening: Screening for Depression and Follow-Up Plan',
    description: 'Percentage of patients aged 12+ screened for depression and if positive, a follow-up plan documented',
    type: 'Process',
    scoring: 'Proportion',
    reportingPrograms: ['MIPS', 'PCF', 'APP'],
    status: 'Active',
    version: '13.0.0',
    effectivePeriod: { start: '2024-01-01', end: '2024-12-31' },
    populations: {
      initialPopulation: 'Patients aged 12+ with qualifying encounter',
      denominator: 'Equals Initial Population',
      numerator: 'Patients screened for depression with follow-up if positive',
      denominatorExclusions: 'Patients with active diagnosis of depression or bipolar disorder',
      denominatorExceptions: 'Medical or patient reasons for not screening'
    },
    lastCalculated: null,
    currentScore: null
  },
  {
    id: 'CMS122v12',
    nqfNumber: '0059',
    title: 'Diabetes: Hemoglobin A1c (HbA1c) Poor Control (>9%)',
    description: 'Percentage of patients 18-75 years with diabetes who had HbA1c > 9% or no test',
    type: 'Intermediate Outcome',
    scoring: 'Proportion',
    reportingPrograms: ['MIPS', 'APP', 'ACO'],
    status: 'Active',
    version: '12.0.0',
    effectivePeriod: { start: '2024-01-01', end: '2024-12-31' },
    populations: {
      initialPopulation: 'Patients 18-75 with diabetes and qualifying encounter',
      denominator: 'Equals Initial Population',
      numerator: 'Patients with most recent HbA1c > 9% or no test',
      denominatorExclusions: 'Hospice care, palliative care',
      denominatorExceptions: 'None'
    },
    lastCalculated: '2024-01-15T10:30:00',
    currentScore: 0.23 // Lower is better for this inverse measure
  },
  {
    id: 'CMS146v11',
    nqfNumber: null,
    title: 'Appropriate Testing for Pharyngitis',
    description: 'Percentage of pharyngitis episodes with antibiotic dispensed and appropriate testing',
    type: 'Process',
    scoring: 'Proportion',
    reportingPrograms: ['MIPS'],
    status: 'Active', 
    version: '11.0.0',
    effectivePeriod: { start: '2024-01-01', end: '2024-12-31' },
    populations: {
      initialPopulation: 'Pharyngitis episodes with antibiotic',
      denominator: 'Equals Initial Population',
      numerator: 'Episodes with strep test performed',
      denominatorExclusions: 'Competing diagnosis',
      denominatorExceptions: 'None'
    },
    lastCalculated: '2024-01-14T14:15:00',
    currentScore: 0.88
  },
  {
    id: 'CMS165v12',
    nqfNumber: '0018',
    title: 'Controlling High Blood Pressure',
    description: 'Percentage of patients 18-85 with hypertension whose BP was adequately controlled',
    type: 'Intermediate Outcome',
    scoring: 'Proportion',
    reportingPrograms: ['MIPS', 'PCF', 'APP', 'ACO'],
    status: 'Active',
    version: '12.0.0',
    effectivePeriod: { start: '2024-01-01', end: '2024-12-31' },
    populations: {
      initialPopulation: 'Patients 18-85 with essential hypertension',
      denominator: 'Equals Initial Population',
      numerator: 'Patients with BP < 140/90 mmHg',
      denominatorExclusions: 'ESRD, kidney transplant, pregnancy',
      denominatorExceptions: 'None'
    },
    lastCalculated: '2024-01-15T09:00:00',
    currentScore: 0.72
  },
  {
    id: 'PACIO-ICARE-v1',
    nqfNumber: null,
    title: 'I-CARE: Completeness of Transitions of Care Documentation',
    description: 'Percentage of patients discharged to post-acute care whose TOC Composition has all required sections populated',
    type: 'Process',
    scoring: 'Proportion',
    reportingPrograms: ['PACIO'],
    status: 'Draft',
    version: '0.1.0',
    effectivePeriod: { start: '2026-01-01', end: '2026-12-31' },
    populations: {
      initialPopulation: 'Patients discharged from hospital to PAC within measurement period',
      denominator: 'Equals Initial Population',
      numerator: 'Patients whose TOC Composition has all required sections with entries',
      denominatorExclusions: 'Patients who died during encounter or discharged AMA',
      denominatorExceptions: 'None'
    },
    lastCalculated: null,
    currentScore: null
  },
  {
    id: 'CMS1317v1',
    nqfNumber: null,
    title: 'CMS1317v1: Advance Care Planning (PACIO FHIR mapping)',
    description: 'Percentage of patients 18+ discharged from an acute care hospital with ACP documentation: an ACP document, a Z66 DNR status, or a documented ACP discussion with decision (draft eCQM modeled on Quality ID #047)',
    type: 'Process',
    scoring: 'Proportion',
    reportingPrograms: ['PACIO'],
    status: 'Draft',
    version: '1.0.000',
    effectivePeriod: { start: '2026-01-01', end: '2026-12-31' },
    populations: {
      initialPopulation: 'Patients 18+ at measurement period start with an inpatient discharge from an acute/critical access hospital during the period',
      denominator: 'Equals Initial Population (no exclusions)',
      numerator: 'ANY of: ACP document before encounter end; ICD-10-CM Z66 DNR status during hospitalization; documented ACP discussion with decision during encounter',
      denominatorExclusions: 'None',
      denominatorExceptions: 'None'
    },
    lastCalculated: null,
    currentScore: null
  }
];

// Population criteria definitions
const POPULATION_CRITERIA = {
  'initial-population': { label: 'Initial Population', color: '#1976d2', abbreviation: 'IP' },
  'denominator': { label: 'Denominator', color: '#388e3c', abbreviation: 'D' },
  'denominator-exclusion': { label: 'Denominator Exclusion', color: '#f57c00', abbreviation: 'DE' },
  'denominator-exception': { label: 'Denominator Exception', color: '#fbc02d', abbreviation: 'DEx' },
  'numerator': { label: 'Numerator', color: '#7b1fa2', abbreviation: 'N' },
  'numerator-exclusion': { label: 'Numerator Exclusion', color: '#c62828', abbreviation: 'NE' },
  'measure-population': { label: 'Measure Population', color: '#00796b', abbreviation: 'MP' },
  'measure-population-exclusion': { label: 'Measure Population Exclusion', color: '#5d4037', abbreviation: 'MPE' },
  'measure-observation': { label: 'Measure Observation', color: '#455a64', abbreviation: 'MO' }
};

export default function QualityMeasuresPage() {
  // State management
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [measurementPeriod, setMeasurementPeriod] = useState({
    start: '2024-01-01',
    end: '2024-12-31'
  });
  const [calculationStatus, setCalculationStatus] = useState('idle');
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [reportType, setReportType] = useState('individual');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [measureResults, setMeasureResults] = useState({});
  const [exportFormat, setExportFormat] = useState('fhir');
  const [showCQL, setShowCQL] = useState(false);
  const [patientList, setPatientList] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');

  // Load the real patient list from the local collection (no mock results —
  // the Results tab populates only from actual calculations)
  useEffect(() => {
    const Patients = Meteor.Collections && Meteor.Collections.Patients;
    if (!Patients) {
      console.warn('[QualityMeasuresPage] Patients collection not available');
      return;
    }

    const patients = Patients.find({}, { limit: 200 }).fetch().map(function(patient) {
      const name = get(patient, 'name[0]');
      const display = get(name, 'text') ||
        ((get(name, 'given[0]', '') + ' ' + get(name, 'family', '')).trim()) ||
        patient._id;
      return {
        id: patient._id,
        name: display,
        birthDate: get(patient, 'birthDate')
      };
    });

    setPatientList(patients);
  }, []);

  const handleCalculateMeasure = useCallback(async () => {
    if (!selectedMeasure) return;

    setCalculationStatus('calculating');
    setCalculationProgress(0);

    try {
      const result = await Meteor.callAsync('qualityMeasures.calculate', {
        measureId: selectedMeasure.id,
        periodStart: measurementPeriod.start,
        periodEnd: measurementPeriod.end,
        reportType: reportType,
        patientId: selectedPatient?.id
      });

      console.log('Calculation result:', result);

      // Parse the MeasureReport populations into the shape the results
      // tables render, and keep the evaluator details for PacioMeasureDetail
      const populations = get(result, 'measureReport.group[0].population', []);
      function countOf(code) {
        const population = populations.find(function(pop) {
          return get(pop, 'code.coding[0].code') === code;
        });
        return get(population, 'count', 0);
      }

      setMeasureResults(function(prev) {
        return Object.assign({}, prev, {
          [selectedMeasure.id]: {
            initialPopulation: countOf('initial-population'),
            denominator: countOf('denominator'),
            denominatorExclusions: countOf('denominator-exclusion'),
            denominatorExceptions: countOf('denominator-exception'),
            numerator: countOf('numerator'),
            numeratorExclusions: countOf('numerator-exclusion'),
            score: get(result, 'measureReport.group[0].measureScore.value',
              countOf('numerator') / Math.max(countOf('denominator') - countOf('denominator-exclusion'), 1)),
            stratifications: get(result, 'measureReport.group[0].stratifier', []),
            engine: get(result, 'engine'),
            evaluationResult: get(result, 'evaluationResult', null)
          }
        });
      });

      setCalculationProgress(100);
      setCalculationStatus('complete');
      setDialogType('success');
      setDialogOpen(true);
    } catch (error) {
      console.error('Calculation error:', error);
      setCalculationStatus('error');
      setDialogType('error');
      setDialogOpen(true);
    }
  }, [selectedMeasure, measurementPeriod, reportType, selectedPatient]);

  const handleExportResults = useCallback(async () => {
    try {
      const result = await Meteor.callAsync('qualityMeasures.export', {
        measureIds: selectedMeasure ? [selectedMeasure.id] : CMS_MEASURES.map(m => m.id),
        format: exportFormat,
        periodStart: measurementPeriod.start,
        periodEnd: measurementPeriod.end
      });
      
      console.log('Export result:', result);
      // In production, would trigger file download
    } catch (error) {
      console.error('Export error:', error);
    }
  }, [selectedMeasure, exportFormat, measurementPeriod]);

  const getScoreIcon = (score) => {
    if (score === null) return <TrendingFlatIcon color="disabled" />;
    if (score >= 0.9) return <TrendingUpIcon color="success" />;
    if (score >= 0.7) return <TrendingFlatIcon color="warning" />;
    return <TrendingDownIcon color="error" />;
  };

  const getScoreColor = (score) => {
    if (score === null) return 'default';
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'warning';
    return 'error';
  };

  const handleFiltersChange = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  return (
    <Box sx={{ 
      p: 2,
      minHeight: '100vh',
      bgcolor: theme => theme.palette.mode === 'light' ? 'grey.50' : 'background.default'
    }}>
      {/* Header with Period Selector and Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Tab Navigation */}
        <Tabs 
          value={selectedTab} 
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab 
            label="Measures & Calculation" 
            icon={<AssessmentIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Filter & Analytics" 
            icon={<FilterIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Quality Management System" 
            icon={<SettingsIcon />}
            iconPosition="start"
          />
        </Tabs>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Clinical Quality Measures
            </Typography>
            <Typography variant="caption" color="text.secondary">
              CQF-Measures FHIR Implementation
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Period Start"
                type="date"
                value={measurementPeriod.start}
                onChange={(e) => setMeasurementPeriod({...measurementPeriod, start: e.target.value})}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Period End"
                type="date"
                value={measurementPeriod.end}
                onChange={(e) => setMeasurementPeriod({...measurementPeriod, end: e.target.value})}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <ToggleButtonGroup
              value={reportType}
              exclusive
              onChange={(e, val) => val && setReportType(val)}
              size="small"
              fullWidth
            >
              <ToggleButton value="individual">
                <Tooltip title="Individual Patient"><PatientIcon /></Tooltip>
              </ToggleButton>
              <ToggleButton value="summary">
                <Tooltip title="Population Summary"><PopulationIcon /></Tooltip>
              </ToggleButton>
              <ToggleButton value="stratified">
                <Tooltip title="Stratified Report"><ChartIcon /></Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                startIcon={<ImportIcon />}
                variant="outlined"
                size="small"
                onClick={() => {
                  setDialogType('import');
                  setDialogOpen(true);
                }}
              >
                Import
              </Button>
              <Button
                startIcon={<ExportIcon />}
                variant="outlined"
                size="small"
                onClick={handleExportResults}
              >
                Export
              </Button>
              <Button
                startIcon={<CalculateIcon />}
                variant="contained"
                size="small"
                onClick={handleCalculateMeasure}
                disabled={!selectedMeasure || calculationStatus === 'calculating'}
              >
                Calculate
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        // Measures & Calculation Tab
        <>
          {/* Main Content Grid */}
          <Grid container spacing={2}>
        {/* Left Panel - Measure List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Available Measures"
              subheader={`${CMS_MEASURES.length} measures loaded`}
              avatar={<AssessmentIcon />}
              action={
                <IconButton size="small">
                  <FilterIcon />
                </IconButton>
              }
            />
            <CardContent sx={{ p: 0 }}>
              <List>
                {CMS_MEASURES.map((measure) => (
                  <ListItem
                    key={measure.id}
                    button
                    selected={selectedMeasure?.id === measure.id}
                    onClick={() => setSelectedMeasure(measure)}
                    divider
                  >
                    <ListItemIcon>
                      {getScoreIcon(measure.currentScore)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">{measure.id}</Typography>
                          {measure.nqfNumber && (
                            <Chip label={`NQF ${measure.nqfNumber}`} size="small" />
                          )}
                          {measure.status === 'Draft' && (
                            <Chip label="Draft" size="small" color="warning" variant="outlined" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {measure.title}
                          </Typography>
                          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                            {measure.reportingPrograms.map(prog => (
                              <Chip key={prog} label={prog} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </>
                      }
                    />
                    {measure.currentScore !== null && (
                      <ListItemSecondaryAction>
                        <Chip 
                          label={`${(measure.currentScore * 100).toFixed(1)}%`}
                          color={getScoreColor(measure.currentScore)}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Center Panel - Measure Details & Calculation */}
        <Grid item xs={12} md={4}>
          {selectedMeasure ? (
            <Stack spacing={2}>
              {/* Measure Details Card */}
              <Card>
                <CardHeader 
                  title={selectedMeasure.id}
                  subheader={`Version ${selectedMeasure.version}`}
                  action={
                    <IconButton onClick={() => setShowCQL(!showCQL)}>
                      <CQLIcon />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        {selectedMeasure.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedMeasure.description}
                      </Typography>
                    </Box>

                    <Divider />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Type
                        </Typography>
                        <Typography variant="body2">
                          {selectedMeasure.type}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Scoring
                        </Typography>
                        <Typography variant="body2">
                          {selectedMeasure.scoring}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Population Criteria */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Population Criteria
                      </Typography>
                      <Stack spacing={1}>
                        {Object.entries(selectedMeasure.populations).map(([key, value]) => (
                          <Box key={key}>
                            <Typography variant="caption" color="text.secondary">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </Typography>
                            <Typography variant="body2" sx={{ pl: 2 }}>
                              {value}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>

                    {/* CQL View */}
                    <Collapse in={showCQL}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: theme => theme.palette.mode === 'light' ? 'grey.100' : 'grey.900' }}>
                        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
{`library ${selectedMeasure.id} version '${selectedMeasure.version}'

using FHIR version '4.0.1'

parameter "Measurement Period" Interval<DateTime>

context Patient

define "Initial Population":
  ${selectedMeasure.populations.initialPopulation}

define "Denominator":
  ${selectedMeasure.populations.denominator}

define "Numerator":
  ${selectedMeasure.populations.numerator}`}
                        </Typography>
                      </Paper>
                    </Collapse>
                  </Stack>
                </CardContent>
              </Card>

              {/* Calculation Progress */}
              {calculationStatus !== 'idle' && (
                <Card>
                  <CardHeader
                    title="Calculation Progress"
                    avatar={
                      calculationStatus === 'calculating' ? (
                        <CircularProgress size={20} />
                      ) : calculationStatus === 'complete' ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )
                    }
                  />
                  <CardContent>
                    <LinearProgress
                      variant="determinate"
                      value={calculationProgress}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {calculationStatus === 'calculating' && `Processing... ${calculationProgress}%`}
                      {calculationStatus === 'complete' && 'Calculation complete'}
                      {calculationStatus === 'error' && 'Calculation failed'}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* PACIO Measure Detail (evaluator-backed Connectathon measures) */}
              {isPacioMeasure(selectedMeasure.id) && (
                <PacioMeasureDetail
                  measureId={selectedMeasure.id}
                  evaluationResult={get(measureResults, selectedMeasure.id + '.evaluationResult', null)}
                />
              )}
            </Stack>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a measure to view details
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Panel - Results & Population Breakdown */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Results Summary */}
            {selectedMeasure && measureResults[selectedMeasure.id] && (
              <Card>
                <CardHeader 
                  title="Calculation Results"
                  subheader={selectedMeasure.lastCalculated ? 
                    `Last calculated: ${new Date(selectedMeasure.lastCalculated).toLocaleString()}` : 
                    'Not yet calculated'
                  }
                />
                <CardContent>
                  {/* Population Waterfall */}
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Population</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">%</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ 
                                width: 12, 
                                height: 12, 
                                bgcolor: POPULATION_CRITERIA['initial-population'].color,
                                borderRadius: '2px'
                              }} />
                              <Typography variant="body2">Initial Population</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {measureResults[selectedMeasure.id].initialPopulation}
                          </TableCell>
                          <TableCell align="right">100%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ 
                                width: 12, 
                                height: 12, 
                                bgcolor: POPULATION_CRITERIA['denominator'].color,
                                borderRadius: '2px'
                              }} />
                              <Typography variant="body2">Denominator</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {measureResults[selectedMeasure.id].denominator}
                          </TableCell>
                          <TableCell align="right">
                            {((measureResults[selectedMeasure.id].denominator / 
                              measureResults[selectedMeasure.id].initialPopulation) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                        {measureResults[selectedMeasure.id].denominatorExclusions > 0 && (
                          <TableRow>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  bgcolor: POPULATION_CRITERIA['denominator-exclusion'].color,
                                  borderRadius: '2px'
                                }} />
                                <Typography variant="body2">- Exclusions</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              {measureResults[selectedMeasure.id].denominatorExclusions}
                            </TableCell>
                            <TableCell align="right">
                              {((measureResults[selectedMeasure.id].denominatorExclusions / 
                                measureResults[selectedMeasure.id].denominator) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ 
                                width: 12, 
                                height: 12, 
                                bgcolor: POPULATION_CRITERIA['numerator'].color,
                                borderRadius: '2px'
                              }} />
                              <Typography variant="body2">Numerator</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {measureResults[selectedMeasure.id].numerator}
                          </TableCell>
                          <TableCell align="right">
                            {((measureResults[selectedMeasure.id].numerator / 
                              (measureResults[selectedMeasure.id].denominator - 
                               measureResults[selectedMeasure.id].denominatorExclusions)) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={2}>
                            <Typography variant="subtitle2">Performance Rate</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${(measureResults[selectedMeasure.id].score * 100).toFixed(1)}%`}
                              color={getScoreColor(measureResults[selectedMeasure.id].score)}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            {/* Patient List (for individual reports) */}
            {reportType === 'individual' && (
              <Card>
                <CardHeader 
                  title="Patient Selection"
                  subheader="Select patient for individual calculation"
                  avatar={<PatientIcon />}
                />
                <CardContent sx={{ p: 0 }}>
                  <List dense>
                    {patientList.map((patient) => (
                      <ListItem
                        key={patient.id}
                        button
                        selected={selectedPatient?.id === patient.id}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <ListItemText
                          primary={patient.name}
                          secondary={patient.birthDate ? `Born: ${patient.birthDate}` : patient.id}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Export Options */}
            <Card>
              <CardHeader 
                title="Export Options"
                avatar={<ExportIcon />}
              />
              <CardContent>
                <FormControl fullWidth size="small">
                  <InputLabel>Export Format</InputLabel>
                  <Select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    label="Export Format"
                  >
                    <MenuItem value="fhir">FHIR MeasureReport</MenuItem>
                    <MenuItem value="qrda1" disabled>QRDA Category I (not implemented)</MenuItem>
                    <MenuItem value="qrda3" disabled>QRDA Category III (not implemented)</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ mt: 2 }}>
                  <FormGroup>
                    <FormControlLabel 
                      control={<Checkbox defaultChecked />} 
                      label="Include patient demographics" 
                    />
                    <FormControlLabel 
                      control={<Checkbox defaultChecked />} 
                      label="Include stratifications" 
                    />
                    <FormControlLabel 
                      control={<Checkbox />} 
                      label="Include supplemental data" 
                    />
                  </FormGroup>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Bottom Tabs for Additional Features */}
      <Paper sx={{ mt: 2 }}>
        <Tabs value={selectedTab} onChange={(e, val) => setSelectedTab(val)}>
          <Tab label="Dashboard" />
          <Tab label="Bulk Operations" />
          <Tab label="Quality Programs" />
          <Tab label="CQL Library" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {selectedTab === 0 && (
            <Grid container spacing={2}>
              {CMS_MEASURES.map((measure) => (
                <Grid item xs={12} md={3} key={measure.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        {measure.id}
                      </Typography>
                      <Typography variant="h4">
                        {measure.currentScore !== null ? 
                          `${(measure.currentScore * 100).toFixed(1)}%` : 
                          'N/A'
                        }
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {measure.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          {selectedTab === 1 && (
            <Stack spacing={2}>
              <Alert severity="info">
                <AlertTitle>Bulk Operations</AlertTitle>
                Calculate all measures for all patients in the selected measurement period.
              </Alert>
              <Button 
                variant="contained" 
                startIcon={<RunIcon />}
                onClick={() => console.log('Run bulk calculation')}
              >
                Start Bulk Calculation
              </Button>
            </Stack>
          )}
          {selectedTab === 2 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1">Reporting Programs</Typography>
              <Grid container spacing={2}>
                {['MIPS', 'PCF', 'APP', 'ACO'].map(program => (
                  <Grid item xs={6} md={3} key={program}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{program}</Typography>
                        <Typography variant="caption">
                          {CMS_MEASURES.filter(m => m.reportingPrograms.includes(program)).length} measures
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          )}
          {selectedTab === 3 && (
            <Stack spacing={2}>
              <Alert severity="info">
                <AlertTitle>CQL Library Management</AlertTitle>
                Manage Clinical Quality Language libraries and value sets.
              </Alert>
              <Button startIcon={<DocumentIcon />} variant="outlined">
                Import CQL Library
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Success/Error Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {dialogType === 'success' ? 'Calculation Complete' : 
           dialogType === 'error' ? 'Calculation Error' : 
           dialogType === 'import' ? 'Import QRDA/FHIR Data' : 'Export'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'success' && (
            <Alert severity="success">
              Measure calculation completed successfully. Results have been saved.
            </Alert>
          )}
          {dialogType === 'error' && (
            <Alert severity="error">
              An error occurred during calculation. Please check your data and try again.
            </Alert>
          )}
          {dialogType === 'import' && (
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Import Format</InputLabel>
                <Select defaultValue="fhir" label="Import Format">
                  <MenuItem value="fhir">FHIR Bundle</MenuItem>
                  <MenuItem value="qrda1" disabled>QRDA Category I (not implemented)</MenuItem>
                  <MenuItem value="c-cda" disabled>C-CDA (not implemented)</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" component="label">
                Select File
                <input type="file" hidden />
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          {dialogType === 'import' && (
            <Button variant="contained" onClick={() => setDialogOpen(false)}>
              Import
            </Button>
          )}
        </DialogActions>
      </Dialog>
        </>
      )}

      {selectedTab === 1 && (
        // Filter & Analytics Tab
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <CQMFilterPanel 
              onFiltersChange={handleFiltersChange}
              initialFilters={activeFilters}
            />
          </Grid>
          {Object.keys(activeFilters).length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Filtered Measure Results" />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Apply the current filters to recalculate measures with the filtered population.
                    This demonstrates ONC 170.315(c)(4) filter functionality.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<CalculateIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => {
                      // Calculate with filters
                      console.log('Calculating with filters:', activeFilters);
                    }}
                  >
                    Calculate with Filters
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {selectedTab === 2 && (
        // Quality Management System Tab
        <QMSDashboard />
      )}
    </Box>
  );
}