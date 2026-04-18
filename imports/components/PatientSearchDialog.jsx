// /imports/components/PatientSearchDialog.jsx

import React, { useState, useEffect } from 'react';

import {
  TextField,
  InputAdornment,
  IconButton,
  DialogContent,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import PropTypes from 'prop-types';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import { PatientsTable } from '/imports/ui-tables';

// Get the Patients collection
let Patients;
let useAppTheme;
Meteor.startup(function(){
  if (Meteor.Collections?.Patients) {
    Patients = Meteor.Collections.Patients;
  }
  useAppTheme = Meteor.useTheme;
});

function PatientSearchDialog(props){
  let {
    defaultSearchTerm,
    onSelect,
    hideFhirBarcode,
    ...otherProps
  } = props;

  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  const [searchTerm, setSearchTerm] = useState(defaultSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(defaultSearchTerm);

  // Debounce the search term to prevent rapid re-subscriptions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Subscribe to patients data with search query
  const isReady = useTracker(function(){
    // Build search query for server-side filtering
    let query = {};
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
      const searchPattern = debouncedSearchTerm.trim();
      query = {
        $or: [
          {'name.text': {$regex: searchPattern, $options: 'i'}},
          {'name.family': {$regex: searchPattern, $options: 'i'}},
          {'name.given': {$regex: searchPattern, $options: 'i'}},
          {'name.0.text': {$regex: searchPattern, $options: 'i'}},
          {'name.0.family': {$regex: searchPattern, $options: 'i'}},
          {'name.0.given': {$regex: searchPattern, $options: 'i'}},
          {'name.0.given.0': {$regex: searchPattern, $options: 'i'}}
        ]
      };
    }

    console.log('PatientSearchDialog subscribing with query:', JSON.stringify(query));
    const handle = Meteor.subscribe('patients.search', query, { limit: 1000 });
    return handle.ready();
  }, [debouncedSearchTerm]);

  let patients = useTracker(function(){
    if (!Patients || !isReady) return [];

    // Client-side filtering as additional safety
    // The server already filtered, but this ensures UI matches search term
    let searchQuery = {};
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
      const searchRegex = new RegExp(debouncedSearchTerm.trim(), 'i');
      searchQuery = {
        $or: [
          {'name.text': {$regex: searchRegex}},
          {'name.family': {$regex: searchRegex}},
          {'name.given': {$regex: searchRegex}},
          {'name.0.text': {$regex: searchRegex}},
          {'name.0.family': {$regex: searchRegex}},
          {'name.0.given': {$regex: searchRegex}},
          {'name.0.given.0': {$regex: searchRegex}}
        ]
      };
    }

    return Patients.find(searchQuery).fetch();
  }, [debouncedSearchTerm, isReady]);

  console.log("PatientSearchDialog.searchTerm", searchTerm);
  console.log("PatientSearchDialog.debouncedSearchTerm", debouncedSearchTerm);
  console.log("PatientSearchDialog.patients", patients);

  function changeInput(event){
    setSearchTerm(event.target.value);
  }

  function handleFilterPatients(event){
    console.log('handleFilterPatients', searchTerm);
  }

  return (
    <DialogContent dividers sx={{
      minHeight: '650px',
      bgcolor: cardBgColor,
      color: cardTextColor,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      '& .MuiTextField-root': {
        '& .MuiInputBase-root': { color: cardTextColor },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
        },
        '& .MuiInputBase-input::placeholder': {
          color: textSecondary,
          opacity: 1
        }
      },
      '& .MuiIconButton-root': { color: cardTextColor },
      '& .MuiTableCell-root': {
        color: cardTextColor,
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
      },
      '& .MuiTableHead-root .MuiTableCell-root': {
        bgcolor: isDark ? '#2a2a2a' : '#f5f5f5'
      },
      '& .MuiTablePagination-root': { color: cardTextColor },
      '& .MuiTablePagination-selectLabel': { color: cardTextColor },
      '& .MuiTablePagination-displayedRows': { color: cardTextColor },
      '& .MuiTablePagination-selectIcon': { color: cardTextColor }
    }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          id="patientSearchField"
          placeholder="Search by patient name..."
          onChange={changeInput}
          value={searchTerm}
          fullWidth
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="search patients"
                  onClick={handleFilterPatients}
                  edge="end"
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      {!isReady ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      ) : patients.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Typography variant="h6" sx={{ color: textSecondary }}>
            {searchTerm ? 'No patients found matching your search' : 'No patients available'}
          </Typography>
        </Box>
      ) : (
        <PatientsTable
        hideActionIcons={true}
        hideActive={true}
        hideAddress={true}
        hideCity={true}
        hideState={true}
        hideCountry={true}
        hidePostalCode={true}
        hideMaritalStatus={true}
        hideLanguage={true}
        hideIdentifier={true}
        hideSystemBarcode={true}
        hideFhirBarcode={hideFhirBarcode}
        patients={patients}
        paginationCount={patients.length}
        rowsPerPage={25}
        onRowClick={function(selectedPatientId, selectedPatient){
          console.log('PatientSearchDialog.PatientsTable.onRowClick', selectedPatientId);
          console.log('PatientSearchDialog.PatientsTable.onRowClick - patient object:', selectedPatient);

          if(typeof onSelect === "function"){
            // PatientsTable now passes both ID and patient object
            if (selectedPatient) {
              console.log('Calling onSelect with patient object');
              onSelect(selectedPatientId, selectedPatient);
            } else {
              // Fallback: try to find the patient if not provided
              console.log('No patient object provided, looking for patient with ID:', selectedPatientId);
              const foundPatient = patients.find(p => p._id === selectedPatientId);
              console.log('Found patient:', foundPatient);
              if (foundPatient) {
                onSelect(selectedPatientId, foundPatient);
              } else {
                onSelect(selectedPatientId);
              }
            }
          }
        }}
      />
      )}
    </DialogContent>
  );
}

PatientSearchDialog.propTypes = {
  hideFhirBarcode: PropTypes.bool,
  defaultSearchTerm: PropTypes.string,
  onSelect: PropTypes.func
};

PatientSearchDialog.defaultProps = {
  defaultSearchTerm: "",
  hideFhirBarcode: true
}

export default PatientSearchDialog;
