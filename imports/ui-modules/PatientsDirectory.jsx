// /imports/ui-modules/PatientsDirectory.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
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
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LaunchIcon from '@mui/icons-material/Launch';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BadgeIcon from '@mui/icons-material/Badge';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PeopleIcon from '@mui/icons-material/People';
import NumbersIcon from '@mui/icons-material/Numbers';
import WcIcon from '@mui/icons-material/Wc';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { PatientsTable } from '../ui-tables';
import LayoutHelpers from '../lib/LayoutHelpers.jsx';
import { Patients } from '../lib/schemas/SimpleSchemas/Patients';
import LaunchAppsModal from '../components/LaunchAppsModal.jsx';
import FhirNoData from '../ui-fhir/components/FhirNoData.jsx';

import { get, has, set } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('PatientsDirectory') : console);

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
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [launchPatient, setLaunchPatient] = useState(null);

  // Sorting and column visibility state
  const [sortOrder, setSortOrder] = useState('descending');
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [showGender, setShowGender] = useState(true);
  const [showBirthSex, setShowBirthSex] = useState(false);
  const [showActive, setShowActive] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [showFhirId, setShowFhirId] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showDemographics, setShowDemographics] = useState(false);

  // Get theme for dark mode support
  const useTheme = Meteor.useTheme;
  const appTheme = useTheme ? useTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

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
    log.phi('PatientDirectory subscription - debouncedSearchFilter', { searchFilter: debouncedSearchFilter }, { action: 'search' });
    
    // Check if PatientDirectory module is enabled
    const patientDirectoryEnabled = get(Meteor, 'settings.public.modules.PatientDirectory', true);
    if (!patientDirectoryEnabled) {
      console.log('PatientDirectory module is disabled'); // phi-audit: ok
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
        // Exact match for IDs - handle both string and ObjectID formats
        query = {
          $or: [
            {'id': trimmedFilter},
            {'_id': trimmedFilter}
          ]
        };
        console.log('Exact ID search query:', query);
      } else {
        // Regex search for other fields
        // Use string pattern instead of RegExp object for Meteor subscription serialization
        const searchPattern = debouncedSearchFilter;
        query = {
          $or: [
            {'id': {$regex: searchPattern, $options: 'i'}},
            {'_id': {$regex: searchPattern, $options: 'i'}},
            {'name.text': {$regex: searchPattern, $options: 'i'}},
            {'name.0.text': {$regex: searchPattern, $options: 'i'}},
            {'name.given': {$regex: searchPattern, $options: 'i'}},
            {'name.0.given': {$regex: searchPattern, $options: 'i'}},
            {'name.0.given.0': {$regex: searchPattern, $options: 'i'}},
            {'name.family': {$regex: searchPattern, $options: 'i'}},
            {'name.0.family': {$regex: searchPattern, $options: 'i'}},
            {'identifier.value': {$regex: searchPattern, $options: 'i'}},
            {'identifier.0.value': {$regex: searchPattern, $options: 'i'}},
            {'telecom.value': {$regex: searchPattern, $options: 'i'}},
            {'telecom.0.value': {$regex: searchPattern, $options: 'i'}},
            {'address.city': {$regex: searchPattern, $options: 'i'}},
            {'address.0.city': {$regex: searchPattern, $options: 'i'}},
            {'address.state': {$regex: searchPattern, $options: 'i'}},
            {'address.0.state': {$regex: searchPattern, $options: 'i'}},
            {'address.postalCode': {$regex: searchPattern, $options: 'i'}},
            {'address.0.postalCode': {$regex: searchPattern, $options: 'i'}}
          ]
        };
      }
    }
    
    // Subscribe to patients.search which has role-based ACL
    // - Practitioners: full access (configurable)
    // - Patients: only see their own record
    log.debug('PatientsDirectory - query keys:', { count: Object.keys(query).length });
    log.phi('PatientsDirectory - full query', { query }, { action: 'search' });
    log.phi('Using patients.search publication with query', { query }, { action: 'search' });
    let handle = Meteor.subscribe('patients.search', query, { limit: 1000 }, {
      onReady: function() {
        setSubscriptionError(null);
      },
      onStop: function(error) {
        if (error) {
          log.error('Subscription error', { reason: error.reason });
          setSubscriptionError(error.reason || 'Could not establish subscription to the Patient Directory.');
        }
      }
    });
    
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
    // Client-side query against local Minimongo (server already filtered via patients.search)
    let query = {};

    if(debouncedSearchFilter && debouncedSearchFilter.trim() !== ''){
      const trimmedFilter = debouncedSearchFilter.trim();

      // Check if this looks like a MongoDB ObjectID (24 hex characters) or FHIR ID
      const isObjectId = /^[a-f\d]{24}$/i.test(trimmedFilter);
      const isFhirId = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(trimmedFilter);

      if(isObjectId || isFhirId){
        // Exact match for IDs - handle both string and ObjectID formats
        query = {
          $or: [
            {'id': trimmedFilter},
            {'_id': trimmedFilter}
          ]
        };
      } else {
        // Regex search for other fields
        // Client-side query can use RegExp objects directly
        const searchRegex = new RegExp(debouncedSearchFilter, 'i');
        query = {
          $or: [
            {'id': {$regex: searchRegex}},
            {'_id': {$regex: searchRegex}},
            {'name.text': {$regex: searchRegex}},
            {'name.0.text': {$regex: searchRegex}},
            {'name.given': {$regex: searchRegex}},
            {'name.0.given': {$regex: searchRegex}},
            {'name.0.given.0': {$regex: searchRegex}},
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

    log.phi('PatientsDirectory client-side query', { query }, { action: 'search' });
    return Patients.find(query, { sort: { _id: -1 } }).fetch();
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
    console.log('Add Patient button clicked'); // phi-audit: ok
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
      console.log('Sample patient IDs from your database:'); // phi-audit: ok
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
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={function(event, newOrder) {
                  if (newOrder !== null) {
                    setSortOrder(newOrder);
                  }
                }}
                aria-label="sort order"
                size="small"
              >
                <ToggleButton value="ascending" aria-label="ascending order">
                  <ArrowUpwardIcon />
                </ToggleButton>
                <ToggleButton value="descending" aria-label="descending order">
                  <ArrowDownwardIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                value={[
                  showIdentifier && 'identifier',
                  showGender && 'gender',
                  showBirthSex && 'birthSex',
                  showActive && 'active',
                  showSystemId && 'systemId',
                  showFhirId && 'fhirId',
                  showAddress && 'address',
                  showDemographics && 'demographics'
                ].filter(Boolean)}
                onChange={function(event, newFormats) {
                  setShowIdentifier(newFormats.includes('identifier'));
                  setShowGender(newFormats.includes('gender'));
                  setShowBirthSex(newFormats.includes('birthSex'));
                  setShowActive(newFormats.includes('active'));
                  setShowSystemId(newFormats.includes('systemId'));
                  setShowFhirId(newFormats.includes('fhirId'));
                  setShowAddress(newFormats.includes('address'));
                  setShowDemographics(newFormats.includes('demographics'));
                }}
                aria-label="column visibility"
                size="small"
              >
                <ToggleButton value="identifier" aria-label="show identifier">
                  <NumbersIcon />
                </ToggleButton>
                <ToggleButton value="gender" aria-label="show gender">
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚤</span>
                </ToggleButton>
                <ToggleButton value="birthSex" aria-label="show birth sex">
                  <WcIcon />
                </ToggleButton>
                <ToggleButton value="active" aria-label="show active status">
                  <CheckCircleIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system ID">
                  <BadgeIcon />
                </ToggleButton>
                <ToggleButton value="fhirId" aria-label="show FHIR ID">
                  <FingerprintIcon />
                </ToggleButton>
                <ToggleButton value="address" aria-label="show address columns">
                  <LocationCityIcon />
                </ToggleButton>
                <ToggleButton value="demographics" aria-label="show demographics">
                  <PeopleIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddPatient}
              >
                Add Patient
              </Button>
            </Box>
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
                  <SearchIcon sx={{ color: cardTextColor }} />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: cardBgColor,
              '& .MuiInputBase-root': { color: cardTextColor },
              '& .MuiInputBase-input': { color: cardTextColor },
              '& .MuiInputBase-input::placeholder': {
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                opacity: 1
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
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
  if(subscriptionError){
    layoutContent = (
      <Alert severity="error" sx={{ mt: 2 }}>
        {subscriptionError}
      </Alert>
    );
  } else if(data.patients.length > 0){
    layoutContent = <Card
      sx={{
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: cardBgColor,
        color: cardTextColor,
        '& .MuiTableCell-root': {
          color: cardTextColor,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
        },
        '& .MuiTableCell-head': {
          backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
          color: cardTextColor,
          fontWeight: 600
        }
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
            log.debug('onTableRowClick', { patientId });

            // Find patient by either id or _id
            let patient = Patients.findOne({id: patientId});
            if(!patient) {
              patient = Patients.findOne({_id: patientId});
            }
            
            log.phi('Found patient', patient, { action: 'read' });
            
            // Set both the FHIR id and the full patient object
            if(patient) {
              const fhirId = patient.id;
              const mongoId = patient._id && patient._id._str ? patient._id._str : patient._id;
              Session.set('selectedPatientId', fhirId);  // Store FHIR id for queries
              Session.set('selectedPatientMongoId', mongoId);  // Store MongoDB id if needed
              Session.set('selectedPatient', patient);
              console.log('Set selectedPatientId (FHIR) to:', fhirId); // phi-audit: ok
              log.debug('Set selectedPatientMongoId', { mongoId });
              log.phi('Set selectedPatient', patient, { action: 'read' });
            } else {
              log.error('Could not find patient with id', { patientId });
            }

            console.log('openUrlOnRowClick', get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', '')) // phi-audit: ok
            if(get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick')){
              // Navigate to patient chart when View Chart is clicked
              const targetUrl = get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', '/patient-chart');
              navigate(targetUrl);
            }
          }}
          onFhirOperations={function(patientId){
            log.debug('FHIR Operations for patient:', { patientId });
            // Navigate to FHIR operations page
            window.location.href = `/patient/${patientId}/fhir`;
          }}
          onSetPage={function(index){
            Session.set('PatientsTable.patientsIndex', index)
          }}        
          page={data.patientsIndex}
          logger={window.logger ? window.logger : null}
          size="medium"
          onLaunchClick={function(patient){
            log.phi('Launch clicked for patient', patient, { action: 'read' });
            setLaunchPatient(patient);
            setLaunchModalOpen(true);
          }}
          order={sortOrder}
          hideIdentifier={!showIdentifier}
          hideGender={!showGender}
          hideBirthSex={!showBirthSex}
          hideActive={!showActive}
          hideSystemBarcode={!showSystemId}
          hideFhirBarcode={!showFhirId}
          hideCity={!showAddress}
          hideState={!showAddress}
          hidePostalCode={!showAddress}
          hideCountry={!showAddress}
          hideMaritalStatus={!showDemographics}
          hideLanguage={!showDemographics}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <FhirNoData
      resourceType="Patient"
      searchFilter={debouncedSearchFilter}
      onAdd={handleAddPatient}
      onClearSearch={handleAddPatient}
    />
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

      {/* Launch Apps Modal */}
      <LaunchAppsModal
        open={launchModalOpen}
        onClose={function() { setLaunchModalOpen(false); }}
        patient={launchPatient}
      />
    </Box>
  );
}


export default PatientsDirectory;


