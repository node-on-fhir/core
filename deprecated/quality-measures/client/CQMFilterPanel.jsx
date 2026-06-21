// packages/quality-measures/client/CQMFilterPanel.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  LocalHospital as ConditionIcon,
  CalendarToday as DateIcon,
  Group as PopulationIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import moment from 'moment';

// SNOMED CT codes for patient sex (ONC 170.315(c)(4) 2025 compliance)
const PATIENT_SEX_CODES = [
  { code: '248152002', display: 'Female' },
  { code: '248153007', display: 'Male' },
  { code: '32570681000036106', display: 'Intersex' },
  { code: '407377005', display: 'Female-to-male transsexual' },
  { code: '407376001', display: 'Male-to-female transsexual' },
  { code: '446141000124107', display: 'Identifies as non-conforming gender' },
  { code: '446151000124109', display: 'Identifies as non-binary gender' }
];

// Common clinical condition codes
const COMMON_CONDITIONS = [
  { code: '73211009', display: 'Diabetes mellitus' },
  { code: '38341003', display: 'Hypertensive disorder' },
  { code: '22298006', display: 'Myocardial infarction' },
  { code: '195967001', display: 'Asthma' },
  { code: '13746004', display: 'Bipolar disorder' },
  { code: '44054006', display: 'Diabetes mellitus type 2' },
  { code: '46635009', display: 'Diabetes mellitus type 1' },
  { code: '27550009', display: 'Disorder of cardiovascular system' }
];

// Age range presets
const AGE_RANGES = [
  { label: 'All Ages', min: 0, max: 120 },
  { label: 'Pediatric (0-17)', min: 0, max: 17 },
  { label: 'Adult (18-64)', min: 18, max: 64 },
  { label: 'Geriatric (65+)', min: 65, max: 120 },
  { label: 'Adolescent (12-17)', min: 12, max: 17 },
  { label: 'Young Adult (18-34)', min: 18, max: 34 },
  { label: 'Middle Age (35-54)', min: 35, max: 54 },
  { label: 'Senior (55+)', min: 55, max: 120 }
];

export function CQMFilterPanel({ onFiltersChange, initialFilters = {} }) {
  // ONC 170.315(c)(4) Clinical Quality Measures Filter Component
  const [filters, setFilters] = useState({
    // Demographics
    ageMin: get(initialFilters, 'ageMin', ''),
    ageMax: get(initialFilters, 'ageMax', ''),
    sex: get(initialFilters, 'sex', []),
    race: get(initialFilters, 'race', []),
    ethnicity: get(initialFilters, 'ethnicity', []),
    
    // Clinical
    conditions: get(initialFilters, 'conditions', []),
    encounterTypes: get(initialFilters, 'encounterTypes', []),
    
    // Temporal
    periodStart: get(initialFilters, 'periodStart', moment().subtract(1, 'year').format('YYYY-MM-DD')),
    periodEnd: get(initialFilters, 'periodEnd', moment().format('YYYY-MM-DD')),
    
    // Provider/Organization
    practitioners: get(initialFilters, 'practitioners', []),
    organizations: get(initialFilters, 'organizations', []),
    
    // Measure Performance
    measureStatus: get(initialFilters, 'measureStatus', []), // met, not-met, excluded, exception
    populationCriteria: get(initialFilters, 'populationCriteria', []),
    
    // Advanced
    hasActiveProblems: get(initialFilters, 'hasActiveProblems', false),
    hasRecentEncounters: get(initialFilters, 'hasRecentEncounters', false)
  });

  const [savedFilters, setSavedFilters] = useState([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  // Load saved filters
  useEffect(() => {
    Meteor.call('qualityMeasures.getSavedFilters', (error, result) => {
      if (!error && result) {
        setSavedFilters(result);
      }
    });
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFilterToggle = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleAgeRangeSelect = (range) => {
    setFilters(prev => ({
      ...prev,
      ageMin: range.min.toString(),
      ageMax: range.max === 120 ? '' : range.max.toString()
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      ageMin: '',
      ageMax: '',
      sex: [],
      race: [],
      ethnicity: [],
      conditions: [],
      encounterTypes: [],
      periodStart: moment().subtract(1, 'year').format('YYYY-MM-DD'),
      periodEnd: moment().format('YYYY-MM-DD'),
      practitioners: [],
      organizations: [],
      measureStatus: [],
      populationCriteria: [],
      hasActiveProblems: false,
      hasRecentEncounters: false
    });
  };

  const saveCurrentFilters = () => {
    if (!filterName.trim()) return;
    
    Meteor.call('qualityMeasures.saveFilterSet', {
      name: filterName,
      filters: filters,
      createdAt: new Date()
    }, (error, result) => {
      if (!error) {
        setSavedFilters(prev => [...prev, result]);
        setSaveDialogOpen(false);
        setFilterName('');
      }
    });
  };

  const loadSavedFilter = (savedFilter) => {
    setFilters(savedFilter.filters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.ageMin || filters.ageMax) count++;
    if (filters.sex.length > 0) count++;
    if (filters.race.length > 0) count++;
    if (filters.ethnicity.length > 0) count++;
    if (filters.conditions.length > 0) count++;
    if (filters.encounterTypes.length > 0) count++;
    if (filters.practitioners.length > 0) count++;
    if (filters.organizations.length > 0) count++;
    if (filters.measureStatus.length > 0) count++;
    if (filters.populationCriteria.length > 0) count++;
    if (filters.hasActiveProblems) count++;
    if (filters.hasRecentEncounters) count++;
    return count;
  };

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon />
              <Typography variant="h6">
                Clinical Quality Measures Filter
              </Typography>
              <Chip 
                label={`${getActiveFilterCount()} active`} 
                size="small" 
                color={getActiveFilterCount() > 0 ? "primary" : "default"}
              />
            </Box>
          }
          subheader="ONC 170.315(c)(4) - Filter CQMs by demographics, clinical criteria, and performance"
          action={
            <Stack direction="row" spacing={1}>
              <Tooltip title="Save Filter Set">
                <IconButton onClick={() => setSaveDialogOpen(true)}>
                  <SaveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear All Filters">
                <IconButton onClick={clearAllFilters}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            
            {/* Demographics Filters */}
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    Demographics
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    
                    {/* Age Range */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Age Range</Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        {AGE_RANGES.slice(0, 4).map(range => (
                          <Chip
                            key={range.label}
                            label={range.label}
                            onClick={() => handleAgeRangeSelect(range)}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          label="Min Age"
                          type="number"
                          size="small"
                          value={filters.ageMin}
                          onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                          sx={{ width: 100 }}
                        />
                        <TextField
                          label="Max Age"
                          type="number"
                          size="small"
                          value={filters.ageMax}
                          onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                          sx={{ width: 100 }}
                        />
                      </Stack>
                    </Grid>

                    {/* Patient Sex (SNOMED CT 2025 compliance) */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Patient Sex (SNOMED CT®)
                      </Typography>
                      <FormGroup>
                        {PATIENT_SEX_CODES.map(sexCode => (
                          <FormControlLabel
                            key={sexCode.code}
                            control={
                              <Checkbox
                                checked={filters.sex.includes(sexCode.code)}
                                onChange={() => handleArrayFilterToggle('sex', sexCode.code)}
                                size="small"
                              />
                            }
                            label={sexCode.display}
                          />
                        ))}
                      </FormGroup>
                    </Grid>

                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Clinical Filters */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ConditionIcon />
                    Clinical Criteria
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    
                    {/* Clinical Conditions */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Clinical Conditions (SNOMED CT®)
                      </Typography>
                      <FormGroup>
                        {COMMON_CONDITIONS.map(condition => (
                          <FormControlLabel
                            key={condition.code}
                            control={
                              <Checkbox
                                checked={filters.conditions.includes(condition.code)}
                                onChange={() => handleArrayFilterToggle('conditions', condition.code)}
                                size="small"
                              />
                            }
                            label={condition.display}
                          />
                        ))}
                      </FormGroup>
                    </Grid>

                    {/* Encounter Types */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Encounter Types</Typography>
                      <FormGroup>
                        {['office-visit', 'emergency', 'inpatient', 'telehealth', 'home-visit'].map(type => (
                          <FormControlLabel
                            key={type}
                            control={
                              <Checkbox
                                checked={filters.encounterTypes.includes(type)}
                                onChange={() => handleArrayFilterToggle('encounterTypes', type)}
                                size="small"
                              />
                            }
                            label={type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          />
                        ))}
                      </FormGroup>
                    </Grid>

                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Temporal Filters */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DateIcon />
                    Reporting Period
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Period Start"
                        type="date"
                        value={filters.periodStart}
                        onChange={(e) => handleFilterChange('periodStart', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Period End"
                        type="date"
                        value={filters.periodEnd}
                        onChange={(e) => handleFilterChange('periodEnd', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Measure Performance Filters */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PopulationIcon />
                    Measure Performance
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    
                    {/* Measure Status */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Performance Status</Typography>
                      <FormGroup>
                        {[
                          { value: 'met', label: 'Measure Met', icon: <CheckIcon color="success" /> },
                          { value: 'not-met', label: 'Measure Not Met', icon: <CancelIcon color="error" /> },
                          { value: 'excluded', label: 'Excluded', icon: <CancelIcon color="disabled" /> },
                          { value: 'exception', label: 'Exception', icon: <SettingsIcon color="warning" /> }
                        ].map(status => (
                          <FormControlLabel
                            key={status.value}
                            control={
                              <Checkbox
                                checked={filters.measureStatus.includes(status.value)}
                                onChange={() => handleArrayFilterToggle('measureStatus', status.value)}
                                size="small"
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {status.icon}
                                {status.label}
                              </Box>
                            }
                          />
                        ))}
                      </FormGroup>
                    </Grid>

                    {/* Population Criteria */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Population Criteria</Typography>
                      <FormGroup>
                        {['initial-population', 'denominator', 'numerator', 'denominator-exclusion', 'denominator-exception'].map(criteria => (
                          <FormControlLabel
                            key={criteria}
                            control={
                              <Checkbox
                                checked={filters.populationCriteria.includes(criteria)}
                                onChange={() => handleArrayFilterToggle('populationCriteria', criteria)}
                                size="small"
                              />
                            }
                            label={criteria.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          />
                        ))}
                      </FormGroup>
                    </Grid>

                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Saved Filter Sets</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {savedFilters.map((saved, index) => (
                    <Chip
                      key={index}
                      label={saved.name}
                      onClick={() => loadSavedFilter(saved)}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Stack>
              </Grid>
            )}

          </Grid>
        </CardContent>
      </Card>

      {/* Save Filter Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Filter Set</DialogTitle>
        <DialogContent>
          <TextField
            label="Filter Set Name"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="e.g., Diabetes Patients 2024"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveCurrentFilters} disabled={!filterName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CQMFilterPanel;