// /packages/synthea/client/SyntheaConfigurationPage.jsx
import React, { useState, useCallback } from 'react';
import { 
  Container, 
  Card, 
  CardContent, 
  CardHeader,
  Typography, 
  Button, 
  TextField, 
  Switch, 
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  Tabs,
  Tab,
  Grid,
  Chip,
  Tooltip,
  IconButton,
  Alert,
  Snackbar,
  Divider,
  InputAdornment,
  Fade,
  LinearProgress
} from '@mui/material';

import { 
  ContentCopy, 
  PlayArrow, 
  Settings,
  People,
  LocalHospital,
  AttachMoney,
  Folder,
  Info,
  CheckCircle,
  Download,
  Code,
  Storage
} from '@mui/icons-material';

import { useTheme } from '@mui/material/styles';
import { get } from 'lodash';
import { useTracker } from 'meteor/react-meteor-data';
import { SYNTHEA_DEFAULTS, isDifferentFromDefault } from './syntheaDefaults';
import { generatePropertiesFile } from './generatePropertiesFile';
import ObjectIdConversionModal from './ObjectIdConversionModal';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`synthea-tabpanel-${index}`}
      aria-labelledby={`synthea-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function SyntheaConfigurationPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [commandGenerated, setCommandGenerated] = useState(false);
  const [showObjectIdModal, setShowObjectIdModal] = useState(false);
  
  // Check if database utilities are enabled
  const dbUtilsEnabled = useTracker(() => {
    return get(Meteor, 'settings.public.enableSyntheaDbUtils', false);
  });
  
  // Configuration state
  const [config, setConfig] = useState({
    // Basic generation settings
    populationSize: 10,
    seed: '',
    state: '',
    city: '',
    gender: 'all',
    ageRange: [0, 100],
    
    // Population settings
    onlyAlivePatients: false,
    onlyDeadPatients: false,
    yearsOfHistory: 10,
    appendNumbersToNames: true,
    veteranPopulationOverride: false,
    
    // Export settings - Main formats
    exportFormat: 'fhir',
    outputDirectory: './output/',
    usCoreVersion: '5.0.1',
    fhirExportMode: 'bulk',  // 'bulk' for NDJSON, 'bundle' for JSON bundles
    
    // Export settings - Additional formats
    exportCCDA: false,
    exportCSV: false,
    exportText: false,
    exportClinicalNote: false,
    exportSymptoms: false,
    exportJSON: false,
    
    // Export settings - File handling
    useUUIDFilenames: false,
    prettyPrint: true,
    splitRecords: false,
    metadataExport: true,
    
    // Export settings - CSV specific
    csvAppendMode: false,
    csvFolderPerRun: false,
    
    // Export settings - Practitioner/Hospital
    exportPractitionerFHIR: true,
    exportHospitalFHIR: true,
    
    // Demographics
    includeMiddleNames: true,
    middleNameProbability: 80,
    
    // Clinical settings
    clinicianPoolSize: 50,
    providerSelection: 'nearest',
    maxSearchDistance: 1000,
    defaultToHospitalOnFailure: true,
    minimumProviders: 1,
    
    // Insurance settings
    insuranceMandateYear: 2006,
    employerCoverage: 83,
    payerSelectionBehavior: 'priority',
    incomeBasedPremiumRatio: 3.4,
    
    // Cost calculation
    costMethod: 'exponential',
    defaultProcedureCost: 500,
    defaultMedicationCost: 255,
    defaultEncounterCost: 125,
    defaultImmunizationCost: 136,
    defaultLabCost: 100,
    
    // Socioeconomic weights
    socioeconomicWeightIncome: 20,
    socioeconomicWeightEducation: 70,
    socioeconomicWeightOccupation: 10,
    
    // Lifecycle settings
    deathByNaturalCauses: false,
    deathByLossOfCare: false,
    
    // Advanced settings
    logPatientDetail: 'simple',
    trackDetailedTransitions: false,
    maxAttemptsToKeepPatient: 1000,
    
    // Performance
    threadPoolSize: -1
  });

  const handleConfigChange = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setCommandGenerated(false);
  }, []);

  const generateCommand = useCallback(() => {
    let command = 'run_synthea';
    
    // Add population size
    command += ` -p ${config.populationSize}`;
    
    // Add seed if specified
    if (config.seed) {
      command += ` -s ${config.seed}`;
    }
    
    // Add location filters
    if (config.state) {
      command += ` ${config.state}`;
      if (config.city) {
        command += ` ${config.city}`;
      }
    }
    
    // Add gender filter
    if (config.gender !== 'all') {
      command += ` -g ${config.gender}`;
    }
    
    // Add age range
    if (config.ageRange[0] > 0 || config.ageRange[1] < 100) {
      command += ` -a ${config.ageRange[0]}-${config.ageRange[1]}`;
    }
    
    // Add configuration overrides only when different from defaults
    const configOverrides = [];
    
    // Population generation settings
    if (isDifferentFromDefault('generate.only_alive_patients', config.onlyAlivePatients) && config.onlyAlivePatients) {
      configOverrides.push('generate.only_alive_patients=true');
    }
    if (isDifferentFromDefault('generate.only_dead_patients', config.onlyDeadPatients) && config.onlyDeadPatients) {
      configOverrides.push('generate.only_dead_patients=true');
    }
    if (isDifferentFromDefault('generate.append_numbers_to_person_names', config.appendNumbersToNames)) {
      configOverrides.push(`generate.append_numbers_to_person_names=${config.appendNumbersToNames}`);
    }
    if (isDifferentFromDefault('generate.veteran_population_override', config.veteranPopulationOverride) && config.veteranPopulationOverride) {
      configOverrides.push('generate.veteran_population_override=true');
    }
    
    // Check numeric values
    if (isDifferentFromDefault('exporter.years_of_history', config.yearsOfHistory)) {
      configOverrides.push(`exporter.years_of_history=${config.yearsOfHistory}`);
    }
    if (isDifferentFromDefault('exporter.baseDirectory', config.outputDirectory)) {
      configOverrides.push(`exporter.baseDirectory=${config.outputDirectory}`);
    }
    if (isDifferentFromDefault('generate.thread_pool_size', config.threadPoolSize)) {
      configOverrides.push(`generate.thread_pool_size=${config.threadPoolSize}`);
    }
    
    // Add export format configurations
    if (config.exportFormat === 'fhir') {
      // FHIR export is true by default, so we don't need to specify it
      if (isDifferentFromDefault('exporter.fhir.us_core_version', config.usCoreVersion)) {
        configOverrides.push(`exporter.fhir.us_core_version=${config.usCoreVersion}`);
      }
      // Handle bulk data mode explicitly - don't add anything for bundle mode
      // The bulk data flag will be added separately as a direct command line flag
    } else {
      // If not FHIR, we need to disable FHIR and enable the other format
      configOverrides.push('exporter.fhir.export=false');
      configOverrides.push(`exporter.${config.exportFormat}.export=true`);
    }
    
    // Additional export formats
    if (isDifferentFromDefault('exporter.ccda.export', config.exportCCDA) && config.exportCCDA) {
      configOverrides.push('exporter.ccda.export=true');
    }
    if (isDifferentFromDefault('exporter.csv.export', config.exportCSV) && config.exportCSV) {
      configOverrides.push('exporter.csv.export=true');
    }
    if (isDifferentFromDefault('exporter.text.export', config.exportText) && config.exportText) {
      configOverrides.push('exporter.text.export=true');
    }
    if (isDifferentFromDefault('exporter.json.export', config.exportJSON) && config.exportJSON) {
      configOverrides.push('exporter.json.export=true');
    }
    if (isDifferentFromDefault('exporter.clinical_note.export', config.exportClinicalNote) && config.exportClinicalNote) {
      configOverrides.push('exporter.clinical_note.export=true');
    }
    if (isDifferentFromDefault('exporter.symptoms.csv.export', config.exportSymptoms) && config.exportSymptoms) {
      configOverrides.push('exporter.symptoms.csv.export=true');
    }
    
    // File handling options
    if (isDifferentFromDefault('exporter.use_uuid_filenames', config.useUUIDFilenames) && config.useUUIDFilenames) {
      configOverrides.push('exporter.use_uuid_filenames=true');
    }
    if (isDifferentFromDefault('exporter.pretty_print', config.prettyPrint)) {
      configOverrides.push(`exporter.pretty_print=${config.prettyPrint}`);
    }
    if (isDifferentFromDefault('exporter.split_records', config.splitRecords) && config.splitRecords) {
      configOverrides.push('exporter.split_records=true');
    }
    if (isDifferentFromDefault('exporter.metadata.export', config.metadataExport)) {
      configOverrides.push(`exporter.metadata.export=${config.metadataExport}`);
    }
    
    // CSV specific options
    if (config.exportCSV) {
      if (isDifferentFromDefault('exporter.csv.append_mode', config.csvAppendMode) && config.csvAppendMode) {
        configOverrides.push('exporter.csv.append_mode=true');
      }
      if (isDifferentFromDefault('exporter.csv.folder_per_run', config.csvFolderPerRun) && config.csvFolderPerRun) {
        configOverrides.push('exporter.csv.folder_per_run=true');
      }
    }
    
    // Practitioner and hospital export
    if (isDifferentFromDefault('exporter.practitioner.fhir.export', config.exportPractitionerFHIR)) {
      configOverrides.push(`exporter.practitioner.fhir.export=${config.exportPractitionerFHIR}`);
    }
    if (isDifferentFromDefault('exporter.hospital.fhir.export', config.exportHospitalFHIR)) {
      configOverrides.push(`exporter.hospital.fhir.export=${config.exportHospitalFHIR}`);
    }
    
    // Add demographics settings
    const middleNameValue = config.includeMiddleNames ? config.middleNameProbability / 100 : 0;
    if (isDifferentFromDefault('generate.middle_names', middleNameValue)) {
      configOverrides.push(`generate.middle_names=${middleNameValue}`);
    }
    
    // Add clinical settings
    if (isDifferentFromDefault('generate.providers.selection_behavior', config.providerSelection)) {
      configOverrides.push(`generate.providers.selection_behavior=${config.providerSelection}`);
    }
    if (isDifferentFromDefault('generate.providers.maximum_search_distance', config.maxSearchDistance)) {
      configOverrides.push(`generate.providers.maximum_search_distance=${config.maxSearchDistance}`);
    }
    
    // Add insurance settings
    if (isDifferentFromDefault('generate.insurance.mandate.year', config.insuranceMandateYear)) {
      configOverrides.push(`generate.insurance.mandate.year=${config.insuranceMandateYear}`);
    }
    const employerCoverageDecimal = config.employerCoverage / 100;
    if (isDifferentFromDefault('generate.insurance.employer_coverage', employerCoverageDecimal)) {
      configOverrides.push(`generate.insurance.employer_coverage=${employerCoverageDecimal}`);
    }
    
    // Add cost method and default costs
    if (isDifferentFromDefault('generate.costs.method', config.costMethod)) {
      configOverrides.push(`generate.costs.method=${config.costMethod}`);
    }
    if (isDifferentFromDefault('generate.costs.default_procedure_cost', config.defaultProcedureCost)) {
      configOverrides.push(`generate.costs.default_procedure_cost=${config.defaultProcedureCost}`);
    }
    if (isDifferentFromDefault('generate.costs.default_medication_cost', config.defaultMedicationCost)) {
      configOverrides.push(`generate.costs.default_medication_cost=${config.defaultMedicationCost}`);
    }
    if (isDifferentFromDefault('generate.costs.default_encounter_cost', config.defaultEncounterCost)) {
      configOverrides.push(`generate.costs.default_encounter_cost=${config.defaultEncounterCost}`);
    }
    if (isDifferentFromDefault('generate.costs.default_immunization_cost', config.defaultImmunizationCost)) {
      configOverrides.push(`generate.costs.default_immunization_cost=${config.defaultImmunizationCost}`);
    }
    if (isDifferentFromDefault('generate.costs.default_lab_cost', config.defaultLabCost)) {
      configOverrides.push(`generate.costs.default_lab_cost=${config.defaultLabCost}`);
    }
    
    // Provider settings
    if (isDifferentFromDefault('generate.providers.default_to_hospital_on_failure', config.defaultToHospitalOnFailure)) {
      configOverrides.push(`generate.providers.default_to_hospital_on_failure=${config.defaultToHospitalOnFailure}`);
    }
    if (isDifferentFromDefault('generate.providers.minimum', config.minimumProviders)) {
      configOverrides.push(`generate.providers.minimum=${config.minimumProviders}`);
    }
    
    // Payer settings
    if (isDifferentFromDefault('generate.payers.selection_behavior', config.payerSelectionBehavior)) {
      configOverrides.push(`generate.payers.selection_behavior=${config.payerSelectionBehavior}`);
    }
    const incomePremiumRatio = config.incomeBasedPremiumRatio / 100;
    if (isDifferentFromDefault('generate.payers.insurance_plans.income_premium_ratio', incomePremiumRatio)) {
      configOverrides.push(`generate.payers.insurance_plans.income_premium_ratio=${incomePremiumRatio}`);
    }
    
    // Socioeconomic weights
    const incomeWeight = config.socioeconomicWeightIncome / 100;
    const educationWeight = config.socioeconomicWeightEducation / 100;
    const occupationWeight = config.socioeconomicWeightOccupation / 100;
    if (isDifferentFromDefault('generate.demographics.socioeconomic.weights.income', incomeWeight)) {
      configOverrides.push(`generate.demographics.socioeconomic.weights.income=${incomeWeight}`);
    }
    if (isDifferentFromDefault('generate.demographics.socioeconomic.weights.education', educationWeight)) {
      configOverrides.push(`generate.demographics.socioeconomic.weights.education=${educationWeight}`);
    }
    if (isDifferentFromDefault('generate.demographics.socioeconomic.weights.occupation', occupationWeight)) {
      configOverrides.push(`generate.demographics.socioeconomic.weights.occupation=${occupationWeight}`);
    }
    
    // Lifecycle settings
    if (isDifferentFromDefault('lifecycle.death_by_natural_causes', config.deathByNaturalCauses) && config.deathByNaturalCauses) {
      configOverrides.push('lifecycle.death_by_natural_causes=true');
    }
    if (isDifferentFromDefault('lifecycle.death_by_loss_of_care', config.deathByLossOfCare) && config.deathByLossOfCare) {
      configOverrides.push('lifecycle.death_by_loss_of_care=true');
    }
    
    // Logging and debugging
    if (isDifferentFromDefault('generate.log_patients.detail', config.logPatientDetail)) {
      configOverrides.push(`generate.log_patients.detail=${config.logPatientDetail}`);
    }
    if (isDifferentFromDefault('generate.track_detailed_transition_metrics', config.trackDetailedTransitions) && config.trackDetailedTransitions) {
      configOverrides.push('generate.track_detailed_transition_metrics=true');
    }
    if (isDifferentFromDefault('generate.max_attempts_to_keep_patient', config.maxAttemptsToKeepPatient)) {
      configOverrides.push(`generate.max_attempts_to_keep_patient=${config.maxAttemptsToKeepPatient}`);
    }
    
    // Add bulk data flag directly if in bulk mode
    if (config.exportFormat === 'fhir' && config.fhirExportMode === 'bulk') {
      command += ` --exporter.fhir.bulk_data=true`;
    }
    
    // Append all config overrides as direct flags
    configOverrides.forEach(override => {
      command += ` --${override}`;
    });
    
    return command;
  }, [config]);

  const copyToClipboard = useCallback(() => {
    const command = generateCommand();
    navigator.clipboard.writeText(command).then(() => {
      setSnackbarMessage('Command copied to clipboard!');
      setShowSnackbar(true);
    });
  }, [generateCommand]);

  const exportConfiguration = useCallback(() => {
    const propertiesContent = generatePropertiesFile(config);
    const blob = new Blob([propertiesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synthea.properties';
    a.click();
    URL.revokeObjectURL(url);
    
    setSnackbarMessage('synthea.properties file exported!');
    setShowSnackbar(true);
  }, [config]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Fade in timeout={500}>
        <Paper 
          elevation={0} 
          sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
            p: 4,
            mb: 4,
            borderRadius: 3
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                Synthea Configuration
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Generate synthetic patient data with a user-friendly interface
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: theme.palette.mode === 'dark' ? 'black' : 'white',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflowX: 'auto',
                  border: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {commandGenerated ? (
                  <>
                    <Typography component="pre" sx={{ margin: 0, pr: 5 }}>
                      {generateCommand()}
                    </Typography>
                    <Box sx={{ 
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Chip 
                        icon={<CheckCircle />} 
                        label="Ready" 
                        color="success" 
                        size="small" 
                      />
                      <IconButton
                        size="small"
                        onClick={copyToClipboard}
                        sx={{ 
                          backgroundColor: theme.palette.background.paper
                        }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                  </>
                ) : (
                  <Typography color="text.secondary">
                    Click "Generate Command" to see your Synthea command
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => {
                    setCommandGenerated(true);
                  }}
                >
                  Generate Command
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={exportConfiguration}
                >
                  Export Config
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Info />}
                  href="https://github.com/synthetichealth/synthea/wiki"
                  target="_blank"
                >
                  Synthea Documentation
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Info />}
                  href="https://www.mongodb.com/docs/compass/install/"
                  target="_blank"
                >
                  Mongo Compass Docs
                </Button>
                {dbUtilsEnabled && (
                  <Button
                    variant="outlined"
                    startIcon={<Storage />}
                    onClick={() => setShowObjectIdModal(true)}
                    color="secondary"
                  >
                    Convert ObjectIDs
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<People />} label="Population" />
              <Tab icon={<LocalHospital />} label="Clinical" />
              <Tab icon={<AttachMoney />} label="Insurance & Costs" />
              <Tab icon={<Folder />} label="Export" />
              <Tab icon={<Settings />} label="Advanced" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  Basic Generation Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Population Size"
                          type="number"
                          value={config.populationSize}
                          onChange={(e) => handleConfigChange('populationSize', parseInt(e.target.value) || 1)}
                          InputProps={{
                            inputProps: { min: 1 },
                            endAdornment: (
                              <Tooltip title="Number of patients to generate">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Random Seed (Optional)"
                          value={config.seed}
                          onChange={(e) => handleConfigChange('seed', e.target.value)}
                          placeholder="e.g., 12345"
                          InputProps={{
                            endAdornment: (
                              <Tooltip title="Use a seed for reproducible results">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Gender Filter</InputLabel>
                          <Select
                            value={config.gender}
                            onChange={(e) => handleConfigChange('gender', e.target.value)}
                            label="Gender Filter"
                          >
                            <MenuItem value="all">All Genders</MenuItem>
                            <MenuItem value="M">Male Only</MenuItem>
                            <MenuItem value="F">Female Only</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography gutterBottom>Age Range: {config.ageRange[0]} - {config.ageRange[1]} years</Typography>
                          <Slider
                            value={config.ageRange}
                            onChange={(e, newValue) => handleConfigChange('ageRange', newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={100}
                            marks={[
                              { value: 0, label: '0' },
                              { value: 25, label: '25' },
                              { value: 50, label: '50' },
                              { value: 75, label: '75' },
                              { value: 100, label: '100' }
                            ]}
                          />
                        </Box>
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Location Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="State (Optional)"
                          value={config.state}
                          onChange={(e) => handleConfigChange('state', e.target.value)}
                          placeholder="e.g., Massachusetts"
                          InputProps={{
                            endAdornment: (
                              <Tooltip title="Filter by state">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="City (Optional)"
                          value={config.city}
                          onChange={(e) => handleConfigChange('city', e.target.value)}
                          placeholder="e.g., Boston"
                          disabled={!config.state}
                          InputProps={{
                            endAdornment: (
                              <Tooltip title="Filter by city (requires state)">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Patient Status
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.onlyAlivePatients}
                              onChange={(e) => {
                                handleConfigChange('onlyAlivePatients', e.target.checked);
                                if (e.target.checked) {
                                  handleConfigChange('onlyDeadPatients', false);
                                }
                              }}
                            />
                          }
                          label="Only Living Patients"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.onlyDeadPatients}
                              onChange={(e) => {
                                handleConfigChange('onlyDeadPatients', e.target.checked);
                                if (e.target.checked) {
                                  handleConfigChange('onlyAlivePatients', false);
                                }
                              }}
                            />
                          }
                          label="Only Deceased Patients"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Years of History"
                          type="number"
                          value={config.yearsOfHistory}
                          onChange={(e) => handleConfigChange('yearsOfHistory', parseInt(e.target.value) || 1)}
                          InputProps={{
                            inputProps: { min: 1, max: 100 }
                          }}
                        />
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Additional Demographics Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.appendNumbersToNames}
                              onChange={(e) => handleConfigChange('appendNumbersToNames', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography>Append Numbers to Names</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Make names more obviously synthetic
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.veteranPopulationOverride}
                              onChange={(e) => handleConfigChange('veteranPopulationOverride', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography>Veteran Population Override</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Use veteran prevalence data for entire population
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  Provider Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Clinician Pool Size"
                          type="number"
                          value={config.clinicianPoolSize}
                          onChange={(e) => handleConfigChange('clinicianPoolSize', parseInt(e.target.value) || 1)}
                          InputProps={{
                            inputProps: { min: 1 },
                            endAdornment: (
                              <Tooltip title="Number of clinicians in the simulation">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel>Provider Selection</InputLabel>
                          <Select
                            value={config.providerSelection}
                            onChange={(e) => handleConfigChange('providerSelection', e.target.value)}
                            label="Provider Selection"
                          >
                            <MenuItem value="nearest">Nearest Provider</MenuItem>
                            <MenuItem value="random">Random Provider</MenuItem>
                            <MenuItem value="network">In-Network Only</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Max Search Distance (km)"
                          type="number"
                          value={config.maxSearchDistance}
                          onChange={(e) => handleConfigChange('maxSearchDistance', parseInt(e.target.value) || 100)}
                          InputProps={{
                            inputProps: { min: 1 },
                            endAdornment: (
                              <Tooltip title="Maximum distance to search for providers">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Demographics Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.includeMiddleNames}
                              onChange={(e) => handleConfigChange('includeMiddleNames', e.target.checked)}
                            />
                          }
                          label="Include Middle Names"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography gutterBottom>
                            Middle Name Probability: {config.middleNameProbability}%
                          </Typography>
                          <Slider
                            value={config.middleNameProbability}
                            onChange={(e, newValue) => handleConfigChange('middleNameProbability', newValue)}
                            valueLabelDisplay="auto"
                            disabled={!config.includeMiddleNames}
                            min={0}
                            max={100}
                            step={10}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.defaultToHospitalOnFailure}
                              onChange={(e) => handleConfigChange('defaultToHospitalOnFailure', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography>Default to Hospital on Failure</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Use nearest hospital if specific provider not found
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Minimum Providers per Patient"
                          type="number"
                          value={config.minimumProviders}
                          onChange={(e) => handleConfigChange('minimumProviders', parseInt(e.target.value) || 1)}
                          InputProps={{
                            inputProps: { min: 1 },
                            endAdornment: (
                              <Tooltip title="Re-runs simulation if minimum not met">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Lifecycle Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.deathByNaturalCauses}
                              onChange={(e) => handleConfigChange('deathByNaturalCauses', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography>Death by Natural Causes</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Enable randomized natural death
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.deathByLossOfCare}
                              onChange={(e) => handleConfigChange('deathByLossOfCare', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography>Death by Loss of Care</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Enable death due to unaffordable care
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  Insurance Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Insurance Mandate Year"
                          type="number"
                          value={config.insuranceMandateYear}
                          onChange={(e) => handleConfigChange('insuranceMandateYear', parseInt(e.target.value) || 2006)}
                          InputProps={{
                            inputProps: { min: 1900, max: new Date().getFullYear() },
                            endAdornment: (
                              <Tooltip title="Year when insurance became mandatory">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography gutterBottom>
                            Employer Coverage: {config.employerCoverage}%
                          </Typography>
                          <Slider
                            value={config.employerCoverage}
                            onChange={(e, newValue) => handleConfigChange('employerCoverage', newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={100}
                            step={5}
                            marks={[
                              { value: 0, label: '0%' },
                              { value: 50, label: '50%' },
                              { value: 100, label: '100%' }
                            ]}
                          />
                        </Box>
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Cost Calculation
                </Typography>
                <Divider sx={{ mb: 3 }} />
                    <FormControl fullWidth>
                      <InputLabel>Cost Calculation Method</InputLabel>
                      <Select
                        value={config.costMethod}
                        onChange={(e) => handleConfigChange('costMethod', e.target.value)}
                        label="Cost Calculation Method"
                      >
                        <MenuItem value="exponential">Exponential (Realistic)</MenuItem>
                        <MenuItem value="linear">Linear (Simple)</MenuItem>
                        <MenuItem value="fixed">Fixed (Testing)</MenuItem>
                      </Select>
                    </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Payer Selection
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Payer Selection Behavior</InputLabel>
                          <Select
                            value={config.payerSelectionBehavior}
                            onChange={(e) => handleConfigChange('payerSelectionBehavior', e.target.value)}
                            label="Payer Selection Behavior"
                          >
                            <MenuItem value="priority">Priority Based</MenuItem>
                            <MenuItem value="best_rates">Best Rates</MenuItem>
                            <MenuItem value="random">Random</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography gutterBottom>
                            Income-Based Premium Ratio: {config.incomeBasedPremiumRatio}%
                          </Typography>
                          <Slider
                            value={config.incomeBasedPremiumRatio}
                            onChange={(e, newValue) => handleConfigChange('incomeBasedPremiumRatio', newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={10}
                            step={0.1}
                            marks={[
                              { value: 0, label: '0%' },
                              { value: 5, label: '5%' },
                              { value: 10, label: '10%' }
                            ]}
                          />
                        </Box>
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Default Costs
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Default Procedure Cost"
                          type="number"
                          value={config.defaultProcedureCost}
                          onChange={(e) => handleConfigChange('defaultProcedureCost', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: '$',
                            inputProps: { min: 0, step: 0.01 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Default Medication Cost"
                          type="number"
                          value={config.defaultMedicationCost}
                          onChange={(e) => handleConfigChange('defaultMedicationCost', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: '$',
                            inputProps: { min: 0, step: 0.01 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Default Encounter Cost"
                          type="number"
                          value={config.defaultEncounterCost}
                          onChange={(e) => handleConfigChange('defaultEncounterCost', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: '$',
                            inputProps: { min: 0, step: 0.01 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Default Immunization Cost"
                          type="number"
                          value={config.defaultImmunizationCost}
                          onChange={(e) => handleConfigChange('defaultImmunizationCost', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: '$',
                            inputProps: { min: 0, step: 0.01 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Default Lab Cost"
                          type="number"
                          value={config.defaultLabCost}
                          onChange={(e) => handleConfigChange('defaultLabCost', parseFloat(e.target.value) || 0)}
                          InputProps={{
                            startAdornment: '$',
                            inputProps: { min: 0, step: 0.01 }
                          }}
                        />
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Socioeconomic Weights
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          These weights should total 100%
                        </Alert>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography gutterBottom>Income Weight: {config.socioeconomicWeightIncome}%</Typography>
                          <Slider
                            value={config.socioeconomicWeightIncome}
                            onChange={(e, newValue) => handleConfigChange('socioeconomicWeightIncome', newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={100}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography gutterBottom>Education Weight: {config.socioeconomicWeightEducation}%</Typography>
                          <Slider
                            value={config.socioeconomicWeightEducation}
                            onChange={(e, newValue) => handleConfigChange('socioeconomicWeightEducation', newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={100}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography gutterBottom>Occupation Weight: {config.socioeconomicWeightOccupation}%</Typography>
                          <Slider
                            value={config.socioeconomicWeightOccupation}
                            onChange={(e, newValue) => handleConfigChange('socioeconomicWeightOccupation', newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={100}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color={
                          (config.socioeconomicWeightIncome + config.socioeconomicWeightEducation + config.socioeconomicWeightOccupation) === 100
                            ? 'success.main'
                            : 'error.main'
                        }>
                          Total: {config.socioeconomicWeightIncome + config.socioeconomicWeightEducation + config.socioeconomicWeightOccupation}%
                        </Typography>
                      </Grid>
                    </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  Export Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Export Format</InputLabel>
                          <Select
                            value={config.exportFormat}
                            onChange={(e) => handleConfigChange('exportFormat', e.target.value)}
                            label="Export Format"
                          >
                            <MenuItem value="fhir">FHIR R4</MenuItem>
                            <MenuItem value="ccda">C-CDA</MenuItem>
                            <MenuItem value="csv">CSV</MenuItem>
                            <MenuItem value="text">Text</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Output Directory"
                          value={config.outputDirectory}
                          onChange={(e) => handleConfigChange('outputDirectory', e.target.value)}
                          InputProps={{
                            endAdornment: (
                              <Tooltip title="Where to save generated files">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                      {config.exportFormat === 'fhir' && (
                        <>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>US Core Version</InputLabel>
                              <Select
                                value={config.usCoreVersion}
                                onChange={(e) => handleConfigChange('usCoreVersion', e.target.value)}
                                label="US Core Version"
                              >
                                <MenuItem value="5.0.1">5.0.1 (Latest)</MenuItem>
                                <MenuItem value="4.0.0">4.0.0</MenuItem>
                                <MenuItem value="3.1.1">3.1.1</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>FHIR Export Mode</InputLabel>
                              <Select
                                value={config.fhirExportMode}
                                onChange={(e) => handleConfigChange('fhirExportMode', e.target.value)}
                                label="FHIR Export Mode"
                              >
                                <MenuItem value="bulk">
                                  <Box>
                                    <Typography>Bulk Data Format (NDJSON)</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Newline-delimited JSON files for large-scale processing
                                    </Typography>
                                  </Box>
                                </MenuItem>
                                <MenuItem value="bundle">
                                  <Box>
                                    <Typography>Bundle Format (JSON)</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Traditional FHIR bundles with transactions
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                        </>
                      )}
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Additional Export Formats
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.exportCCDA}
                              onChange={(e) => handleConfigChange('exportCCDA', e.target.checked)}
                            />
                          }
                          label="Export C-CDA"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.exportCSV}
                              onChange={(e) => handleConfigChange('exportCSV', e.target.checked)}
                            />
                          }
                          label="Export CSV"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.exportText}
                              onChange={(e) => handleConfigChange('exportText', e.target.checked)}
                            />
                          }
                          label="Export Text"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.exportJSON}
                              onChange={(e) => handleConfigChange('exportJSON', e.target.checked)}
                            />
                          }
                          label="Export JSON"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.exportClinicalNote}
                              onChange={(e) => handleConfigChange('exportClinicalNote', e.target.checked)}
                            />
                          }
                          label="Export Clinical Notes"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.exportSymptoms}
                              onChange={(e) => handleConfigChange('exportSymptoms', e.target.checked)}
                            />
                          }
                          label="Export Symptoms"
                        />
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  File Handling Options
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.useUUIDFilenames}
                              onChange={(e) => handleConfigChange('useUUIDFilenames', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography>Use UUID Filenames</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Generate filenames using UUIDs instead of patient names
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.prettyPrint}
                              onChange={(e) => handleConfigChange('prettyPrint', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography>Pretty Print</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Format JSON/XML with indentation
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.splitRecords}
                              onChange={(e) => handleConfigChange('splitRecords', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography>Split Records by Provider</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Create separate records for each provider organization
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.metadataExport}
                              onChange={(e) => handleConfigChange('metadataExport', e.target.checked)}
                            />
                          }
                          label="Export Metadata"
                        />
                      </Grid>
                    </Grid>
              </Grid>

              {config.exportCSV && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                    CSV Export Options
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={config.csvAppendMode}
                                onChange={(e) => handleConfigChange('csvAppendMode', e.target.checked)}
                              />
                            }
                            label={
                              <Box>
                                <Typography>Append Mode</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Add to existing CSV files instead of overwriting
                                </Typography>
                              </Box>
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={config.csvFolderPerRun}
                                onChange={(e) => handleConfigChange('csvFolderPerRun', e.target.checked)}
                              />
                            }
                            label={
                              <Box>
                                <Typography>Folder Per Run</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Create a new subfolder for each generation run
                                </Typography>
                              </Box>
                            }
                          />
                        </Grid>
                      </Grid>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  FHIR Resource Export Options
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.exportPractitionerFHIR}
                              onChange={(e) => handleConfigChange('exportPractitionerFHIR', e.target.checked)}
                            />
                          }
                          label="Export Practitioner Resources"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.exportHospitalFHIR}
                              onChange={(e) => handleConfigChange('exportHospitalFHIR', e.target.checked)}
                            />
                          }
                          label="Export Hospital/Organization Resources"
                        />
                      </Grid>
                    </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  Performance Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Thread Pool Size"
                          type="number"
                          value={config.threadPoolSize}
                          onChange={(e) => handleConfigChange('threadPoolSize', parseInt(e.target.value) || -1)}
                          InputProps={{
                            inputProps: { min: -1 },
                            endAdornment: (
                              <Tooltip title="-1 uses all available processors">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 4 }}>
                  Logging and Debugging
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Log Patient Detail</InputLabel>
                          <Select
                            value={config.logPatientDetail}
                            onChange={(e) => handleConfigChange('logPatientDetail', e.target.value)}
                            label="Log Patient Detail"
                          >
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="simple">Simple</MenuItem>
                            <MenuItem value="detailed">Detailed</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.trackDetailedTransitions}
                              onChange={(e) => handleConfigChange('trackDetailedTransitions', e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography>Track Detailed Transitions</Typography>
                              <Typography variant="caption" color="text.secondary">
                                May significantly slow processing
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Max Attempts to Keep Patient"
                          type="number"
                          value={config.maxAttemptsToKeepPatient}
                          onChange={(e) => handleConfigChange('maxAttemptsToKeepPatient', parseInt(e.target.value) || 0)}
                          InputProps={{
                            inputProps: { min: 0 },
                            endAdornment: (
                              <Tooltip title="0 = unlimited attempts">
                                <IconButton size="small">
                                  <Info fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity="success" 
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      <ObjectIdConversionModal 
        open={showObjectIdModal}
        onClose={() => setShowObjectIdModal(false)}
      />
    </Container>
  );
}