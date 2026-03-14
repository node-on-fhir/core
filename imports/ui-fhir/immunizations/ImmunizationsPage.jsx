// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/immunizations/ImmunizationsPage.jsx

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
  TextField,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge'; 
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ImmunizationsTable from './ImmunizationsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedImmunizationId', false);
Session.setDefault('immunizationPageTabIndex', 1); 
Session.setDefault('immunizationSearchFilter', ''); 
Session.setDefault('selectedImmunization', false);
Session.setDefault('ImmunizationsPage.onePageLayout', true);
Session.setDefault('ImmunizationsPage.defaultQuery', {});
Session.setDefault('ImmunizationsTable.hideCheckbox', true);
Session.setDefault('ImmunizationsTable.immunizationsIndex', 0);

//=============================================================================================================================================
// MAIN COMPONENT

export function ImmunizationsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchParams] = useSearchParams();
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('ImmunizationsPage.debugLogged', false);
    };
  }, []);

  // Subscribe to immunizations data
  const isLoading = useTracker(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    let query = {};
    
    // If we have a patient selected, filter by that patient
    if(selectedPatient || selectedPatientId) {
      const fhirId = get(selectedPatient, 'id');
      
      if(fhirId) {
        query = FhirUtilities.addPatientFilterToQuery(fhirId);
      } else if(selectedPatientId) {
        query = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      }
    }
    
    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'vaccineCode.text': {$regex: searchFilter, $options: 'i'}},
          {'vaccineCode.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'patient.display': {$regex: searchFilter, $options: 'i'}},
          {'lotNumber': {$regex: searchFilter, $options: 'i'}},
          {'manufacturer.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };
      
      // Combine with patient filter if exists
      if(query.$or) {
        query = { $and: [query, searchQuery] };
      } else {
        query = searchQuery;
      }
    }
    
    console.log('Immunizations subscription - selectedPatientId:', selectedPatientId);
    console.log('Immunizations subscription - FHIR id:', get(selectedPatient, 'id'));
    console.log('Immunizations subscription query:', query);
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Immunizations', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Immunizations', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    currentImmunizationId: '',
    selectedImmunization: null,
    immunizations: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    immunizationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ImmunizationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ImmunizationsTable.hideCheckbox');
  }, [])
  data.selectedImmunizationId = useTracker(function(){
    return Session.get('selectedImmunizationId');
  }, [])
  data.selectedImmunization = useTracker(function(){
    return Immunizations.findOne({_id: Session.get('selectedImmunizationId')});
  }, [])
  data.immunizations = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    // Use FHIR id for filtering
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    let query = {};
    
    if(patientIdToUse) {
      query = FhirUtilities.addPatientFilterToQuery(patientIdToUse);
    }
    
    // Add search filter if present
    if(searchFilter && searchFilter.length > 0) {
      const searchQuery = {
        $or: [
          {'_id': searchFilter},
          {'id': searchFilter},
          {'status': {$regex: searchFilter, $options: 'i'}},
          {'vaccineCode.text': {$regex: searchFilter, $options: 'i'}},
          {'vaccineCode.coding.0.display': {$regex: searchFilter, $options: 'i'}},
          {'patient.display': {$regex: searchFilter, $options: 'i'}},
          {'lotNumber': {$regex: searchFilter, $options: 'i'}},
          {'manufacturer.display': {$regex: searchFilter, $options: 'i'}}
        ]
      };
      
      // Combine with patient filter if exists
      if(query.$or) {
        query = { $and: [query, searchQuery] };
      } else {
        query = searchQuery;
      }
    }
    
    // Only do debug logging once when component mounts
    if(!Session.get('ImmunizationsPage.debugLogged')) {
      Session.set('ImmunizationsPage.debugLogged', true);
      
      console.log('Immunizations data - MongoDB _id:', selectedPatientId);
      console.log('Immunizations data - FHIR id:', fhirId);
      console.log('Immunizations data - Using ID for query:', patientIdToUse);
      console.log('Immunizations data - query:', query);
      
      // First check all immunizations
      const allImmunizations = Immunizations.find().fetch();
      console.log('Total Immunizations in client collection:', allImmunizations.length);
      
      // Log first few immunizations to see their structure
      if(allImmunizations.length > 0) {
        console.log('Sample Immunization structure:', allImmunizations[0]);
        console.log('First 3 patient references:');
        allImmunizations.slice(0, 3).forEach(i => {
          console.log('- _id:', i._id, 'patient:', get(i, 'patient'));
        });
      }
    }
    
    // Sort by _id descending to get newest first
    const results = Immunizations.find(query, { sort: { _id: -1 } }).fetch();
    return results;
  }, [searchFilter])
  data.immunizationsIndex = useTracker(function(){
    return Session.get('ImmunizationsTable.immunizationsIndex')
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

  function handleAddImmunization(){
    console.log('Add Immunization button clicked');
    navigate('/immunizations/new');
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
              Immunizations
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.immunizations.length} immunizations found
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={2} alignItems="center" justifyContent="flex-end">
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
                onClick={handleAddImmunization}
              >
                Add Immunization
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="immunizationSearchInput"
              fullWidth
              placeholder="Search immunizations by ID, vaccine, patient, lot number..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.immunizations.length > 0){
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
        <ImmunizationsTable 
          id='immunizationsTable'
          immunizations={data.immunizations}
          count={data.immunizations.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hidePatientDisplay={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Immunizations.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            Immunizations.remove({_id: selectedId})
          }}
          onRowClick={function(immunizationId){
            console.log('ImmunizationsPage.onRowClick', immunizationId);
            navigate('/immunizations/' + immunizationId);
          }}
          onSetPage={function(index){
            Session.set('ImmunizationsTable.immunizationsIndex', index)
          }}        
          page={data.immunizationsIndex}
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
            onClick={handleAddImmunization}
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
            Add Your First Immunization
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="immunizationsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.immunizations.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default ImmunizationsPage;