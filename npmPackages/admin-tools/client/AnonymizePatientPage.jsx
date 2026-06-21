// packages/admin-tools/client/AnonymizePatientPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Paper,
  Chip,
  Checkbox,
  FormControlLabel
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import PreviewIcon from '@mui/icons-material/Preview';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Safe Harbor category labels
const SAFE_HARBOR_CATEGORIES = {
  1: 'Names',
  2: 'Geographic data (< state)',
  3: 'Dates (except year)',
  4: 'Phone numbers',
  5: 'Fax numbers',
  6: 'Email addresses',
  7: 'Social Security numbers',
  8: 'Medical record numbers',
  9: 'Health plan beneficiary numbers',
  10: 'Account numbers',
  11: 'Certificate/license numbers',
  12: 'Vehicle identifiers',
  13: 'Device identifiers/serial numbers',
  14: 'Web URLs',
  15: 'IP addresses',
  16: 'Biometric identifiers',
  17: 'Full-face photographs',
  18: 'Any other unique identifying number'
};

// Get Honeycomb theme hook
let useAppTheme;
Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
});

function AnonymizePatientPage() {
  // Phase state: 'search' | 'preview' | 'results'
  const [phase, setPhase] = useState('search');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Selected patient state
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Dry-run / preview state
  const [previewData, setPreviewData] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  // Anonymization options
  const [skipPixelate, setSkipPixelate] = useState(false);

  // Anonymize state
  const [anonymizing, setAnonymizing] = useState(false);
  const [anonymizeResult, setAnonymizeResult] = useState(null);

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Auto-loading from URL param
  const [autoLoading, setAutoLoading] = useState(false);

  // Anonymization feature flag (null = loading, true/false = result)
  const [anonymizationEnabled, setAnonymizationEnabled] = useState(null);

  // Theme
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const warningBgColor = isDark ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.1)';

  // On mount, check if anonymization is enabled via server settings
  useEffect(function() {
    Meteor.call('adminTools.checkAnonymizationSetting', function(error, result) {
      if (error) {
        console.warn('[AnonymizePatientPage] Error checking anonymization setting:', error.reason);
        setAnonymizationEnabled(false);
      } else {
        setAnonymizationEnabled(get(result, 'allowPatientAnonymization', false));
      }
    });
  }, []);

  // On mount, check for ?patientId= URL param and auto-select
  useEffect(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientIdParam = urlParams.get('patientId');

    if (patientIdParam) {
      setAutoLoading(true);
      console.log('[AnonymizePatientPage] Auto-loading patient from URL param:', patientIdParam);

      Meteor.call('adminTools.anonymizePatient.search', patientIdParam, function(error, result) {
        setAutoLoading(false);
        if (error) {
          console.warn('[AnonymizePatientPage] Auto-load search error:', error.reason);
          showSnackbar('Patient not found: ' + patientIdParam, 'warning');
        } else if (result && result.length > 0) {
          const exactMatch = result.find(function(p) { return p._id === patientIdParam; });
          const patient = exactMatch || result[0];
          setSearchResults(result);
          setSelectedPatient(patient);
          setSearchTerm(patientIdParam);
          console.log('[AnonymizePatientPage] Auto-selected patient:', patient._id);
        } else {
          showSnackbar('Patient not found: ' + patientIdParam, 'warning');
        }
      });
    }
  }, []);

  function showSnackbar(message, severity) {
    setSnackbar({ open: true, message: message, severity: severity || 'info' });
  }

  function handleCloseSnackbar() {
    setSnackbar({ ...snackbar, open: false });
  }

  function handleSearch() {
    if (!searchTerm.trim()) return;

    setSearching(true);
    setSearchResults([]);

    Meteor.call('adminTools.anonymizePatient.search', searchTerm.trim(), function(error, result) {
      setSearching(false);
      if (error) {
        console.error('[AnonymizePatientPage] Search error:', error);
        showSnackbar('Search error: ' + error.reason, 'error');
      } else {
        setSearchResults(result || []);
        if (!result || result.length === 0) {
          showSnackbar('No patients found matching "' + searchTerm + '"', 'info');
        }
      }
    });
  }

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    setPreviewData(null);
  }

  function handlePreviewAnonymize() {
    if (!selectedPatient) return;

    setPreviewing(true);
    setPreviewData(null);

    Meteor.call('adminTools.anonymizePatient.dryRun', selectedPatient._id, function(error, result) {
      setPreviewing(false);
      if (error) {
        console.error('[AnonymizePatientPage] Dry-run error:', error);
        showSnackbar('Preview error: ' + error.reason, 'error');
      } else {
        setPreviewData(result);
        setPhase('preview');
      }
    });
  }

  function handleConfirmAnonymize() {
    setConfirmOpen(false);
    setAnonymizing(true);

    const options = {
      skipPixelate: skipPixelate
    };

    Meteor.call('adminTools.anonymizePatient.execute', selectedPatient._id, options, function(error, result) {
      setAnonymizing(false);
      if (error) {
        console.error('[AnonymizePatientPage] Anonymize error:', error);
        showSnackbar('Anonymization error: ' + error.reason, 'error');
      } else {
        setAnonymizeResult(result);
        setPhase('results');
        showSnackbar('Patient anonymized successfully', 'success');
      }
    });
  }

  function handleReset() {
    setPhase('search');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedPatient(null);
    setPreviewData(null);
    setAnonymizeResult(null);
    setSkipPixelate(false);
  }

  function getDisplayName(patient) {
    if (patient.fullName) return patient.fullName;
    const parts = [patient.givenName, patient.familyName].filter(Boolean);
    return parts.join(' ') || 'Unknown';
  }

  // Collect all unique Safe Harbor categories from PHI summary
  function getUniqueCategoriesFromSummary(phiSummary) {
    const categories = new Set();
    for (const resourceType of Object.keys(phiSummary)) {
      const fields = get(phiSummary, resourceType + '.fields', []);
      for (let i = 0; i < fields.length; i++) {
        const cats = fields[i].categories || [];
        for (let c = 0; c < cats.length; c++) {
          if (cats[c]) categories.add(cats[c]);
        }
      }
    }
    return Array.from(categories).sort(function(a, b) { return a - b; });
  }

  // Render a value for before/after preview (handles objects, arrays, undefined)
  function renderPreviewValue(value) {
    if (value === undefined || value === null) {
      return <Typography variant="body2" sx={{ color: isDark ? '#66bb6a' : '#2e7d32', fontStyle: 'italic' }}>removed</Typography>;
    }
    if (typeof value === 'string') {
      return <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{value || '(empty)'}</Typography>;
    }
    if (Array.isArray(value)) {
      return <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{JSON.stringify(value, null, 0)}</Typography>;
    }
    if (typeof value === 'object') {
      return <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{JSON.stringify(value, null, 0)}</Typography>;
    }
    return <Typography variant="body2">{String(value)}</Typography>;
  }

  // Shared card sx for MUI child theming
  const cardSx = {
    boxShadow: 3,
    bgcolor: cardBgColor,
    color: cardTextColor,
    '& .MuiTableCell-root': {
      color: cardTextColor,
      borderColor: borderColor
    },
    '& .MuiTextField-root': {
      '& .MuiInputLabel-root': { color: secondaryTextColor },
      '& .MuiInputBase-root': { color: cardTextColor },
      '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
      }
    },
    '& .MuiFormControlLabel-label': { color: cardTextColor },
    '& .MuiCheckbox-root': { color: secondaryTextColor }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Warning Banner */}
      <Alert
        severity="warning"
        sx={{
          mb: 3,
          bgcolor: warningBgColor,
          color: cardTextColor,
          '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' },
          '& .MuiAlertTitle-root': { color: cardTextColor }
        }}
      >
        <AlertTitle>HIPAA Safe Harbor De-Identification</AlertTitle>
        This tool removes Protected Health Information (PHI) from a patient and all linked resources using the HIPAA Safe Harbor method. This operation permanently modifies data in the database and cannot be undone. A FHIR AuditEvent will be recorded.
      </Alert>

      {/* Anonymization disabled warning */}
      {anonymizationEnabled === false && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
            color: cardTextColor,
            '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' },
            '& .MuiAlertTitle-root': { color: cardTextColor }
          }}
        >
          <AlertTitle>Patient Anonymization Disabled</AlertTitle>
          Patient anonymization is not enabled. Contact your administrator to enable it in the server settings (Meteor.settings.private.allowPatientAnonymization).
        </Alert>
      )}

      {/* Auto-loading indicator */}
      {autoLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, color: cardTextColor }}>Loading patient...</Typography>
        </Box>
      )}

      {/* ================================================================ */}
      {/* SEARCH PHASE */}
      {/* ================================================================ */}
      {phase === 'search' && !autoLoading && (
        <Card sx={cardSx}>
          <CardHeader
            title="Anonymize Patient"
            subheader="Search for a patient to de-identify"
            sx={{
              bgcolor: 'warning.main',
              '& .MuiCardHeader-title': { color: '#ffffff' },
              '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
            }}
            avatar={<SecurityIcon sx={{ color: '#ffffff' }} />}
          />
          <CardContent>
            {/* Search Input */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Search by name, MRN, or patient ID"
                variant="outlined"
                value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') handleSearch(); }}
                placeholder="e.g. Smith, MRN12345, or 5832e8a0..."
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={searching || !searchTerm.trim()}
                startIcon={searching ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ minWidth: 120 }}
              >
                Search
              </Button>
            </Box>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ color: secondaryTextColor, mb: 1 }}>
                  {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''} found
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>DOB</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Gender</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>MRN</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map(function(patient) {
                        const isSelected = selectedPatient && selectedPatient._id === patient._id;
                        return (
                          <TableRow
                            key={patient._id}
                            sx={{
                              '&:hover': { backgroundColor: hoverBgColor },
                              backgroundColor: isSelected ? (isDark ? 'rgba(237, 108, 2, 0.12)' : 'rgba(237, 108, 2, 0.06)') : 'transparent'
                            }}
                          >
                            <TableCell>{getDisplayName(patient)}</TableCell>
                            <TableCell>{patient.birthDate || '-'}</TableCell>
                            <TableCell>{patient.gender || '-'}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {patient.mrn || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant={isSelected ? 'contained' : 'outlined'}
                                color="warning"
                                onClick={function() { handleSelectPatient(patient); }}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Preview Anonymize Button */}
            {selectedPatient && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  onClick={handlePreviewAnonymize}
                  disabled={previewing || anonymizationEnabled === false}
                  startIcon={previewing ? <CircularProgress size={20} /> : <PreviewIcon />}
                >
                  {previewing ? 'Scanning PHI...' : 'Preview Anonymization for ' + getDisplayName(selectedPatient)}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/* PREVIEW PHASE */}
      {/* ================================================================ */}
      {phase === 'preview' && previewData && (
        <Card sx={cardSx}>
          <CardHeader
            title={'Anonymize: ' + previewData.patientName}
            subheader={'Patient ID: ' + previewData.patientId + (previewData.fhirId ? ' | FHIR ID: ' + previewData.fhirId : '')}
            sx={{
              bgcolor: 'warning.main',
              '& .MuiCardHeader-title': { color: '#ffffff' },
              '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
            }}
            avatar={<SecurityIcon sx={{ color: '#ffffff' }} />}
          />
          <CardContent>
            {/* Destructive Warning */}
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
                color: cardTextColor,
                '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' },
                '& .MuiAlertTitle-root': { color: cardTextColor }
              }}
            >
              <AlertTitle>Irreversible Operation</AlertTitle>
              This permanently modifies data in the database. Names, addresses, phone numbers, emails, identifiers, and photos will be removed. Dates will be reduced to year only. This cannot be undone.
            </Alert>

            {/* PHI Summary by Safe Harbor Category */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                bgcolor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderColor: borderColor
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: cardTextColor, mb: 2 }}>
                Safe Harbor Categories Detected
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getUniqueCategoriesFromSummary(previewData.phiSummary || {}).map(function(catNum) {
                      return (
                        <TableRow key={catNum}>
                          <TableCell>{catNum}</TableCell>
                          <TableCell>{SAFE_HARBOR_CATEGORIES[catNum] || 'Unknown'}</TableCell>
                          <TableCell>
                            <Chip
                              label={catNum === 2 || catNum === 3 ? 'Pixelate' : 'Remove'}
                              size="small"
                              sx={{
                                bgcolor: catNum === 2 || catNum === 3
                                  ? (isDark ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.15)')
                                  : (isDark ? 'rgba(211, 47, 47, 0.3)' : 'rgba(211, 47, 47, 0.15)'),
                                color: catNum === 2 || catNum === 3
                                  ? (isDark ? '#90caf9' : '#1565c0')
                                  : (isDark ? '#f44336' : '#d32f2f')
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Before / After Preview */}
            {previewData.sampleBefore && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: isDark ? '#2a2a2a' : '#f5f5f5',
                  borderColor: borderColor
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: cardTextColor, mb: 2 }}>
                  Patient Record Preview (Before / After)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Before</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>After</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['name', 'address', 'birthDate', 'telecom', 'identifier', 'photo'].map(function(field) {
                        const beforeVal = get(previewData, 'sampleBefore.' + field);
                        const afterVal = get(previewData, 'sampleAfter.' + field);
                        if (beforeVal === undefined && afterVal === undefined) return null;
                        return (
                          <TableRow key={field}>
                            <TableCell sx={{ fontWeight: 'bold' }}>{field}</TableCell>
                            <TableCell>{renderPreviewValue(beforeVal)}</TableCell>
                            <TableCell>{renderPreviewValue(afterVal)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Resource Counts */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                bgcolor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderColor: borderColor
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: cardTextColor, mb: 2 }}>
                Resources to Anonymize
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Resource Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Count</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>PHI Fields</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>Patients</Typography></TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>1</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{get(previewData, 'phiSummary.Patient.fieldCount', '-')}</TableCell>
                    </TableRow>
                    {Object.entries(previewData.resourceCounts || {})
                      .sort(function(a, b) { return b[1] - a[1]; })
                      .map(function(entry) {
                        let resourceType = entry[0].replace(/s$/, '');
                        if (entry[0] === 'RelatedPersons') resourceType = 'RelatedPerson';
                        const phiCount = get(previewData, 'phiSummary.' + resourceType + '.fieldCount', '-');
                        return (
                          <TableRow key={entry[0]}>
                            <TableCell>{entry[0]}</TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>{entry[1]}</TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>{phiCount}</TableCell>
                          </TableRow>
                        );
                      })}
                    <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', borderTop: '2px solid', borderColor: borderColor } }}>
                      <TableCell>Total</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{previewData.totalLinkedResources + 1}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Options */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                bgcolor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderColor: borderColor
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: cardTextColor, mb: 1 }}>
                Options
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={skipPixelate}
                    onChange={function(e) { setSkipPixelate(e.target.checked); }}
                  />
                }
                label="Skip date pixelation (keep full dates instead of year only)"
              />
            </Paper>

            {/* Preview Warnings */}
            {previewData.previewWarnings && previewData.previewWarnings.length > 0 && (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
                  '& .MuiAlertTitle-root': { color: cardTextColor }
                }}
              >
                <AlertTitle>Warnings ({previewData.previewWarnings.length})</AlertTitle>
                {previewData.previewWarnings.map(function(warning, idx) {
                  return (
                    <Typography key={idx} variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {warning}
                    </Typography>
                  );
                })}
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={function() { setPhase('search'); }}
                sx={{ color: cardTextColor, borderColor: borderColor }}
              >
                Back to Search
              </Button>
              <Button
                variant="contained"
                color="warning"
                size="large"
                onClick={function() { setConfirmOpen(true); }}
                disabled={anonymizing}
                startIcon={anonymizing ? <CircularProgress size={20} /> : <SecurityIcon />}
              >
                {anonymizing ? 'Anonymizing...' : 'Anonymize Patient and All Resources'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/* RESULTS PHASE */}
      {/* ================================================================ */}
      {phase === 'results' && anonymizeResult && (
        <Card sx={cardSx}>
          <CardHeader
            title={'Anonymization Complete'}
            subheader={anonymizeResult.totalAnonymized + ' resources de-identified'}
            sx={{
              bgcolor: 'success.main',
              '& .MuiCardHeader-title': { color: '#ffffff' },
              '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
            }}
            avatar={<CheckCircleIcon sx={{ color: '#ffffff' }} />}
          />
          <CardContent>
            <Alert
              severity="success"
              sx={{
                mb: 3,
                bgcolor: isDark ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.1)',
                color: cardTextColor,
                '& .MuiAlert-icon': { color: isDark ? '#66bb6a' : '#2e7d32' },
                '& .MuiAlertTitle-root': { color: cardTextColor }
              }}
            >
              <AlertTitle>De-identification completed successfully</AlertTitle>
              Patient "{anonymizeResult.patientName}" and {anonymizeResult.totalAnonymized} linked resource{anonymizeResult.totalAnonymized !== 1 ? 's have' : ' has'} been de-identified using the HIPAA Safe Harbor method. A FHIR AuditEvent has been recorded. All resources have been tagged with meta.security code "PSEUDED".
            </Alert>

            {/* Warnings */}
            {anonymizeResult.warnings && anonymizeResult.warnings.length > 0 && (
              <Alert
                severity="warning"
                sx={{
                  mb: 3,
                  bgcolor: warningBgColor,
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' },
                  '& .MuiAlertTitle-root': { color: cardTextColor }
                }}
              >
                <AlertTitle>Review Recommended ({anonymizeResult.warnings.length} warning{anonymizeResult.warnings.length !== 1 ? 's' : ''})</AlertTitle>
                <Typography variant="body2" sx={{ mb: 1, color: secondaryTextColor }}>
                  The following fields may still contain PHI and should be reviewed manually:
                </Typography>
                {anonymizeResult.warnings.map(function(warning, idx) {
                  return (
                    <Typography key={idx} variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {warning}
                    </Typography>
                  );
                })}
              </Alert>
            )}

            {/* Write Errors */}
            {anonymizeResult.writeErrors && anonymizeResult.writeErrors.length > 0 && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' },
                  '& .MuiAlertTitle-root': { color: cardTextColor }
                }}
              >
                <AlertTitle>Write Errors ({anonymizeResult.writeErrors.length})</AlertTitle>
                {anonymizeResult.writeErrors.map(function(err, idx) {
                  return (
                    <Typography key={idx} variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {err}
                    </Typography>
                  );
                })}
              </Alert>
            )}

            {/* Reset Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ color: cardTextColor, borderColor: borderColor }}
              >
                Anonymize Another Patient
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/* CONFIRMATION DIALOG */}
      {/* ================================================================ */}
      <Dialog
        open={confirmOpen}
        onClose={function() { setConfirmOpen(false); }}
        PaperProps={{
          sx: {
            bgcolor: cardBgColor,
            color: cardTextColor
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'warning.main'
        }}>
          <WarningIcon color="warning" />
          Confirm Patient Anonymization
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: secondaryTextColor }}>
            You are about to de-identify patient <strong style={{ color: cardTextColor }}>{previewData ? previewData.patientName : ''}</strong> and{' '}
            <strong style={{ color: cardTextColor }}>{previewData ? previewData.totalLinkedResources : 0}</strong> linked resource{previewData && previewData.totalLinkedResources !== 1 ? 's' : ''}.
          </DialogContentText>
          <Alert
            severity="error"
            sx={{
              mt: 2,
              bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
              color: cardTextColor,
              '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' }
            }}
          >
            This operation permanently removes Protected Health Information (PHI) from all records. Names, addresses, phone numbers, emails, identifiers, and photos will be irreversibly removed. This cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={function() { setConfirmOpen(false); }}
            sx={{ color: secondaryTextColor }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAnonymize}
            color="warning"
            variant="contained"
          >
            Yes, Anonymize Patient
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            bgcolor: isDark
              ? (snackbar.severity === 'success' ? 'rgba(46, 125, 50, 0.9)'
                : snackbar.severity === 'error' ? 'rgba(211, 47, 47, 0.9)'
                : snackbar.severity === 'warning' ? 'rgba(237, 108, 2, 0.9)'
                : 'rgba(33, 150, 243, 0.9)')
              : undefined,
            color: isDark ? '#ffffff' : undefined
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default AnonymizePatientPage;
