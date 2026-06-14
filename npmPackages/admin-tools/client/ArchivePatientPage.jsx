// packages/admin-tools/client/ArchivePatientPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ArchiveIcon from '@mui/icons-material/Archive';
import PreviewIcon from '@mui/icons-material/Preview';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';

// Get Honeycomb theme hook
let useAppTheme;
Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
});

// Patient Compartment: maps collection names to their patient reference field paths.
// Duplicated from archivePatientMethods.js to enable client-side Minimongo cleanup.
const PATIENT_COMPARTMENT_MAP = {
  'Observations': 'subject.reference',
  'Conditions': 'subject.reference',
  'Procedures': 'subject.reference',
  'Encounters': 'subject.reference',
  'DiagnosticReports': 'subject.reference',
  'DocumentReferences': 'subject.reference',
  'CarePlans': 'subject.reference',
  'CareTeams': 'subject.reference',
  'Goals': 'subject.reference',
  'ServiceRequests': 'subject.reference',
  'MedicationRequests': 'subject.reference',
  'MedicationAdministrations': 'subject.reference',
  'MedicationStatements': 'subject.reference',
  'AllergyIntolerances': 'patient.reference',
  'Immunizations': 'patient.reference',
  'Claims': 'patient.reference',
  'ClaimResponses': 'patient.reference',
  'ExplanationOfBenefits': 'patient.reference',
  'Coverages': 'subscriber.reference',
  'Communications': 'subject.reference',
  'CommunicationRequests': 'subject.reference',
  'Compositions': 'subject.reference',
  'Consents': 'patient.reference',
  'Devices': 'patient.reference',
  'ImagingStudies': 'subject.reference',
  'Lists': 'subject.reference',
  'NutritionOrders': 'patient.reference',
  'QuestionnaireResponses': 'subject.reference',
  'Specimens': 'subject.reference',
  'Tasks': 'for.reference',
  'RelatedPersons': 'patient.reference',
  'Provenances': 'target.reference',
  'Measures': 'subject.reference',
  'MeasureReports': 'subject.reference',
  'BodyStructures': 'patient.reference'
};

/**
 * Build a query that matches both Patient/{_id} and Patient/{fhirId}
 * when they differ. Uses $in for Minimongo compatibility.
 */
function buildPatientQuery(refField, mongoId, fhirId) {
  const refs = ['Patient/' + mongoId];
  if (fhirId && fhirId !== mongoId) {
    refs.push('Patient/' + fhirId);
    refs.push('urn:uuid:' + fhirId);
  }

  if (refs.length === 1) {
    return { [refField]: refs[0] };
  }
  return { [refField]: { $in: refs } };
}

function ArchivePatientPage() {
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

  // Archive state
  const [archiving, setArchiving] = useState(false);
  const [archiveResult, setArchiveResult] = useState(null);

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Archival feature flag (null = loading, true/false = result)
  const [archivalEnabled, setArchivalEnabled] = useState(null);

  // URL param pre-selection
  const [autoLoading, setAutoLoading] = useState(false);

  // Theme
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const hoverBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const warningBgColor = isDark ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.1)';

  // ================================================================
  // Client-side Minimongo helpers
  // ================================================================

  function flattenPatientForDisplay(patient) {
    return {
      _id: get(patient, '_id'),
      id: get(patient, 'id'),
      familyName: get(patient, 'name.0.family', ''),
      givenName: get(patient, 'name.0.given.0', ''),
      fullName: get(patient, 'name.0.text', ''),
      gender: get(patient, 'gender', ''),
      birthDate: get(patient, 'birthDate', ''),
      mrn: (get(patient, 'identifier', []).find(function(ident) {
        return get(ident, 'type.coding.0.code') === 'MR';
      }) || {}).value || '',
      location: 'client'
    };
  }

  function searchMinimongo(searchTerm) {
    const collections = global.Collections || Meteor.Collections || {};
    const Patients = collections['Patients'];
    if (!Patients || typeof Patients.find !== 'function') {
      return [];
    }

    const trimmed = searchTerm.trim();
    if (!trimmed) {
      return [];
    }

    // Try exact _id match first
    const exactMatch = Patients.findOne({ _id: trimmed });
    if (exactMatch) {
      return [flattenPatientForDisplay(exactMatch)];
    }

    // Regex search on name and identifier fields
    const regex = new RegExp(trimmed, 'i');
    const found = Patients.find({
      $or: [
        { 'name.0.family': regex },
        { 'name.0.given': regex },
        { 'name.0.text': regex },
        { 'identifier.value': regex }
      ]
    }, { limit: 10 }).fetch();

    return found.map(flattenPatientForDisplay);
  }

  function mergeSearchResults(serverResults, clientResults) {
    const merged = [];
    const seenIds = new Set();

    // Add server results first, tagged as 'server'
    for (let i = 0; i < serverResults.length; i++) {
      const sr = serverResults[i];
      seenIds.add(sr._id);
      // Check if also exists in client results
      const inClient = clientResults.some(function(cr) { return cr._id === sr._id; });
      merged.push(Object.assign({}, sr, { location: inClient ? 'both' : 'server' }));
    }

    // Add client-only results
    for (let j = 0; j < clientResults.length; j++) {
      const cr = clientResults[j];
      if (!seenIds.has(cr._id)) {
        merged.push(Object.assign({}, cr, { location: 'client' }));
      }
    }

    return merged;
  }

  function clientDryRun(patientId) {
    const collections = global.Collections || Meteor.Collections || {};
    const Patients = collections['Patients'];

    if (!Patients) {
      return { resourceCounts: {}, totalLinkedResources: 0, patientName: 'Unknown' };
    }

    const patient = Patients.findOne({ _id: patientId });
    if (!patient) {
      return { resourceCounts: {}, totalLinkedResources: 0, patientName: 'Unknown' };
    }

    const mongoId = get(patient, '_id');
    const fhirId = get(patient, 'id');
    const patientName = get(patient, 'name.0.text',
      (get(patient, 'name.0.given.0', '') + ' ' + get(patient, 'name.0.family', '')).trim()
    );

    console.log('[ArchivePatientPage] clientDryRun: searching for mongoId=' + mongoId + ', fhirId=' + fhirId);
    console.log('[ArchivePatientPage] clientDryRun: refs = Patient/' + mongoId + ', Patient/' + fhirId + ', urn:uuid:' + fhirId);

    const resourceCounts = {};
    let totalLinkedResources = 0;
    let checkedCount = 0;
    let skippedCount = 0;

    for (const [collectionName, refField] of Object.entries(PATIENT_COMPARTMENT_MAP)) {
      const collection = collections[collectionName];
      if (!collection || typeof collection.find !== 'function') {
        skippedCount++;
        continue;
      }

      checkedCount++;

      try {
        const query = buildPatientQuery(refField, mongoId, fhirId);
        const count = collection.find(query).count();
        if (count > 0) {
          resourceCounts[collectionName] = count;
          totalLinkedResources += count;
          console.log('[ArchivePatientPage] clientDryRun: ' + collectionName + ' matched ' + count + ' records');
        }
      } catch (error) {
        console.warn('[ArchivePatientPage] clientDryRun error counting ' + collectionName + ':', error.message);
      }
    }

    // Diagnostic: show total Minimongo counts for key collections
    ['Observations', 'Conditions', 'Encounters', 'Procedures'].forEach(function(name) {
      const col = collections[name];
      if (col && typeof col.find === 'function') {
        console.log('[ArchivePatientPage] clientDryRun: ' + name + ' total in Minimongo: ' + col.find({}).count());
      }
    });

    console.log('[ArchivePatientPage] clientDryRun: checked ' + checkedCount + ' collections, skipped ' + skippedCount + ', found ' + totalLinkedResources + ' linked resources');

    return {
      patientId: mongoId,
      fhirId: fhirId,
      patientName: patientName,
      resourceCounts: resourceCounts,
      totalLinkedResources: totalLinkedResources,
      clientOnly: true
    };
  }

  function clientCleanup(patientId) {
    const collections = global.Collections || Meteor.Collections || {};
    const Patients = collections['Patients'];
    const deletionResults = {};
    let totalDeleted = 0;

    if (!Patients) {
      console.warn('[ArchivePatientPage] clientCleanup: Patients collection not found');
      return { deletionResults: deletionResults, totalDeleted: 0 };
    }

    const patient = Patients.findOne({ _id: patientId });
    const mongoId = patientId;
    const fhirId = patient ? get(patient, 'id') : null;

    console.log('[ArchivePatientPage] clientCleanup: mongoId=' + mongoId + ', fhirId=' + fhirId);
    console.log('[ArchivePatientPage] clientCleanup: refs = Patient/' + mongoId + ', Patient/' + fhirId + ', urn:uuid:' + fhirId);

    // Remove linked resources
    for (const [collectionName, refField] of Object.entries(PATIENT_COMPARTMENT_MAP)) {
      const collection = collections[collectionName];
      if (!collection) {
        continue;
      }

      try {
        const query = buildPatientQuery(refField, mongoId, fhirId);
        const count = collection.find(query).count();
        if (count > 0) {
          // Use _collection.remove() to bypass DDP (local-only removal)
          if (collection._collection && typeof collection._collection.remove === 'function') {
            collection._collection.remove(query);
          } else {
            collection.remove(query);
          }
          deletionResults[collectionName] = count;
          totalDeleted += count;
          console.log('[ArchivePatientPage] clientCleanup: Removed ' + count + ' from ' + collectionName);
        }
      } catch (error) {
        console.warn('[ArchivePatientPage] clientCleanup error removing from ' + collectionName + ':', error.message);
        deletionResults[collectionName] = 'error: ' + error.message;
      }
    }

    // Remove the Patient record
    try {
      if (Patients._collection && typeof Patients._collection.remove === 'function') {
        Patients._collection.remove({ _id: mongoId });
      } else {
        Patients.remove({ _id: mongoId });
      }
      totalDeleted += 1;
      console.log('[ArchivePatientPage] clientCleanup: Removed Patient record:', mongoId);
    } catch (error) {
      console.warn('[ArchivePatientPage] clientCleanup error removing patient:', error.message);
    }

    return { deletionResults: deletionResults, totalDeleted: totalDeleted };
  }

  function clearSessionIfNeeded(patientId) {
    const sessionPatient = Session.get('selectedPatient');
    const sessionPatientId = Session.get('selectedPatientId');

    if (sessionPatientId === patientId ||
        (sessionPatient && (get(sessionPatient, '_id') === patientId || get(sessionPatient, 'id') === patientId))) {
      Session.set('selectedPatient', null);
      Session.set('selectedPatientId', null);
      console.log('[ArchivePatientPage] Cleared Session for archived patient:', patientId);
    }
  }

  // On mount, check if archival is enabled via server settings
  useEffect(function() {
    Meteor.call('adminTools.checkArchivalSetting', function(error, result) {
      if (error) {
        console.warn('[ArchivePatientPage] Error checking archival setting:', error.reason);
        setArchivalEnabled(false);
      } else {
        setArchivalEnabled(get(result, 'allowPatientArchival', false));
      }
    });
  }, []);

  // On mount, check for ?patientId= URL param and auto-select
  useEffect(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const patientIdParam = urlParams.get('patientId');

    if (patientIdParam) {
      setAutoLoading(true);
      console.log('[ArchivePatientPage] Auto-loading patient from URL param:', patientIdParam);

      // Search client Minimongo first
      const clientResults = searchMinimongo(patientIdParam);

      Meteor.call('adminTools.archivePatient.search', patientIdParam, function(error, result) {
        setAutoLoading(false);
        const serverResults = (!error && result) ? result : [];

        if (error) {
          console.warn('[ArchivePatientPage] Auto-load server error:', error.reason);
        }

        const merged = mergeSearchResults(serverResults, clientResults);

        if (merged.length > 0) {
          const exactMatch = merged.find(function(p) { return p._id === patientIdParam; });
          const patient = exactMatch || merged[0];
          setSearchResults(merged);
          setSelectedPatient(patient);
          setSearchTerm(patientIdParam);
          console.log('[ArchivePatientPage] Auto-selected patient:', patient._id, '(location: ' + patient.location + ')');
        } else {
          showSnackbar('Patient not found: ' + patientIdParam, 'warning');
        }

        if (error && clientResults.length > 0) {
          showSnackbar('Server search failed, showing client-side results only', 'warning');
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

    // Search client Minimongo first (synchronous)
    const clientResults = searchMinimongo(searchTerm.trim());

    Meteor.call('adminTools.archivePatient.search', searchTerm.trim(), function(error, result) {
      setSearching(false);
      const serverResults = (!error && result) ? result : [];

      if (error) {
        console.warn('[ArchivePatientPage] Server search error:', error.reason);
      }

      const merged = mergeSearchResults(serverResults, clientResults);
      setSearchResults(merged);

      if (merged.length === 0) {
        showSnackbar('No patients found matching "' + searchTerm + '"', 'info');
      } else if (error && clientResults.length > 0) {
        showSnackbar('Server search failed, showing client-side results only', 'warning');
      }
    });
  }

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    setPreviewData(null);
  }

  function handlePreviewArchive() {
    if (!selectedPatient) return;

    setPreviewing(true);
    setPreviewData(null);

    if (selectedPatient.location === 'client') {
      // Client-only patient: run dry-run locally
      const result = clientDryRun(selectedPatient._id);
      setPreviewing(false);
      setPreviewData(result);
      setPhase('preview');
    } else {
      // Server or both: call server dryRun, then augment with client counts
      Meteor.call('adminTools.archivePatient.dryRun', selectedPatient._id, function(error, result) {
        setPreviewing(false);
        if (error) {
          console.error('[ArchivePatientPage] Dry-run error:', error);
          showSnackbar('Preview error: ' + error.reason, 'error');
        } else {
          // Augment with client-side counts
          const clientCounts = clientDryRun(selectedPatient._id);
          if (clientCounts.totalLinkedResources > 0) {
            result.clientResourceCounts = clientCounts.resourceCounts;
            result.clientTotalLinkedResources = clientCounts.totalLinkedResources;
          }
          setPreviewData(result);
          setPhase('preview');
        }
      });
    }
  }

  function handleConfirmArchive() {
    setConfirmOpen(false);
    setArchiving(true);

    if (selectedPatient.location === 'client') {
      // Client-only: clean up Minimongo only, no server call, no AuditEvent
      const cleanupResult = clientCleanup(selectedPatient._id);
      clearSessionIfNeeded(selectedPatient._id);
      setArchiving(false);
      setArchiveResult({
        success: true,
        patientId: selectedPatient._id,
        patientName: getDisplayName(selectedPatient),
        totalDeleted: cleanupResult.totalDeleted,
        deletionResults: cleanupResult.deletionResults,
        clientOnly: true
      });
      setPhase('results');
      showSnackbar('Client-only patient cleaned up successfully', 'success');
    } else {
      // Server or both: call server archive first, then clean up client residuals
      Meteor.call('adminTools.archivePatient.execute', selectedPatient._id, function(error, result) {
        setArchiving(false);
        if (error) {
          console.error('[ArchivePatientPage] Archive error:', error);
          showSnackbar('Archive error: ' + error.reason, 'error');
        } else {
          // Clean up residual client-side cursors
          const clientResult = clientCleanup(selectedPatient._id);
          clearSessionIfNeeded(selectedPatient._id);

          if (clientResult.totalDeleted > 0) {
            result.clientCleanupCount = clientResult.totalDeleted;
            console.log('[ArchivePatientPage] Cleaned up ' + clientResult.totalDeleted + ' additional client-side records');
          }

          setArchiveResult(result);
          setPhase('results');
          showSnackbar('Patient archived and removed successfully', 'success');
        }
      });
    }
  }

  function handleReset() {
    setPhase('search');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedPatient(null);
    setPreviewData(null);
    setArchiveResult(null);
  }

  function getDisplayName(patient) {
    if (patient.fullName) return patient.fullName;
    const parts = [patient.givenName, patient.familyName].filter(Boolean);
    return parts.join(' ') || 'Unknown';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
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
          bgcolor: warningBgColor,
          color: cardTextColor,
          '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' },
          '& .MuiAlertTitle-root': { color: cardTextColor }
        }}
      >
        <AlertTitle>Archive Operation</AlertTitle>
        This tool archives a patient by bundling their data for long-term storage, then removes the patient and all linked resources from the active database. A FHIR AuditEvent will be recorded.
      </Alert>

      {/* Archival disabled warning */}
      {archivalEnabled === false && (
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
          <AlertTitle>Patient Archival Disabled</AlertTitle>
          Patient archival is not enabled. Contact your administrator to enable it in the server settings (Meteor.settings.private.allowPatientArchival).
        </Alert>
      )}

      {/* Auto-loading indicator */}
      {autoLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
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
            title="Archive Patient"
            subheader="Search for a patient to archive"
            sx={{
              bgcolor: 'warning.main',
              '& .MuiCardHeader-title': { color: '#ffffff' },
              '& .MuiCardHeader-subheader': { color: 'rgba(255, 255, 255, 0.8)' }
            }}
            avatar={<ArchiveIcon sx={{ color: '#ffffff' }} />}
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
                        <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
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
                              {patient.location === 'client' && (
                                <Chip label="Client Only" size="small" sx={{ bgcolor: isDark ? 'rgba(237, 108, 2, 0.3)' : 'rgba(237, 108, 2, 0.15)', color: isDark ? '#ff9800' : '#e65100' }} />
                              )}
                              {patient.location === 'server' && (
                                <Chip label="Server" size="small" sx={{ bgcolor: isDark ? 'rgba(46, 125, 50, 0.3)' : 'rgba(46, 125, 50, 0.15)', color: isDark ? '#66bb6a' : '#2e7d32' }} />
                              )}
                              {patient.location === 'both' && (
                                <Chip label="Server + Client" size="small" sx={{ bgcolor: isDark ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.15)', color: isDark ? '#90caf9' : '#1565c0' }} />
                              )}
                              {!patient.location && (
                                <Chip label="Server" size="small" sx={{ bgcolor: isDark ? 'rgba(46, 125, 50, 0.3)' : 'rgba(46, 125, 50, 0.15)', color: isDark ? '#66bb6a' : '#2e7d32' }} />
                              )}
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

            {/* Preview Archive Button */}
            {selectedPatient && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  onClick={handlePreviewArchive}
                  disabled={previewing || archivalEnabled === false}
                  startIcon={previewing ? <CircularProgress size={20} /> : <PreviewIcon />}
                >
                  {previewing ? 'Scanning Resources...' : 'Preview Archive for ' + getDisplayName(selectedPatient)}
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
            title={'Archive Preview: ' + previewData.patientName}
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
              severity="warning"
              sx={{
                mb: 3,
                bgcolor: warningBgColor,
                color: cardTextColor,
                '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' },
                '& .MuiAlertTitle-root': { color: cardTextColor }
              }}
            >
              <AlertTitle>
                {previewData.totalLinkedResources + 1} total records will be {previewData.clientOnly ? 'removed from client memory' : 'archived and removed'}
              </AlertTitle>
              This includes 1 Patient record and {previewData.totalLinkedResources} linked resource{previewData.totalLinkedResources !== 1 ? 's' : ''} across {Object.keys(previewData.resourceCounts).length} collection{Object.keys(previewData.resourceCounts).length !== 1 ? 's' : ''}.
              {previewData.clientOnly ? ' (Client-side Minimongo only — no server data will be affected.)' : ''}
            </Alert>

            {/* Archive Bundle Placeholder */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                bgcolor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderColor: borderColor
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InventoryIcon sx={{ color: isDark ? '#ff9800' : '#ed6c02' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: cardTextColor }}>
                  Archive Bundle
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2 }}>
                Patient data will be exported as a FHIR Bundle before deletion. (Export destination to be configured.)
              </Typography>
              <FormControl fullWidth size="small" disabled>
                <InputLabel
                  sx={{ color: secondaryTextColor }}
                >
                  Export Format
                </InputLabel>
                <Select
                  value="fhir-bundle"
                  label="Export Format"
                  sx={{
                    color: secondaryTextColor,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
                    '& .MuiSelect-icon': { color: secondaryTextColor }
                  }}
                >
                  <MenuItem value="fhir-bundle">FHIR Bundle (.json) — Coming Soon</MenuItem>
                  <MenuItem value="ndjson">NDJSON (.ndjson) — Coming Soon</MenuItem>
                  <MenuItem value="phr">PHR (.phr) — Coming Soon</MenuItem>
                </Select>
              </FormControl>
            </Paper>

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
                No linked resources found. Only the Patient record will be archived.
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
                disabled={archiving}
                startIcon={archiving ? <CircularProgress size={20} /> : <ArchiveIcon />}
              >
                {archiving ? 'Archiving...' : 'Archive Patient and All Resources'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ================================================================ */}
      {/* RESULTS PHASE */}
      {/* ================================================================ */}
      {phase === 'results' && archiveResult && (
        <Card sx={cardSx}>
          <CardHeader
            title={'Archive Complete: ' + archiveResult.patientName}
            subheader={archiveResult.totalDeleted + ' total records archived and removed'}
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
              <AlertTitle>Archive completed successfully</AlertTitle>
              {archiveResult.clientOnly
                ? 'Patient "' + archiveResult.patientName + '" and all linked resources have been removed from client-side memory. This patient existed only in the browser (loaded via Synthea import) and was not on the server.'
                : 'Patient "' + archiveResult.patientName + '" data has been bundled and all records have been removed from the active database. A FHIR AuditEvent has been recorded.'
              }
            </Alert>

            {archiveResult.clientOnly && (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' }
                }}
              >
                No FHIR AuditEvent was recorded because this patient existed only in client-side memory and was never persisted to the server database.
              </Alert>
            )}

            {archiveResult.clientCleanupCount > 0 && (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
                  color: cardTextColor,
                  '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' }
                }}
              >
                {archiveResult.clientCleanupCount} additional record{archiveResult.clientCleanupCount !== 1 ? 's were' : ' was'} cleaned up from client-side memory (Minimongo cursors from Synthea import).
              </Alert>
            )}

            {/* Bundle Metadata */}
            {archiveResult.bundleMetadata && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: isDark ? '#2a2a2a' : '#f5f5f5',
                  borderColor: borderColor
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <InventoryIcon sx={{ color: isDark ? '#66bb6a' : '#2e7d32' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: cardTextColor }}>
                    Archive Bundle Summary
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                  Resources bundled: {archiveResult.bundleMetadata.resourceCount}
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                  Estimated size: {formatBytes(archiveResult.bundleMetadata.estimatedSizeBytes)}
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                  Format: {archiveResult.bundleMetadata.format}
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#ff9800' : '#ed6c02', mt: 1 }}>
                  Note: Bundle was assembled in memory but not yet persisted to storage. Export destination coming soon.
                </Typography>
              </Paper>
            )}

            {/* Deletion Results Table */}
            {Object.keys(archiveResult.deletionResults).length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Resource Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Removed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Patients</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>1</TableCell>
                    </TableRow>
                    {Object.entries(archiveResult.deletionResults)
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
                              {entry[1]}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', borderTop: '2px solid', borderColor: borderColor } }}>
                      <TableCell>Total</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>{archiveResult.totalDeleted}</TableCell>
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
                Archive Another Patient
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
          Confirm Patient Archive
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: secondaryTextColor }}>
            You are about to archive patient <strong style={{ color: cardTextColor }}>{previewData ? previewData.patientName : ''}</strong> and{' '}
            <strong style={{ color: cardTextColor }}>{previewData ? previewData.totalLinkedResources : 0}</strong> linked resource{previewData && previewData.totalLinkedResources !== 1 ? 's' : ''}.
          </DialogContentText>
          <Alert
            severity="warning"
            sx={{
              mt: 2,
              bgcolor: warningBgColor,
              color: cardTextColor,
              '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' }
            }}
          >
            {selectedPatient && selectedPatient.location === 'client'
              ? 'This patient exists only in client-side memory (Minimongo). It will be removed from the browser. No server data will be affected and no AuditEvent will be recorded.'
              : 'Patient data will be bundled for archival, then all records will be removed from the active database. This removal cannot be undone.'
            }
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
            onClick={handleConfirmArchive}
            color="warning"
            variant="contained"
          >
            Yes, Archive and Remove
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

export default ArchivePatientPage;
