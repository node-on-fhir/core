// packages/admin-tools/client/DeletePatientPage.jsx

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
  Snackbar
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PreviewIcon from '@mui/icons-material/Preview';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const log = (Meteor.Logger ? Meteor.Logger.for('DeletePatientPage') : console);

// Get Honeycomb theme hook
let useAppTheme;
Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
});

function DeletePatientPage() {
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

  // Deletion state
  const [deleting, setDeleting] = useState(false);
  const [deletionResult, setDeletionResult] = useState(null);

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

  // Theme
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const dangerBgColor = isDark ? 'rgba(244, 67, 54, 0.15)' : 'rgba(244, 67, 54, 0.1)';

  function showSnackbar(message, severity) {
    setSnackbar({ open: true, message: message, severity: severity || 'info' });
  }

  function handleCloseSnackbar() {
    setSnackbar({ ...snackbar, open: false });
  }

  // On mount, check for ?patientId= URL param and auto-select
  useEffect(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientIdParam = urlParams.get('patientId');

    if (patientIdParam) {
      setAutoLoading(true);
      log.debug('Auto-loading patient from URL param', { patientIdParam });

      Meteor.call('adminTools.deletePatient.search', patientIdParam, function(error, result) {
        setAutoLoading(false);
        if (error) {
          log.warn('Auto-load search error', { reason: error.reason });
          showSnackbar('Patient not found: ' + patientIdParam, 'warning');
        } else if (result && result.length > 0) {
          const exactMatch = result.find(function(p) { return p._id === patientIdParam; });
          const patient = exactMatch || result[0];
          setSearchResults(result);
          setSelectedPatient(patient);
          setSearchTerm(patientIdParam);
          log.debug('Auto-selected patient', { id: patient._id });
        } else {
          showSnackbar('Patient not found: ' + patientIdParam, 'warning');
        }
      });
    }
  }, []);

  function handleSearch() {
    if (!searchTerm.trim()) return;

    setSearching(true);
    setSearchResults([]);

    Meteor.call('adminTools.deletePatient.search', searchTerm.trim(), function(error, result) {
      setSearching(false);
      if (error) {
        log.error('Search error', { error });
        showSnackbar('Search error: ' + error.reason, 'error');
      } else {
        setSearchResults(result || []);
        if (result.length === 0) {
          showSnackbar('No patients found matching "' + searchTerm + '"', 'info');
        }
      }
    });
  }

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    setPreviewData(null);
  }

  function handlePreviewDeletion() {
    if (!selectedPatient) return;

    setPreviewing(true);
    setPreviewData(null);

    Meteor.call('adminTools.deletePatient.dryRun', selectedPatient._id, function(error, result) {
      setPreviewing(false);
      if (error) {
        log.error('Dry-run error', { error });
        showSnackbar('Preview error: ' + error.reason, 'error');
      } else {
        setPreviewData(result);
        setPhase('preview');
      }
    });
  }

  function handleConfirmDelete() {
    setConfirmOpen(false);
    setDeleting(true);

    Meteor.call('adminTools.deletePatient.execute', selectedPatient._id, function(error, result) {
      setDeleting(false);
      if (error) {
        log.error('Deletion error', { error });
        showSnackbar('Deletion error: ' + error.reason, 'error');
      } else {
        setDeletionResult(result);
        setPhase('results');
        showSnackbar('Patient and all linked resources deleted successfully', 'success');
      }
    });
  }

  function handleReset() {
    setPhase('search');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedPatient(null);
    setPreviewData(null);
    setDeletionResult(null);
  }

  function getDisplayName(patient) {
    if (patient.fullName) return patient.fullName;
    const parts = [patient.givenName, patient.familyName].filter(Boolean);
    return parts.join(' ') || 'Unknown';
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
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Warning Banner */}
      <Alert
        severity="warning"
        sx={{
          mb: 3,
          bgcolor: isDark ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.1)',
          color: cardTextColor,
          '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' },
          '& .MuiAlertTitle-root': { color: cardTextColor }
        }}
      >
        <AlertTitle>Destructive Operation</AlertTitle>
        This tool permanently deletes a patient and all linked FHIR resources (Observations, Conditions, Encounters, etc.). This action cannot be undone. A FHIR AuditEvent will be recorded.
      </Alert>

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
            title="Delete Patient"
            subheader="Search for a patient to delete"
            sx={{
              bgcolor: 'error.main',
              '& .MuiCardHeader-title': { color: '#ffffff' },
              '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
            }}
            avatar={<PersonRemoveIcon sx={{ color: '#ffffff' }} />}
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
                              backgroundColor: isSelected ? (isDark ? 'rgba(244, 67, 54, 0.12)' : 'rgba(244, 67, 54, 0.06)') : 'transparent'
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
                                color="error"
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

            {/* Preview Deletion Button */}
            {selectedPatient && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  onClick={handlePreviewDeletion}
                  disabled={previewing}
                  startIcon={previewing ? <CircularProgress size={20} /> : <PreviewIcon />}
                >
                  {previewing ? 'Scanning Resources...' : 'Preview Deletion for ' + getDisplayName(selectedPatient)}
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
            title={'Deletion Preview: ' + previewData.patientName}
            subheader={'Patient ID: ' + previewData.patientId + (previewData.fhirId ? ' | FHIR ID: ' + previewData.fhirId : '')}
            sx={{
              bgcolor: 'warning.main',
              '& .MuiCardHeader-title': { color: '#ffffff' },
              '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
            }}
            avatar={<WarningIcon sx={{ color: '#ffffff' }} />}
          />
          <CardContent>
            {/* Summary */}
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: dangerBgColor,
                color: cardTextColor,
                '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' },
                '& .MuiAlertTitle-root': { color: cardTextColor }
              }}
            >
              <AlertTitle>
                {previewData.totalLinkedResources + 1} total records will be permanently deleted
              </AlertTitle>
              This includes 1 Patient record and {previewData.totalLinkedResources} linked resource{previewData.totalLinkedResources !== 1 ? 's' : ''} across {Object.keys(previewData.resourceCounts).length} collection{Object.keys(previewData.resourceCounts).length !== 1 ? 's' : ''}.
            </Alert>

            {/* Resource Counts Table */}
            {Object.keys(previewData.resourceCounts).length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Resource Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Patients</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>1</TableCell>
                    </TableRow>
                    {Object.entries(previewData.resourceCounts)
                      .sort(function(a, b) { return b[1] - a[1]; })
                      .map(function(entry) {
                        return (
                          <TableRow key={entry[0]}>
                            <TableCell>{entry[0]}</TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>{entry[1]}</TableCell>
                          </TableRow>
                        );
                      })}
                    <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', borderTop: '2px solid', borderColor: borderColor } }}>
                      <TableCell>Total</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{previewData.totalLinkedResources + 1}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {Object.keys(previewData.resourceCounts).length === 0 && (
              <Alert
                severity="info"
                sx={{
                  mb: 2,
                  bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' }
                }}
              >
                No linked resources found. Only the Patient record will be deleted.
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
                color="error"
                size="large"
                onClick={function() { setConfirmOpen(true); }}
                disabled={deleting}
                startIcon={deleting ? <CircularProgress size={20} /> : <PersonRemoveIcon />}
              >
                {deleting ? 'Deleting...' : 'Delete Patient and All Resources'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/* RESULTS PHASE */}
      {/* ================================================================ */}
      {phase === 'results' && deletionResult && (
        <Card sx={cardSx}>
          <CardHeader
            title={'Deletion Complete: ' + deletionResult.patientName}
            subheader={deletionResult.totalDeleted + ' total records deleted'}
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
              <AlertTitle>Cascade deletion completed successfully</AlertTitle>
              Patient "{deletionResult.patientName}" and all linked resources have been permanently deleted. A FHIR AuditEvent has been recorded.
            </Alert>

            {/* Deletion Results Table */}
            {Object.keys(deletionResult.deletionResults).length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Resource Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Deleted</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Patients</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>1</TableCell>
                    </TableRow>
                    {Object.entries(deletionResult.deletionResults)
                      .sort(function(a, b) {
                        const aVal = typeof a[1] === 'number' ? a[1] : 0;
                        const bVal = typeof b[1] === 'number' ? b[1] : 0;
                        return bVal - aVal;
                      })
                      .map(function(entry) {
                        const isError = typeof entry[1] === 'string';
                        return (
                          <TableRow key={entry[0]}>
                            <TableCell>{entry[0]}</TableCell>
                            <TableCell sx={{
                              textAlign: 'right',
                              color: isError ? 'error.main' : 'inherit'
                            }}>
                              {isError ? entry[1] : entry[1]}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', borderTop: '2px solid', borderColor: borderColor } }}>
                      <TableCell>Total</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{deletionResult.totalDeleted}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Reset Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ color: cardTextColor, borderColor: borderColor }}
              >
                Delete Another Patient
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
          color: 'error.main'
        }}>
          <WarningIcon color="error" />
          Confirm Patient Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: secondaryTextColor }}>
            You are about to permanently delete patient <strong style={{ color: cardTextColor }}>{previewData ? previewData.patientName : ''}</strong> and{' '}
            <strong style={{ color: cardTextColor }}>{previewData ? previewData.totalLinkedResources : 0}</strong> linked resource{previewData && previewData.totalLinkedResources !== 1 ? 's' : ''}.
          </DialogContentText>
          <Alert
            severity="error"
            sx={{
              mt: 2,
              bgcolor: dangerBgColor,
              color: cardTextColor,
              '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' }
            }}
          >
            This action is irreversible. All patient data will be permanently removed from the database.
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
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Yes, Delete Everything
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

export default DeletePatientPage;
