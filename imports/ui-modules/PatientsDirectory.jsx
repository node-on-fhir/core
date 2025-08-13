// /imports/ui-modules/PatientsDirectory.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

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

import { PatientsTable } from '../ui-tables';
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
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState('');
  const searchTimeoutRef = useRef(null);

  // Debounce the search filter to prevent rapid re-subscriptions
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchFilter(searchFilter);
    }, 300); // 300ms delay
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchFilter]);

  // Subscribe to Patients data with search filter
  const isLoading = useTracker(() => {
    console.log('PatientDirectory subscription - debouncedSearchFilter:', debouncedSearchFilter);
    
    // Check if autopublish is enabled (for backward compatibility)
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    // Check if PatientDirectory module is enabled
    const patientDirectoryEnabled = get(Meteor, 'settings.public.modules.PatientDirectory', true);
    if (!patientDirectoryEnabled) {
      console.log('PatientDirectory module is disabled');
      return false;
    }
    
    // Build query for search
    let query = {};
    if(debouncedSearchFilter && debouncedSearchFilter.trim() !== ''){
      const trimmedFilter = debouncedSearchFilter.trim();
      
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
        const searchRegex = new RegExp(debouncedSearchFilter, 'i');
        query = {
          $or: [
            {'id': {$regex: searchRegex}},
            {'_id': {$regex: searchRegex}},
            {'name.text': {$regex: searchRegex}},
            {'name.0.text': {$regex: searchRegex}},
            {'name.given': {$regex: searchRegex}},
            {'name.0.given': {$regex: searchRegex}},
            {'name.family': {$regex: searchRegex}},
            {'name.0.family': {$regex: searchRegex}},
            {'identifier.value': {$regex: searchRegex}},
            {'identifier.0.value': {$regex: searchRegex}},
            {'telecom.value': {$regex: searchRegex}},
            {'telecom.0.value': {$regex: searchRegex}},
            {'address.city': {$regex: searchRegex}},
            {'address.0.city': {$regex: searchRegex}},
            {'address.state': {$regex: searchRegex}},
            {'address.0.state': {$regex: searchRegex}},
            {'address.postalCode': {$regex: searchRegex}},
            {'address.0.postalCode': {$regex: searchRegex}}
          ]
        };
      }
    }
    
    // Choose the appropriate publication based on configuration
    let handle;
    if(autoPublishEnabled){
      // Use autopublish if enabled (development mode)
      console.log('Using autopublish.Patients with query:', JSON.stringify(query));
      handle = Meteor.subscribe('autopublish.Patients', query, { limit: 1000 });
    } else {
      // Use the proper authenticated publication
      const isDevelopment = get(Meteor, 'settings.public.environment') === 'development' || !get(Meteor, 'settings.public.environment');
      
      if (isDevelopment) {
        // In development, use patients.all for simplicity if no search
        if (Object.keys(query).length === 0) {
          console.log('Using patients.all publication (development)');
          handle = Meteor.subscribe('patients.all');
        } else {
          console.log('Using patients.search publication with query:', JSON.stringify(query));
          handle = Meteor.subscribe('patients.search', query, { limit: 1000 });
        }
      } else {
        // In production, always use patients.search with authentication
        console.log('Using patients.search publication with query:', JSON.stringify(query));
        handle = Meteor.subscribe('patients.search', query, { limit: 1000 });
      }
    }
    
    return !handle.ready();
  }, [debouncedSearchFilter]);

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
      // Get all patients from collection, sorted by most recent first
      let results = Patients.find({}, { sort: { _id: -1 } }).fetch();
      console.log('Autopublish patients found:', results.length);
      
      // Debug: Check the first few patient IDs to understand sort order
      if (results.length > 0 && !Session.get('PatientsDirectory.debugLogged')) {
        Session.set('PatientsDirectory.debugLogged', true);
        console.log('First 3 patients in sort order:');
        results.slice(0, 3).forEach((p, i) => {
          console.log(`Patient ${i}:`, {
            name: p.name?.[0]?.text || `${p.name?.[0]?.given?.[0]} ${p.name?.[0]?.family}`,
            _id: p._id,
            _idType: typeof p._id,
            _idIsObjectID: p._id && p._id._str ? 'ObjectID' : 'String',
            _idString: p._id && p._id._str ? p._id._str : String(p._id),
            id: p.id
          });
        });
      }
      
      // If we have a search filter and server-side filtering didn't work, 
      // apply client-side filtering as fallback
      if(debouncedSearchFilter && debouncedSearchFilter.trim() !== '') {
        const trimmedFilter = debouncedSearchFilter.trim();
        
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
          const searchRegex = new RegExp(debouncedSearchFilter, 'i');
          results = results.filter(p => {
            return (
              searchRegex.test(p.id || '') ||
              searchRegex.test(p._id || '') ||
              searchRegex.test(get(p, 'name[0].text', '')) ||
              searchRegex.test(get(p, 'name[0].given[0]', '')) ||
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
      
      if(debouncedSearchFilter && debouncedSearchFilter.trim() !== ''){
        const trimmedFilter = debouncedSearchFilter.trim();
        
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
          const searchRegex = new RegExp(debouncedSearchFilter, 'i');
          query = {
            $or: [
              {'id': {$regex: searchRegex}},
              {'_id': {$regex: searchRegex}},
              {'name.text': {$regex: searchRegex}},
              {'name.0.text': {$regex: searchRegex}},
              {'name.given': {$regex: searchRegex}},
              {'name.0.given': {$regex: searchRegex}},
              {'name.family': {$regex: searchRegex}},
              {'name.0.family': {$regex: searchRegex}},
              {'identifier.value': {$regex: searchRegex}},
              {'identifier.0.value': {$regex: searchRegex}},
              {'telecom.value': {$regex: searchRegex}},
              {'telecom.0.value': {$regex: searchRegex}},
              {'address.city': {$regex: searchRegex}},
              {'address.0.city': {$regex: searchRegex}},
              {'address.state': {$regex: searchRegex}},
              {'address.0.state': {$regex: searchRegex}},
              {'address.postalCode': {$regex: searchRegex}},
              {'address.0.postalCode': {$regex: searchRegex}}
            ]
          };
        }
      }
      
      return Patients.find(query, { sort: { _id: -1 } }).fetch();
    }
  }, [debouncedSearchFilter])
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
    if(searchFilter || debouncedSearchFilter){
      setSearchFilter('');
      setDebouncedSearchFilter('');
    }
    // Navigate to new patient form
    navigate('/patients/new');
  }

  function renderHeader() {
    // Log some IDs for debugging when not searching
    if(!debouncedSearchFilter && data.patients.length > 0) {
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
              {debouncedSearchFilter && ` (filtered)`}
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
            id="patientSearchInput"
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
            
            // Set both the FHIR id and the full patient object
            if(patient) {
              const fhirId = patient.id;
              const mongoId = patient._id && patient._id._str ? patient._id._str : patient._id;
              Session.set('selectedPatientId', fhirId);  // Store FHIR id for queries
              Session.set('selectedPatientMongoId', mongoId);  // Store MongoDB id if needed
              Session.set('selectedPatient', patient);
              console.log('Set selectedPatientId (FHIR) to:', fhirId);
              console.log('Set selectedPatientMongoId to:', mongoId);
              console.log('Set selectedPatient to:', patient);
            } else {
              console.error('Could not find patient with id:', patientId);
            }

            console.log('openUrlOnRowClick', get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', ''))
            if(get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick')){
              // Navigate to patient chart when View Chart is clicked
              const targetUrl = get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', '/patient-chart');
              navigate(targetUrl);
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
        className="no-data-card"
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
              {debouncedSearchFilter ? "No Patients Found" : get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")}
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
              {debouncedSearchFilter ? 
                `No patients match your search criteria "${debouncedSearchFilter}". Try adjusting your search terms.` : 
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
            {debouncedSearchFilter ? "Clear Search & Add Patient" : "Add Your First Patient"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="patientsPage" 
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


