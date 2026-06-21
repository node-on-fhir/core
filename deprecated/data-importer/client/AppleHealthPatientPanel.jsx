// packages/data-importer/client/AppleHealthPatientPanel.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

let PatientSearchDialog;
let FhirUtilities;
if (Meteor.isClient) {
  Meteor.startup(function(){
    PatientSearchDialog = Meteor.PatientSearchDialog;
    FhirUtilities = Meteor.FhirUtilities;
  });
}

function AppleHealthPatientPanel(props) {
  var demographics = props.demographics;
  var onPatientConfirmed = props.onPatientConfirmed;
  var isDark = props.isDark;
  var onImport = props.onImport;
  var importDisabled = props.importDisabled;
  var selectedCount = props.selectedCount || 0;
  var importSummary = props.importSummary || [];

  // Configurable labels (defaults match Apple Health context)
  var confirmTitle = props.confirmTitle || 'Patient Confirmed';
  var clearLabel = props.clearLabel || 'Clear';
  var infoText = props.infoText || 'Imported data will be created as FHIR Observations with subject reference to this patient.';
  var selectPrompt = props.selectPrompt || 'Select the patient to associate this Apple Health data with.';

  var resolvedPatientState = useState(null);
  var resolvedPatient = resolvedPatientState[0];
  var setResolvedPatient = resolvedPatientState[1];

  var resolutionSourceState = useState(null);
  var resolutionSource = resolutionSourceState[0];
  var setResolutionSource = resolutionSourceState[1];

  var showSearchDialogState = useState(false);
  var showSearchDialog = showSearchDialogState[0];
  var setShowSearchDialog = showSearchDialogState[1];

  // Theme-aware colors
  var cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  var textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  // Get user roles reactively
  var userInfo = useTracker(function() {
    var user = Meteor.user();
    if (!user) return { roles: [], patientId: null };

    var roles = get(user, 'roles', []);
    var patientId = get(user, 'patientId') || get(user, 'profile.patientId');
    return { roles: roles, patientId: patientId };
  }, []);

  var isPractitioner = userInfo.roles.includes('healthcare practitioner') ||
                       userInfo.roles.includes('healthcare provider');

  // Resolution logic on mount
  useEffect(function() {
    // Branch 1: Check Session for pre-selected patient
    var sessionPatient = Session.get('selectedPatient');
    if (sessionPatient) {
      console.log('[AppleHealthPatientPanel] Resolved patient from Session:', get(sessionPatient, '_id'));
      setResolvedPatient(sessionPatient);
      setResolutionSource('session');
      return;
    }

    // Branch 2: Practitioner user — don't auto-resolve, show search
    if (isPractitioner) {
      console.log('[AppleHealthPatientPanel] Practitioner user, awaiting patient selection');
      return;
    }

    // Branch 3: Regular user — look up from Meteor.user().patientId
    if (userInfo.patientId) {
      console.log('[AppleHealthPatientPanel] Looking up patient from user profile:', userInfo.patientId);
      Meteor.call('patients.findOne', userInfo.patientId, function(error, patient) {
        if (error) {
          console.warn('[AppleHealthPatientPanel] Error looking up patient:', error.reason);
        } else if (patient) {
          setResolvedPatient(patient);
          setResolutionSource('user');
        }
      });
    }
  }, [isPractitioner, userInfo.patientId]);

  // Notify parent and update Session when resolvedPatient changes
  useEffect(function() {
    if (resolvedPatient) {
      Session.set('selectedPatient', resolvedPatient);
      Session.set('selectedPatientId', get(resolvedPatient, 'id'));
    }
    if (typeof onPatientConfirmed === 'function') {
      onPatientConfirmed(resolvedPatient);
    }
  }, [resolvedPatient]);

  function handlePatientSelected(selectedId, selectedPatient) {
    console.log('[AppleHealthPatientPanel] Patient selected from search:', selectedId);
    // Always fetch the raw FHIR patient from MongoDB.
    // PatientSearchDialog passes a flattened patient (from FhirDehydrator.flattenPatient)
    // which has givenName/familyName but no name[] array, so pluckName() fails.
    var lookupId = (selectedPatient && get(selectedPatient, '_id')) || selectedId;
    Meteor.call('patients.findOne', lookupId, function(error, patient) {
      if (patient) {
        setResolvedPatient(patient);
        setResolutionSource('search');
      } else if (selectedPatient) {
        // Fallback: use the provided flattened object if server lookup fails
        console.warn('[AppleHealthPatientPanel] Server lookup failed, using flattened patient');
        setResolvedPatient(selectedPatient);
        setResolutionSource('search');
      }
    });
    setShowSearchDialog(false);
  }

  function handleChangePatient() {
    setShowSearchDialog(true);
  }

  function handleClearPatient() {
    setResolvedPatient(null);
    setResolutionSource(null);
  }

  // Build patient display name
  var patientName = '';
  var patientDob = '';
  var patientGender = '';
  if (resolvedPatient) {
    console.log('[AppleHealthPatientPanel] resolvedPatient:', JSON.stringify(resolvedPatient, null, 2));

    var utils = FhirUtilities || Meteor.FhirUtilities;
    if (utils && typeof utils.pluckName === 'function') {
      patientName = utils.pluckName(resolvedPatient);
    }
    if (!patientName && utils && typeof utils.assembleName === 'function') {
      var nameEntry = get(resolvedPatient, 'name.0');
      if (nameEntry) {
        patientName = utils.assembleName(nameEntry);
      }
    }
    if (!patientName) {
      var given = get(resolvedPatient, 'name.0.given.0', '');
      var family = get(resolvedPatient, 'name.0.family', '');
      var text = get(resolvedPatient, 'name.0.text', '');
      patientName = text || ((given + ' ' + family).trim());
    }
    // Fallback: flattened patient fields (from FhirDehydrator.flattenPatient or table selection)
    if (!patientName) {
      var fullName = get(resolvedPatient, 'fullName', '');
      var flatFamily = get(resolvedPatient, 'familyName', '');
      var flatGiven = get(resolvedPatient, 'givenName', '');
      var display = get(resolvedPatient, 'display', '');
      patientName = fullName || display || ((flatGiven + ' ' + flatFamily).trim());
    }
    // Last resort: show patient ID so the user can identify which patient is selected
    if (!patientName) {
      patientName = 'Patient ' + (get(resolvedPatient, 'id') || get(resolvedPatient, '_id') || 'Unknown');
    }
    patientDob = get(resolvedPatient, 'birthDate', '');
    patientGender = get(resolvedPatient, 'gender', '');
  }

  // Resolution source label
  var sourceLabel = '';
  if (resolutionSource === 'session') {
    sourceLabel = 'From sidebar selection';
  } else if (resolutionSource === 'user') {
    sourceLabel = 'From your profile';
  } else if (resolutionSource === 'search') {
    sourceLabel = 'Manually selected';
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
      {/* Demographics info from Apple Health <Me> element */}
      {demographics && (demographics.dateOfBirth || demographics.biologicalSex || demographics.bloodType) && (
        <Box sx={{
          p: 2,
          borderRadius: 1,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          border: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
        }}>
          <Typography variant="subtitle2" sx={{ color: cardTextColor, mb: 1 }}>
            Apple Health Profile
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {demographics.dateOfBirth && (
              <Chip
                size="small"
                label={'DOB: ' + demographics.dateOfBirth}
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  color: cardTextColor
                }}
              />
            )}
            {demographics.biologicalSex && (
              <Chip
                size="small"
                label={'Sex: ' + demographics.biologicalSex}
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  color: cardTextColor
                }}
              />
            )}
            {demographics.bloodType && demographics.bloodType !== 'NotSet' && (
              <Chip
                size="small"
                label={'Blood Type: ' + demographics.bloodType}
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  color: cardTextColor
                }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Patient confirmation / selection */}
      {resolvedPatient ? (
        <Alert
          severity="success"
          sx={{
            bgcolor: isDark ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.1)',
            color: cardTextColor,
            '& .MuiAlert-icon': { color: isDark ? '#66bb6a' : '#2e7d32' },
            '& .MuiAlertTitle-root': { color: cardTextColor }
          }}
          icon={<CheckCircleIcon />}
          action={
            isPractitioner ? (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button
                  size="small"
                  startIcon={<SwapHorizIcon />}
                  onClick={handleChangePatient}
                  sx={{ color: cardTextColor }}
                >
                  Change
                </Button>
                <Button
                  size="small"
                  startIcon={<CloseIcon />}
                  onClick={handleClearPatient}
                  sx={{ color: cardTextColor }}
                >
                  {clearLabel}
                </Button>
              </Box>
            ) : null
          }
        >
          <AlertTitle>{confirmTitle}</AlertTitle>
          <Typography variant="body2" sx={{ color: cardTextColor }}>
            <strong>{patientName}</strong>
          </Typography>
          {patientDob && (
            <Typography variant="caption" sx={{ color: textSecondary }}>
              DOB: {patientDob}
            </Typography>
          )}
          {patientGender && (
            <Typography variant="caption" sx={{ color: textSecondary, ml: patientDob ? 2 : 0 }}>
              Gender: {patientGender}
            </Typography>
          )}
          <Typography variant="caption" display="block" sx={{ color: textSecondary, mt: 0.5 }}>
            {sourceLabel}
          </Typography>
        </Alert>
      ) : isPractitioner ? (
        <Alert
          severity="info"
          sx={{
            bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)',
            color: cardTextColor,
            '& .MuiAlert-icon': { color: isDark ? '#90caf9' : '#1976d2' },
            '& .MuiAlertTitle-root': { color: cardTextColor }
          }}
        >
          <AlertTitle>Select Patient</AlertTitle>
          <Typography variant="body2" sx={{ color: cardTextColor, mb: 1 }}>
            {selectPrompt}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonSearchIcon />}
            onClick={handleChangePatient}
            sx={{
              color: cardTextColor,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
            }}
          >
            Select Patient
          </Button>
        </Alert>
      ) : (
        <Alert
          severity="warning"
          sx={{
            bgcolor: isDark ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.1)',
            color: cardTextColor,
            '& .MuiAlert-icon': { color: isDark ? '#ff9800' : '#ed6c02' },
            '& .MuiAlertTitle-root': { color: cardTextColor }
          }}
        >
          <AlertTitle>No Linked Patient Record</AlertTitle>
          <Typography variant="body2" sx={{ color: cardTextColor }}>
            Your account does not have a linked patient record. Import is unavailable until your profile is connected to a patient record.
          </Typography>
        </Alert>
      )}

      {/* Import destination info */}
      {resolvedPatient && (
        <Typography variant="body2" sx={{ color: textSecondary }}>
          {infoText}
        </Typography>
      )}

      {/* Import Summary Table */}
      {resolvedPatient && importSummary.length > 0 && (
        <TableContainer sx={{
          border: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          borderRadius: 1,
          '& .MuiTableCell-root': {
            color: cardTextColor,
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            py: 0.5,
            px: 1.5
          }
        }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Data Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Records</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {importSummary.map(function(item) {
                return (
                  <TableRow key={item.displayName}>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: cardTextColor }}>
                        {item.displayName}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: cardTextColor }}>
                        {item.importCount.toLocaleString()}
                        {item.summarized ? ' (daily)' : ''}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                  <Typography variant="body2" sx={{ color: cardTextColor, fontWeight: 'bold' }}>
                    Total
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                  <Typography variant="body2" sx={{ color: cardTextColor, fontWeight: 'bold' }}>
                    {importSummary.reduce(function(sum, item) { return sum + item.importCount; }, 0).toLocaleString()}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Import Action */}
      {resolvedPatient && typeof onImport === 'function' && (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={onImport}
          disabled={importDisabled || selectedCount === 0}
          sx={{ mt: 1 }}
        >
          Import {selectedCount > 0 ? selectedCount.toLocaleString() + ' ' : ''}Selected Records
        </Button>
      )}

      {/* Patient Search Dialog */}
      <Dialog
        open={showSearchDialog}
        onClose={function() { setShowSearchDialog(false); }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#1e1e1e' : '#ffffff',
            color: cardTextColor
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: cardTextColor
        }}>
          Select Patient
          <IconButton
            size="small"
            onClick={function() { setShowSearchDialog(false); }}
            sx={{ color: cardTextColor }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {PatientSearchDialog ? (
          <PatientSearchDialog
            onSelect={handlePatientSelected}
            hideFhirBarcode={true}
          />
        ) : null}
      </Dialog>
    </Box>
  );
}

export default AppleHealthPatientPanel;
