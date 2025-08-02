// /imports/components/PatientSearchDialog.jsx

import React, { useState } from 'react';

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
Meteor.startup(function(){
  if (Meteor.Collections?.Patients) {
    Patients = Meteor.Collections.Patients;
  }
});

function PatientSearchDialog(props){
  let { 
    defaultSearchTerm, 
    onSelect,
    hideFhirBarcode,
    ...otherProps 
  } = props;

  const [searchTerm, setSearchTerm] = useState(defaultSearchTerm);

  // Subscribe to patients data
  const isReady = useTracker(function(){
    const handle = Meteor.subscribe('patients.all');
    return handle.ready();
  }, []);

  let patients = useTracker(function(){
    if (!Patients || !isReady) return [];
    
    // Create a regex search that's case-insensitive
    let searchQuery = {};
    if (searchTerm && searchTerm.length > 0) {
      searchQuery = {
        $or: [
          {'name.text': {$regex: searchTerm, $options: 'i'}},
          {'name.family': {$regex: searchTerm, $options: 'i'}},
          {'name.given': {$regex: searchTerm, $options: 'i'}}
        ]
      };
    }
    
    return Patients.find(searchQuery).fetch();
  }, [searchTerm, isReady]);

  console.log("PatientSearchDialog.searchTerm", searchTerm);
  console.log("PatientSearchDialog.patients", patients);

  function changeInput(event){
    setSearchTerm(event.target.value);
  }  

  function handleFilterPatients(event){
    console.log('handleFilterPatients', searchTerm);
  }

  return (
    <DialogContent dividers sx={{minHeight: '650px'}}>
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
          <Typography variant="h6" color="text.secondary">
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
        onRowClick={function(selectedPatientId){
          console.log('PatientSearchDialog.PatientsTable.onRowClick', selectedPatientId);
          
          if(typeof onSelect === "function"){
            // Find the patient object to pass both ID and full patient data
            console.log('Looking for patient with ID:', selectedPatientId);
            console.log('Available patients:', patients);
            const selectedPatient = patients.find(p => p._id === selectedPatientId || p.id === selectedPatientId);
            console.log('Found patient:', selectedPatient);
            if (selectedPatient) {
              onSelect(selectedPatientId, selectedPatient);
            } else {
              onSelect(selectedPatientId);
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