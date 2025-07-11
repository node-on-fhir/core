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
    setSelectedPatient(patient);
  };

  const handleAssignPatient = () => {
    if (selectedPatient && bedId) {
      Meteor.call('pacio.assignPatientToBed', bedId, selectedPatient._id, (error) => {
        if (error) {
          console.error('Error assigning patient to bed:', error);
        } else {
          onSelectPatient(selectedPatient);
          handleClose();
        }
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
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Assign Patient to Bed</Typography>
          <IconButton onClick={handleClose} size="small">
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
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: isSearching && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }}
        />
        
        <List sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
          {displayPatients.length === 0 && searchText.length >= 2 && !isSearching && (
            <ListItem>
              <ListItemText 
                primary="No patients found"
                secondary="Try searching with a different name or MRN"
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
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light'
                    }
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">{patientName}</Typography>
                      {patientAge && (
                        <Chip label={`${patientAge}y`} size="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        MRN: {patientMRN}
                      </Typography>
                      {patient.gender && (
                        <Typography variant="caption" color="textSecondary">
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
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleAssignPatient}
          variant="contained"
          disabled={!selectedPatient}
        >
          Assign Patient
        </Button>
      </DialogActions>
    </Dialog>
  );
}