// /packages/pacio-core/client/components/SearchPatientsModalDialog.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import moment from 'moment';
import { FhirUtilities } from '/imports/lib/FhirUtilities';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  InputAdornment,
  CircularProgress,
  Chip,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const log = (Meteor.Logger ? Meteor.Logger.for('SearchPatientsModalDialog') : console);

export function SearchPatientsModalDialog({ open, onClose, onSelectPatient, bedId }) {
  const [searchText, setSearchText] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const paperBgColor = isDark ? '#2a2a2a' : '#f5f5f5';

  // Debug: Log when modal opens, and default the selection to the currently
  // selected patient (Session) so the tile above the search box is pre-populated.
  useEffect(() => {
    if (open) {
      log.debug('SearchPatientsModalDialog opened with bedId', { bedId });
      const sessionPatient = Session.get('selectedPatient');
      if (sessionPatient) {
        setSelectedPatient(sessionPatient);
      }
    }
  }, [open, bedId]);

  // Search for patients when search text changes
  useEffect(() => {
    if (searchText.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        Meteor.call('pacio.searchPatients', searchText, (error, results) => {
          setIsSearching(false);
          if (error) {
            log.error('Error searching patients', error);
          } else {
            setSearchResults(results || []);
          }
        });
      }, 300); // Debounce search
      
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchText]);

  // Get all patients if no search text
  const allPatients = useTracker(() => {
    if (searchText.length >= 2) return [];
    
    const Patients = get(Meteor, 'Collections.Patients');
    if (!Patients) return [];
    
    return Patients.find({}, { 
      limit: 20,
      sort: { 'meta.lastUpdated': -1 }  // Sort by most recently updated instead
    }).fetch();
  });

  const displayPatients = searchText.length >= 2 ? searchResults : allPatients;

  const handleSelectPatient = (patient) => {
    log.phi('Patient selected', { patient }, { action: 'read' });
    setSelectedPatient(patient);
  };

  const handleAssignPatient = () => {
    log.phi('handleAssignPatient called', { selectedPatient, bedId }, { action: 'update' });

    if (selectedPatient && bedId) {
      // Convert ObjectID to string if necessary
      let patientId = selectedPatient._id;
      if (typeof patientId === 'object' && patientId !== null) {
        // MongoDB ObjectID - extract string value
        patientId = patientId._str || patientId.toHexString?.() || patientId.toString();
      }

      log.debug('Calling pacio.assignPatientToBed with', { bedId, patientId });

      Meteor.call('pacio.assignPatientToBed', bedId, patientId, (error, result) => {
        if (error) {
          log.error('Error assigning patient to bed', error);
        } else {
          log.debug('Patient assigned successfully', { result });
          onSelectPatient(selectedPatient);
          handleClose();
        }
      });
    } else {
      console.warn('Cannot assign patient:', {
        hasSelectedPatient: !!selectedPatient,
        hasBedId: !!bedId
      }); // phi-audit: ok
    }
  };

  const handleClose = () => {
    setSearchText('');
    setSelectedPatient(null);
    setSearchResults([]);
    onClose();
  };

  const getPatientName = (patient) => {
    // FhirUtilities.pluckName handles both raw FHIR patients (name: [{ text, given,
    // family, use }]) and flattened patients (name: "Full Name" string), so the tile
    // (Session.get('selectedPatient'), sometimes flattened) and the search-result rows
    // (raw FHIR) both resolve correctly.
    const name = FhirUtilities.pluckName(patient);
    return (name && name.length > 0) ? name : 'Unknown Patient';
  };

  const getPatientMRN = (patient) => {
    const identifier = get(patient, 'identifier');
    if (Array.isArray(identifier)) {
      // Raw FHIR: prefer an MR (Medical Record Number) typed identifier, else the
      // first identifier that carries a value.
      const mr = identifier.find((id) => get(id, 'type.coding[0].code') === 'MR' && get(id, 'value'));
      const anyId = mr || identifier.find((id) => get(id, 'value'));
      if (get(anyId, 'value')) {
        return get(anyId, 'value');
      }
    } else if (typeof identifier === 'string' && identifier.length > 0) {
      // Flattened patient: identifier already collapsed to a string.
      return identifier;
    }
    // No usable MRN in Patient.identifier — flex to the FHIR resource id.
    return get(patient, 'id') || 'No MRN';
  };

  const getPatientAge = (patient) => {
    if (patient.birthDate) {
      return moment().diff(moment(patient.birthDate), 'years');
    }
    return null;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: cardBgColor,
          color: cardTextColor
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ color: cardTextColor }}>
            Assign Patient to Bed
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: cardTextColor }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Currently-selected patient tile — defaults to Session.get('selectedPatient'),
            updates as a row is picked below. This is the patient that will be assigned. */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            p: 1.5,
            mt: 1,
            borderRadius: 1,
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
            bgcolor: paperBgColor
          }}
        >
          {selectedPatient ? (
            <>
              <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                <Avatar sx={{ bgcolor: isDark ? '#424242' : '#e0e0e0', width: 36, height: 36 }}>
                  <PersonIcon sx={{ color: cardTextColor }} />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap sx={{ color: cardTextColor }}>
                    {getPatientName(selectedPatient)}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                  >
                    MRN: {getPatientMRN(selectedPatient)}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
                {getPatientAge(selectedPatient) != null && (
                  <Chip
                    label={`${getPatientAge(selectedPatient)}y`}
                    size="small"
                    sx={{
                      color: cardTextColor,
                      borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'
                    }}
                  />
                )}
                {selectedPatient.gender && (
                  <Typography variant="caption" sx={{ color: cardTextColor }}>
                    {selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1)}
                  </Typography>
                )}
              </Box>
            </>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
            >
              No patient selected
            </Typography>
          )}
        </Box>

        <TextField
          autoFocus
          fullWidth
          label="Search patients"
          placeholder="Search by name or MRN..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          margin="normal"
          sx={{
            '& .MuiInputLabel-root': { color: cardTextColor },
            '& .MuiInputBase-root': { color: cardTextColor },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: cardTextColor }} />
              </InputAdornment>
            ),
            endAdornment: isSearching && (
              <InputAdornment position="end">
                <CircularProgress size={20} sx={{ color: cardTextColor }} />
              </InputAdornment>
            )
          }}
        />
        
        <List sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
          {displayPatients.length === 0 && searchText.length >= 2 && !isSearching && (
            <ListItem>
              <ListItemText
                primary={<Typography sx={{ color: cardTextColor }}>No patients found</Typography>}
                secondary={
                  <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                    Try searching with a different name or MRN
                  </Typography>
                }
              />
            </ListItem>
          )}

          {displayPatients.map((patient) => {
            const patientName = getPatientName(patient);
            const patientMRN = getPatientMRN(patient);
            const patientAge = getPatientAge(patient);
            const isSelected = selectedPatient?._id === patient._id;

            return (
              <ListItem
                key={patient._id}
                button
                dense
                selected={isSelected}
                onClick={() => handleSelectPatient(patient)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                  },
                  '&.Mui-selected': {
                    bgcolor: isDark ? 'rgba(33, 150, 243, 0.16)' : 'rgba(33, 150, 243, 0.08)',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(33, 150, 243, 0.24)' : 'rgba(33, 150, 243, 0.12)'
                    }
                  }
                }}
              >
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Avatar sx={{ bgcolor: isDark ? '#424242' : '#e0e0e0', width: 32, height: 32 }}>
                    <PersonIcon fontSize="small" sx={{ color: cardTextColor }} />
                  </Avatar>
                </ListItemAvatar>
                {/* Left: name (line 1) + MRN (line 2). Right: age + sex, floated. */}
                <ListItemText
                  primary={
                    <Typography variant="body2" noWrap sx={{ color: cardTextColor }}>
                      {patientName}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                    >
                      MRN: {patientMRN}
                    </Typography>
                  }
                />
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ flexShrink: 0, ml: 1 }}
                >
                  {patientAge != null && (
                    <Chip
                      label={`${patientAge}y`}
                      size="small"
                      sx={{
                        color: cardTextColor,
                        borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'
                      }}
                    />
                  )}
                  {patient.gender && (
                    <Typography
                      variant="caption"
                      sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                    >
                      {patient.gender.charAt(0).toUpperCase()}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} sx={{ color: cardTextColor }}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            console.log('Assign Patient button clicked!'); // phi-audit: ok
            console.log('Button disabled state:', !selectedPatient); // phi-audit: ok
            log.phi('Selected patient', { selectedPatient }, { action: 'read' });
            console.log('Bed ID:', bedId);
            handleAssignPatient();
          }}
          variant="contained"
          disabled={!selectedPatient}
        >
          Assign Patient
        </Button>
      </DialogActions>
    </Dialog>
  );
}