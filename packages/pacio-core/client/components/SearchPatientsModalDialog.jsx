// /packages/pacio-core/client/components/SearchPatientsModalDialog.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import moment from 'moment';
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

  // Debug: Log when modal opens
  useEffect(() => {
    if (open) {
      console.log('SearchPatientsModalDialog opened with bedId:', bedId);
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
            console.error('Error searching patients:', error);
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
    console.log('Patient selected:', patient);
    setSelectedPatient(patient);
  };

  const handleAssignPatient = () => {
    console.log('handleAssignPatient called:', { selectedPatient, bedId });

    if (selectedPatient && bedId) {
      // Convert ObjectID to string if necessary
      let patientId = selectedPatient._id;
      if (typeof patientId === 'object' && patientId !== null) {
        // MongoDB ObjectID - extract string value
        patientId = patientId._str || patientId.toHexString?.() || patientId.toString();
      }

      console.log('Calling pacio.assignPatientToBed with:', bedId, patientId);

      Meteor.call('pacio.assignPatientToBed', bedId, patientId, (error, result) => {
        if (error) {
          console.error('Error assigning patient to bed:', error);
        } else {
          console.log('Patient assigned successfully:', result);
          onSelectPatient(selectedPatient);
          handleClose();
        }
      });
    } else {
      console.warn('Cannot assign patient:', {
        hasSelectedPatient: !!selectedPatient,
        hasBedId: !!bedId
      });
    }
  };

  const handleClose = () => {
    setSearchText('');
    setSelectedPatient(null);
    setSearchResults([]);
    onClose();
  };

  const getPatientName = (patient) => {
    if (get(patient, 'name[0].text')) {
      return get(patient, 'name[0].text');
    }
    const given = get(patient, 'name[0].given[0]', '');
    const family = get(patient, 'name[0].family', '');
    return `${given} ${family}`.trim() || 'Unknown Patient';
  };

  const getPatientMRN = (patient) => {
    return get(patient, 'identifier[0].value', 'No MRN');
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
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: isDark ? '#424242' : '#e0e0e0' }}>
                    <PersonIcon sx={{ color: cardTextColor }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1" sx={{ color: cardTextColor }}>
                        {patientName}
                      </Typography>
                      {patientAge && (
                        <Chip
                          label={`${patientAge}y`}
                          size="small"
                          sx={{
                            color: cardTextColor,
                            borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)'
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                      >
                        MRN: {patientMRN}
                      </Typography>
                      {patient.gender && (
                        <Typography
                          variant="caption"
                          sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                        >
                          {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                        </Typography>
                      )}
                    </Box>
                  }
                />
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
            console.log('Assign Patient button clicked!');
            console.log('Button disabled state:', !selectedPatient);
            console.log('Selected patient:', selectedPatient);
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