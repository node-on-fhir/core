// /imports/ui-modules/PatientsDirectory.jsx

import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid,
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientsTable from '../ui-tables/PatientsTable';
import LayoutHelpers from '../lib/LayoutHelpers';
import { Patients } from '../lib/schemas/SimpleSchemas/Patients';

import { get, has, set } from 'lodash';



let defaultPatient = {
  index: 2,
  id: '',
  username: '',
  email: '',
  given: '',
  family: '',
  gender: ''
};



//===========================================================================

//===========================================================================
// SESSION VARIABLES

Session.setDefault('patientFormData', defaultPatient);
Session.setDefault('patientSearchFilter', '');
Session.setDefault('selectedPatientId', null);
Session.setDefault('selectedPatient', null);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('patientPageTabIndex', 0)
Session.setDefault('PatientsDirectory.onePageLayout', true)
Session.setDefault('PatientsDirectory.defaultQuery', {})
Session.setDefault('PatientsTable.hideCheckbox', true)
Session.setDefault('PatientsTable.patientsIndex', 0)


//===========================================================================
// MAIN COMPONENT  

export function PatientsDirectory(props){
  const [searchFilter, setSearchFilter] = useState('');

  // Subscribe to Patients data with search filter
  const isLoading = useTracker(() => {
    console.log('PatientDirectory subscription - searchFilter:', searchFilter);
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    // Build query for search
    let query = {};
    if(searchFilter && searchFilter.trim() !== ''){
      const trimmedFilter = searchFilter.trim();
      
      // Check if this looks like a MongoDB ObjectID (24 hex characters) or FHIR ID
      const isObjectId = /^[a-f\d]{24}$/i.test(trimmedFilter);
      const isFhirId = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(trimmedFilter);
      
      if(isObjectId || isFhirId){
        // Exact match for IDs - use string matching only
        query = {
          $or: [
            {'id': trimmedFilter},
            {'_id': trimmedFilter}
          ]
        };
        console.log('Exact ID search query:', query);
      } else {
        // Regex search for other fields
        const searchRegex = new RegExp(searchFilter, 'i');
        query = {
          $or: [
            {'id': {$regex: searchRegex}},
            {'_id': {$regex: searchRegex}},
            {'name.text': {$regex: searchRegex}},
            {'name.given': {$regex: searchRegex}},
            {'name.family': {$regex: searchRegex}},
            {'identifier.value': {$regex: searchRegex}},
            {'telecom.value': {$regex: searchRegex}},
            {'address.city': {$regex: searchRegex}},
            {'address.state': {$regex: searchRegex}},
            {'address.postalCode': {$regex: searchRegex}}
          ]
        };
      }
    }
    
    if(autoPublishEnabled){
      console.log('Subscribing to autopublish.Patients with query:', JSON.stringify(query));
      const handle = Meteor.subscribe('autopublish.Patients', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('patients.all');
      return !handle.ready();
    }
  }, [searchFilter]);

  let data = {
    selectedPatientId: '',
    selectedPatient: null,
    patients: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    organizationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('PatientsDirectory.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('PatientsTable.hideCheckbox');
  }, [])
  data.selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, [])
  data.selectedPatient = useTracker(function(){
    return Patients.findOne({_id: Session.get('selectedPatientId')});
  }, [])
  data.patients = useTracker(function(){
    // If autopublish is enabled, the subscription is already filtered
    // so we can just return all patients in the local collection
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    if(autoPublishEnabled){
      // Get all patients from collection
      let results = Patients.find().fetch();
      console.log('Autopublish patients found:', results.length);
      
      // If we have a search filter and server-side filtering didn't work, 
      // apply client-side filtering as fallback
      if(searchFilter && searchFilter.trim() !== '') {
        const trimmedFilter = searchFilter.trim();
        
        // Check if this looks like a MongoDB ObjectID (24 hex characters) or FHIR ID
        const isObjectId = /^[a-f\d]{24}$/i.test(trimmedFilter);
        const isFhirId = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(trimmedFilter);
        
        if(isObjectId || isFhirId) {
          // Exact match for IDs
          results = results.filter(p => {
            const idStr = p._id && p._id._str ? p._id._str : String(p._id);
            return p.id === trimmedFilter || idStr === trimmedFilter;
          });
          console.log('Filtered to exact matches:', results.length);
        } else {
          // Regex search for other fields
          const searchRegex = new RegExp(searchFilter, 'i');
          results = results.filter(p => {
            return (
              searchRegex.test(p.id || '') ||
              searchRegex.test(p._id || '') ||
              searchRegex.test(get(p, 'name[0].text', '')) ||
              searchRegex.test(get(p, 'name[0].given', '')) ||
              searchRegex.test(get(p, 'name[0].family', '')) ||
              searchRegex.test(get(p, 'identifier[0].value', '')) ||
              searchRegex.test(get(p, 'telecom[0].value', '')) ||
              searchRegex.test(get(p, 'address[0].city', '')) ||
              searchRegex.test(get(p, 'address[0].state', '')) ||
              searchRegex.test(get(p, 'address[0].postalCode', ''))
            );
          });
          console.log('Filtered by regex search:', results.length);
        }
      }
      
      return results;
    } else {
      // Fall back to client-side filtering for non-autopublish mode
      let query = {};
      
      if(searchFilter && searchFilter.trim() !== ''){
        const trimmedFilter = searchFilter.trim();
        
        // Check if this looks like a MongoDB ObjectID (24 hex characters) or FHIR ID
        const isObjectId = /^[a-f\d]{24}$/i.test(trimmedFilter);
        const isFhirId = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(trimmedFilter);
        
        if(isObjectId || isFhirId){
          // Exact match for IDs - use string matching only
          query = {
            $or: [
              {'id': trimmedFilter},
              {'_id': trimmedFilter}
            ]
          };
        } else {
          // Regex search for other fields
          const searchRegex = new RegExp(searchFilter, 'i');
          query = {
            $or: [
              {'id': {$regex: searchRegex}},
              {'_id': {$regex: searchRegex}},
              {'name.text': {$regex: searchRegex}},
              {'name.given': {$regex: searchRegex}},
              {'name.family': {$regex: searchRegex}},
              {'identifier.value': {$regex: searchRegex}},
              {'telecom.value': {$regex: searchRegex}},
              {'address.city': {$regex: searchRegex}},
              {'address.state': {$regex: searchRegex}},
              {'address.postalCode': {$regex: searchRegex}}
            ]
          };
        }
      }
      
      return Patients.find(query).fetch();
    }
  }, [searchFilter])
  data.patientsIndex = useTracker(function(){
    return Session.get('PatientsTable.patientsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])

  // let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  // let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddPatient(){
    console.log('Add Patient button clicked');
    // Clear search filter if active
    if(searchFilter){
      setSearchFilter('');
    }
    // Add logic for adding a new patient
  }

  function renderHeader() {
    // Log some IDs for debugging when not searching
    if(!searchFilter && data.patients.length > 0) {
      console.log('Sample patient IDs from your database:');
      data.patients.slice(0, 3).forEach(p => {
        const idStr = p._id && p._id._str ? p._id._str : String(p._id);
        console.log(`- _id: ${idStr}, id: ${p.id}`);
      });
    }
    
    return (
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Patients
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.patients.length} patients found
              {searchFilter && ` (filtered)`}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddPatient}
            >
              Add Patient
            </Button>
          </Grid>
        </Grid>
        
        <Box mt={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search patients by ID, name, identifier, phone, city, state, or postal code..."
            value={searchFilter}
            onChange={(e) => {
              console.log('Search input changed:', e.target.value);
              setSearchFilter(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchFilter('');
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: 'background.paper',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        </Box>
      </Box>
    );
  }

  let layoutContent;
  if(data.patients.length > 0){
    layoutContent = <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <PatientsTable 
          id='patientsTable'
          patients={data.patients}
          count={data.patients.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Patients.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Patients._collection.remove({_id: selectedId})
          }}
          rowClickMode="_id"
          onRowClick={function(patientId){
            console.log('onTableRowClick', patientId);

            // Find patient by either id or _id
            let patient = Patients.findOne({id: patientId});
            if(!patient) {
              patient = Patients.findOne({_id: patientId});
            }
            
            console.log('Found patient:', patient);
            
            // Set the _id as selectedPatientId (MongoDB ID)
            if(patient) {
              const mongoId = patient._id && patient._id._str ? patient._id._str : patient._id;
              Session.set('selectedPatientId', mongoId);
              Session.set('selectedPatient', patient);
              console.log('Set selectedPatientId to:', mongoId);
              console.log('Set selectedPatient to:', patient);
            } else {
              console.error('Could not find patient with id:', patientId);
            }

            console.log('openUrlOnRowClick', get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', ''))
            if(get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick')){
              // Navigate to patient chart when View Chart is clicked
              window.location.href = get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', '/patient-chart');
            }
          }}
          onFhirOperations={function(patientId){
            console.log('FHIR Operations for patient:', patientId);
            // Navigate to FHIR operations page
            window.location.href = `/patient/${patientId}/fhir`;
          }}
          onSetPage={function(index){
            Session.set('PatientsTable.patientsIndex', index)
          }}        
          page={data.patientsIndex}
          logger={window.logger ? window.logger : null}
          size="medium"
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Card 
        sx={{ 
          maxWidth: '600px',
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                mb: 2
              }}
            >
              {searchFilter ? "No Patients Found" : get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                lineHeight: 1.7,
                maxWidth: '480px',
                mx: 'auto'
              }}
            >
              {searchFilter ? 
                `No patients match your search criteria "${searchFilter}". Try adjusting your search terms.` : 
                get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor. To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries. If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")
              }
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddPatient}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            {searchFilter ? "Clear Search & Add Patient" : "Add Your First Patient"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="patientsDirectory" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      <Box sx={{ width: '100%' }}>
        { renderHeader() }
        { layoutContent }
      </Box>
    </Box>
  );
}


export default PatientsDirectory;


