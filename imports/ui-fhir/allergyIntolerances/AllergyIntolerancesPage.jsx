// /imports/ui-fhir/allergyIntolerances/AllergyIntolerancesPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  ToggleButton,
  ToggleButtonGroup,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import AllergyIntoleranceDetail from './AllergyIntoleranceDetail';
import AllergyIntolerancesTable from './AllergyIntolerancesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// LOGGER

const logger = {
  debug: console.debug.bind(console),
  trace: console.trace.bind(console),
  data: console.log.bind(console),
  verbose: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

//=============================================================================================================================================
// DATA CURSORS

// Import the collection directly to avoid timing issues
import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedAllergyIntoleranceId', false);


Session.setDefault('allergyIntolerancePageTabIndex', 1); 
Session.setDefault('allergyIntoleranceSearchFilter', ''); 
Session.setDefault('selectedAllergyIntoleranceId', false);
Session.setDefault('selectedAllergyIntolerance', false)
Session.setDefault('AllergyIntolerancesPage.onePageLayout', true)
Session.setDefault('AllergyIntolerancesPage.defaultQuery', {})
Session.setDefault('AllergyIntolerancesTable.hideCheckbox', true)
Session.setDefault('AllergyIntolerancesTable.allergyIntolerancesIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function AllergyIntolerancesPage(props){
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sortOrder, setSortOrder] = useState('descending');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Subscribe to Patients data for patient context
  const patientsReady = useTracker(() => {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('selectedPatient.Patients', Session.get('selectedPatientId'), { limit: 1000 });
      return handle.ready();
    } else {
      const handle = Meteor.subscribe('patients.search', {});
      return handle.ready();
    }
  }, []);
  
  // Clean up debug flag on unmount and check for patient context
  useEffect(() => {
    if (!patientsReady) return;
    
    // Check if we have a selected patient when component mounts
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    console.log('AllergyIntolerancesPage mounted - selectedPatientId:', selectedPatientId);
    console.log('AllergyIntolerancesPage mounted - selectedPatient:', selectedPatient);
    console.log('Patients subscription ready:', patientsReady);
    
    // If we have a patient ID but no patient object, try to restore it
    if (selectedPatientId && !selectedPatient) {
      const patient = Patients.findOne({_id: selectedPatientId});
      if (patient) {
        Session.set('selectedPatient', patient);
        console.log('Restored selectedPatient from ID:', patient);
      } else {
        console.log('Could not find patient with ID:', selectedPatientId);
      }
    }
    
    return () => {
      Session.set('AllergyIntolerancesPage.debugLogged', false);
      Session.set('AllergyIntolerancesPage.collectionDebugLogged', false);
    };
  }, [patientsReady]);

  // Subscribe to AllergyIntolerances data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    // Use FhirUtilities to build the query - it handles all reference formats
    let query = {};
    
    // If we have a patient selected, filter by that patient
    // FHIR resources reference patients by their FHIR id, not MongoDB _id
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        // Use the FHIR id as primary search
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        // Fallback to MongoDB _id if no FHIR id available
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }
    
    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      query = {
        $and: [
          query,
          {
            $or: [
              {'_id': searchFilter},
              {'id': searchFilter},
              {'code.text': {$regex: searchFilter, $options: 'i'}},
              {'code.coding.0.display': {$regex: searchFilter, $options: 'i'}},
              {'patient.display': {$regex: searchFilter, $options: 'i'}},
              {'reaction.0.manifestation.0.text': {$regex: searchFilter, $options: 'i'}}
            ]
          }
        ]
      };
    }
    
    console.log('AllergyIntolerances subscription - selectedPatientId:', selectedPatientId);
    console.log('AllergyIntolerances subscription - FHIR id:', get(selectedPatient, 'id'));
    console.log('AllergyIntolerances subscription - MongoDB _id:', get(selectedPatient, '_id'));
    console.log('AllergyIntolerances subscription query:', JSON.stringify(query, null, 2));
    
    // Debug what's in the collection
    if (!Session.get('AllergyIntolerancesPage.collectionDebugLogged')) {
      Session.set('AllergyIntolerancesPage.collectionDebugLogged', true);
      const allAllergies = AllergyIntolerances.find({}).fetch();
      console.log('Total AllergyIntolerances in collection:', allAllergies.length);
      if (allAllergies.length > 0) {
        console.log('First allergy patient reference:', get(allAllergies[0], 'patient'));
      }
    }
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.AllergyIntolerances', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.AllergyIntolerances', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    currentAllergyIntoleranceId: '',
    selectedAllergyIntolerance: null,
    allergyIntolerances: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    allergyIntolerancesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('AllergyIntolerancesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('AllergyIntolerancesTable.hideCheckbox');
  }, [])
  data.selectedAllergyIntoleranceId = useTracker(function(){
    return Session.get('selectedAllergyIntoleranceId');
  }, [])
  data.selectedAllergyIntolerance = useTracker(function(){
    return AllergyIntolerances.findOne({_id: Session.get('selectedAllergyIntoleranceId')});
  }, [])
  data.allergyIntolerances = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    // Use FHIR id for filtering, as that's what FHIR resources reference
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};
    
    // Only do debug logging once when component mounts
    if(!Session.get('AllergyIntolerancesPage.debugLogged')) {
      Session.set('AllergyIntolerancesPage.debugLogged', true);
      
      console.log('AllergyIntolerances data - MongoDB _id:', selectedPatientId);
      console.log('AllergyIntolerances data - FHIR id:', fhirId);
      console.log('AllergyIntolerances data - Using ID for query:', patientIdToUse);
      console.log('AllergyIntolerances data - query:', query);
      
      // First check all allergies
      const allAllergies = AllergyIntolerances.find().fetch();
      console.log('Total AllergyIntolerances in client collection:', allAllergies.length);
      
      // Log first few allergies to see their structure
      if(allAllergies.length > 0) {
        console.log('Sample AllergyIntolerance structure:', allAllergies[0]);
        console.log('First 3 patient references:');
        allAllergies.slice(0, 3).forEach(a => {
          console.log('- _id:', a._id, 'patient:', get(a, 'patient'), 'subject:', get(a, 'subject'));
        });
      }
    }
    
    const results = AllergyIntolerances.find(query).fetch();
    return results;
  }, [])
  data.allergyIntolerancesIndex = useTracker(function(){
    return Session.get('AllergyIntolerancesTable.allergyIntolerancesIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddAllergyIntolerance(){
    console.log('Add Allergy Intolerance button clicked');
    navigate('/allergy-intolerances/new');
  }

  function handleSortOrderChange(event, newOrder){
    if(newOrder !== null){
      setSortOrder(newOrder);
    }
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Allergy Intolerances
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.allergyIntolerances.length} allergy intolerances found
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={handleSortOrderChange}
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
                  showPatientName && 'patientName',
                  showPatientReference && 'patientReference',
                  showSystemId && 'systemId'
                ].filter(Boolean)}
                onChange={(event, newFormats) => {
                  setShowPatientName(newFormats.includes('patientName'));
                  setShowPatientReference(newFormats.includes('patientReference'));
                  setShowSystemId(newFormats.includes('systemId'));
                }}
                aria-label="display options"
                size="small"
              >
                <ToggleButton value="patientName" aria-label="show patient name">
                  <PersonIcon />
                </ToggleButton>
                <ToggleButton value="patientReference" aria-label="show patient reference">
                  <CodeIcon />
                </ToggleButton>
                <ToggleButton value="systemId" aria-label="show system id">
                  <BadgeIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddAllergyIntolerance}
              >
                Add Allergy
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              id="allergyIntoleranceSearchInput"
              fullWidth
              placeholder="Search allergy intolerances by ID, code, patient name, or reaction..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.allergyIntolerances.length > 0){
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
        <AllergyIntolerancesTable 
          id='allergyIntolerancesTable'
          allergyIntolerances={data.allergyIntolerances}
          count={data.allergyIntolerances.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hidePatientDisplay={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.AllergyIntolerances.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            AllergyIntolerances._collection.remove({_id: selectedId})
          }}
          onRowClick={function(allergyIntoleranceId){
            navigate('/allergy-intolerances/' + allergyIntoleranceId);
          }}
          onSetPage={function(index){
            Session.set('AllergyIntolerancesTable.allergyIntolerancesIndex', index)
          }}        
          page={data.allergyIntolerancesIndex}
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
              {get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")}
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
              {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor. To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries. If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddAllergyIntolerance}
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
            Add Your First Allergy
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="allergyIntolerancesPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default AllergyIntolerancesPage;