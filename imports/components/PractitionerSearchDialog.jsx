// /imports/components/PractitionerSearchDialog.jsx

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

import PractitionersTable from '/imports/ui-fhir/practitioners/PractitionersTable';

// Get the Practitioners collection
let Practitioners;
Meteor.startup(function(){
  if (Meteor.Collections?.Practitioners) {
    Practitioners = Meteor.Collections.Practitioners;
  }
});

function PractitionerSearchDialog(props){
  let { 
    defaultSearchTerm, 
    onSelect,
    hideFhirBarcode,
    ...otherProps 
  } = props;

  const [searchTerm, setSearchTerm] = useState(defaultSearchTerm);

  // Subscribe to practitioners data
  const isReady = useTracker(function(){
    const handle = Meteor.subscribe('practitioners.all');
    return handle.ready();
  }, []);

  let practitioners = useTracker(function(){
    if (!Practitioners || !isReady) return [];
    
    // Create a regex search that's case-insensitive
    let searchQuery = {};
    if (searchTerm && searchTerm.length > 0) {
      searchQuery = {
        $or: [
          {'name.text': {$regex: searchTerm, $options: 'i'}},
          {'name.family': {$regex: searchTerm, $options: 'i'}},
          {'name.given': {$regex: searchTerm, $options: 'i'}},
          {'qualification.code.text': {$regex: searchTerm, $options: 'i'}},
          {'identifier.value': {$regex: searchTerm, $options: 'i'}}
        ]
      };
    }
    
    return Practitioners.find(searchQuery).fetch();
  }, [searchTerm, isReady]);

  console.log("PractitionerSearchDialog.searchTerm", searchTerm);
  console.log("PractitionerSearchDialog.practitioners", practitioners);

  function changeInput(event){
    setSearchTerm(event.target.value);
  }  

  function handleFilterPractitioners(event){
    console.log('handleFilterPractitioners', searchTerm);
  }

  return (
    <DialogContent dividers sx={{minHeight: '500px', maxHeight: '600px', display: 'flex', flexDirection: 'column'}}>
      <Box sx={{ mb: 2 }}>
        <TextField
          id="practitionerSearchField"
          placeholder="Search by practitioner name, license, or qualification..."
          onChange={changeInput}
          value={searchTerm}
          fullWidth
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="search practitioners"
                  onClick={handleFilterPractitioners}
                  edge="end"
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {!isReady ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        ) : practitioners.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No practitioners found matching your search' : 'No practitioners available'}
            </Typography>
          </Box>
        ) : (
          <PractitionersTable 
            hideActionIcons={true}
            hideActive={true}
            hideAddress={true}
            hideTelecom={true}
            hideGender={true}
            hideIdentifier={true}
            hideBarcode={hideFhirBarcode}
            practitioners={practitioners}
            paginationCount={practitioners.length}        
            rowsPerPage={10}
            onRowClick={function(selectedPractitionerId, selectedPractitioner){
              console.log('PractitionerSearchDialog.PractitionersTable.onRowClick', selectedPractitionerId);
              console.log('PractitionerSearchDialog.PractitionersTable.onRowClick - practitioner object:', selectedPractitioner);
              
              if(typeof onSelect === "function"){
                // PractitionersTable should pass both ID and practitioner object
                if (selectedPractitioner) {
                  console.log('Calling onSelect with practitioner object');
                  onSelect(selectedPractitionerId, selectedPractitioner);
                } else {
                  // Fallback: try to find the practitioner if not provided
                  console.log('No practitioner object provided, looking for practitioner with ID:', selectedPractitionerId);
                  const foundPractitioner = practitioners.find(p => p._id === selectedPractitionerId || p.id === selectedPractitionerId);
                  console.log('Found practitioner:', foundPractitioner);
                  if (foundPractitioner) {
                    onSelect(selectedPractitionerId, foundPractitioner);
                  } else {
                    onSelect(selectedPractitionerId);
                  }
                }
              }
            }}
          />
        )}
      </Box>
    </DialogContent>
  );
}

PractitionerSearchDialog.propTypes = {
  id: PropTypes.string,
  defaultSearchTerm: PropTypes.string,
  onSelect: PropTypes.func,
  hideFhirBarcode: PropTypes.bool
};

PractitionerSearchDialog.defaultProps = {
  hideFhirBarcode: false,
  defaultSearchTerm: ""
}

export default PractitionerSearchDialog;