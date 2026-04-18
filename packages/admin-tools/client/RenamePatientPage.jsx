// packages/admin-tools/client/RenamePatientPage.jsx

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
  Snackbar,
  Paper,
  Chip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import PreviewIcon from '@mui/icons-material/Preview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Get Honeycomb theme hook
let useAppTheme;
Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
});

function RenamePatientPage() {
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

  // New name inputs
  const [newGivenName, setNewGivenName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');

  // Rename state
  const [renaming, setRenaming] = useState(false);
  const [renameResult, setRenameResult] = useState(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Rename feature flag (null = loading, true/false = result)
  const [renameEnabled, setRenameEnabled] = useState(null);

  // Theme
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const infoBgColor = isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)';

  // On mount, check if rename is enabled via server settings
  useEffect(function() {
    Meteor.call('adminTools.checkRenameSetting', function(error, result) {
      if (error) {
        console.warn('[RenamePatientPage] Error checking rename setting:', error.reason);
        setRenameEnabled(false);
      } else {
        setRenameEnabled(get(result, 'allowPatientRename', false));
      }
    });
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

    Meteor.call('adminTools.renamePatient.search', searchTerm.trim(), function(error, result) {
      setSearching(false);
      if (error) {
        console.error('[RenamePatientPage] Search error:', error);
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

  function handlePreviewRename() {
    if (!selectedPatient) return;

    setPreviewing(true);
    setPreviewData(null);

    Meteor.call('adminTools.renamePatient.dryRun', selectedPatient._id, function(error, result) {
      setPreviewing(false);
      if (error) {
        console.error('[RenamePatientPage] Dry-run error:', error);
        showSnackbar('Preview error: ' + error.reason, 'error');
      } else {
        setPreviewData(result);
        setNewGivenName(get(result, 'currentGivenName', ''));
        setNewFamilyName(get(result, 'currentFamilyName', ''));
        setPhase('preview');
      }
    });
  }

  function handleExecuteRename() {
    if (!selectedPatient || (!newGivenName.trim() && !newFamilyName.trim())) return;

    setRenaming(true);

    Meteor.call('adminTools.renamePatient.execute', selectedPatient._id, {
      given: newGivenName.trim(),
      family: newFamilyName.trim()
    }, function(error, result) {
      setRenaming(false);
      if (error) {
        console.error('[RenamePatientPage] Rename error:', error);
        showSnackbar('Rename error: ' + error.reason, 'error');
      } else {
        setRenameResult(result);
        setPhase('results');
        showSnackbar('Patient renamed successfully', 'success');
      }
    });
  }

  function handleReset() {
    setPhase('search');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedPatient(null);
    setPreviewData(null);
    setRenameResult(null);
    setNewGivenName('');
    setNewFamilyName('');
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
      {/* Info Banner */}
      <Alert
        severity="info"
        sx={{
          mb: 3,
          bgcolor: infoBgColor,
          color: cardTextColor,
          '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
          '& .MuiAlertTitle-root': { color: cardTextColor }
        }}
      >
        <AlertTitle>Rename Patient</AlertTitle>
        This tool renames a patient and updates all display references across linked FHIR resources. The patient's given name and family name will be updated, and all resources that reference this patient by display name will be updated accordingly. A FHIR AuditEvent will be recorded.
      </Alert>

      {/* Rename disabled warning */}
      {renameEnabled === false && (
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
          <AlertTitle>Patient Renaming Disabled</AlertTitle>
          Patient renaming is not enabled. Contact your administrator to enable it in the server settings (Meteor.settings.private.allowPatientRename).
        </Alert>
      )}

      {/* ================================================================ */}
      {/* SEARCH PHASE */}
      {/* ================================================================ */}
      {phase === 'search' && (
        <Card sx={cardSx}>
          <CardHeader
            title="Rename Patient"
            subheader="Search for a patient to rename"
            sx={{
              bgcolor: 'info.main',
              '& .MuiCardHeader-title': { color: '#ffffff' },
              '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
            }}
            avatar={<DriveFileRenameOutlineIcon sx={{ color: '#ffffff' }} />}
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
                              backgroundColor: isSelected ? (isDark ? 'rgba(33, 150, 243, 0.12)' : 'rgba(33, 150, 243, 0.06)') : 'transparent'
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
                                color="info"
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

            {/* Preview Rename Button */}
            {selectedPatient && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="info"
                  size="large"
                  onClick={handlePreviewRename}
                  disabled={previewing || renameEnabled === false}
                  startIcon={previewing ? <CircularProgress size={20} /> : <PreviewIcon />}
                >
                  {previewing ? 'Scanning Resources...' : 'Preview Rename for ' + getDisplayName(selectedPatient)}
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
            title={'Rename: ' + previewData.patientName}
            subheader={'Patient ID: ' + previewData.patientId + (previewData.fhirId ? ' | FHIR ID: ' + previewData.fhirId : '')}
            sx={{
              bgcolor: 'info.main',
              '& .MuiCardHeader-title': { color: '#ffffff' },
              '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
            }}
            avatar={<DriveFileRenameOutlineIcon sx={{ color: '#ffffff' }} />}
          />
          <CardContent>
            {/* New Name Inputs */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                mb: 3,
                bgcolor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderColor: borderColor
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: cardTextColor, mb: 2 }}>
                New Name
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Given Name (First)"
                  variant="outlined"
                  value={newGivenName}
                  onChange={function(e) { setNewGivenName(e.target.value); }}
                  placeholder="e.g. Jane"
                />
                <TextField
                  fullWidth
                  label="Family Name (Last)"
                  variant="outlined"
                  value={newFamilyName}
                  onChange={function(e) { setNewFamilyName(e.target.value); }}
                  placeholder="e.g. Doe"
                />
              </Box>
              {newGivenName.trim() || newFamilyName.trim() ? (
                <Typography variant="body2" sx={{ mt: 1, color: secondaryTextColor }}>
                  Preview: <strong style={{ color: cardTextColor }}>{(newGivenName.trim() + ' ' + newFamilyName.trim()).trim()}</strong>
                </Typography>
              ) : null}
            </Paper>

            {/* Summary */}
            <Alert
              severity="info"
              sx={{
                mb: 3,
                bgcolor: infoBgColor,
                color: cardTextColor,
                '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
                '& .MuiAlertTitle-root': { color: cardTextColor }
              }}
            >
              <AlertTitle>
                {previewData.totalLinkedResources + 1} resources will have display names updated
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
                color="info"
                size="large"
                onClick={handleExecuteRename}
                disabled={renaming || (!newGivenName.trim() && !newFamilyName.trim())}
                startIcon={renaming ? <CircularProgress size={20} /> : <DriveFileRenameOutlineIcon />}
              >
                {renaming ? 'Renaming...' : 'Rename Patient'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/* RESULTS PHASE */}
      {/* ================================================================ */}
      {phase === 'results' && renameResult && (
        <Card sx={cardSx}>
          <CardHeader
            title={'Rename Complete: ' + renameResult.newName}
            subheader={renameResult.totalUpdated + ' total resources updated'}
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
              <AlertTitle>Patient renamed successfully</AlertTitle>
              Patient has been renamed from <strong style={{ color: cardTextColor }}>"{renameResult.oldName}"</strong> to{' '}
              <strong style={{ color: cardTextColor }}>"{renameResult.newName}"</strong>.{' '}
              {renameResult.totalUpdated} resource{renameResult.totalUpdated !== 1 ? 's were' : ' was'} updated. A FHIR AuditEvent has been recorded.
            </Alert>

            {/* Reset Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ color: cardTextColor, borderColor: borderColor }}
              >
                Rename Another Patient
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

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

export default RenamePatientPage;
