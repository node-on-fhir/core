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
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import BadgeIcon from '@mui/icons-material/Badge'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import ConditionDetail from './ConditionDetail';
import ConditionsTable from './ConditionsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

const log = (Meteor.Logger ? Meteor.Logger.for('ConditionsPage') : console);

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedConditionId', false);


Session.setDefault('conditionPageTabIndex', 1); 
Session.setDefault('conditionSearchFilter', ''); 
Session.setDefault('selectedConditionId', false);
Session.setDefault('selectedCondition', false)
Session.setDefault('ConditionsPage.onePageLayout', true)
Session.setDefault('ConditionsPage.defaultQuery', {})
Session.setDefault('ConditionsTable.hideCheckbox', true)
Session.setDefault('ConditionsTable.conditionsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ConditionsPage(props){
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('descending');
  const [searchParams] = useSearchParams();
  const [searchFilter, setSearchFilter] = useState('');
  const [showPatientName, setShowPatientName] = useState(false);
  const [showPatientReference, setShowPatientReference] = useState(false);
  const [showSystemId, setShowSystemId] = useState(false);
  
  // Clean up debug flag on unmount
  useEffect(() => {
    return () => {
      Session.set('ConditionsPage.debugLogged', false);
    };
  }, []);

  // Subscribe to conditions data
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
              {'subject.display': {$regex: searchFilter, $options: 'i'}},
              {'asserter.display': {$regex: searchFilter, $options: 'i'}},
              {'notes': {$regex: searchFilter, $options: 'i'}}
            ]
          }
        ]
      };
    }
    
    log.debug('Conditions subscription - selectedPatientId:', { selectedPatientId });
    log.debug('Conditions subscription - FHIR id:', { fhirId: get(selectedPatient, 'id') });
    console.log('Conditions subscription query:', query);
    
    if(autoSubscribeEnabled){
      const handle = Meteor.subscribe('autopublish.Conditions', query, { limit: 1000 });
      return !handle.ready();
    } else {
      const handle = Meteor.subscribe('selectedPatient.Conditions', Session.get('selectedPatientId'), { limit: 1000 });
      return !handle.ready();
    }
  }, [Session.get('selectedPatientId'), searchFilter]);

  let data = {
    currentConditionId: '',
    selectedCondition: null,
    conditions: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    conditionsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ConditionsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ConditionsTable.hideCheckbox');
  }, [])
  data.selectedConditionId = useTracker(function(){
    return Session.get('selectedConditionId');
  }, [])
  data.selectedCondition = useTracker(function(){
    return Conditions.findOne({_id: Session.get('selectedConditionId')});
  }, [])
  data.conditions = useTracker(function(){
    const selectedPatientId = Session.get('selectedPatientId');
    const selectedPatient = Session.get('selectedPatient');
    
    // Use FHIR id for filtering, as that's what FHIR resources reference
    const fhirId = get(selectedPatient, 'id');
    const patientIdToUse = fhirId || selectedPatientId;
    
    const query = patientIdToUse ? FhirUtilities.addPatientFilterToQuery(patientIdToUse) : {};
    
    // Only do debug logging once when component mounts
    if(!Session.get('ConditionsPage.debugLogged')) {
      Session.set('ConditionsPage.debugLogged', true);
      
      log.debug('Conditions data - MongoDB _id:', { selectedPatientId });
      console.log('Conditions data - FHIR id:', fhirId);
      log.debug('Conditions data - Using ID for query:', { patientIdToUse });
      console.log('Conditions data - query:', query);
      
      // First check all conditions
      const allConditions = Conditions.find().fetch();
      console.log('Total Conditions in client collection:', allConditions.length);
      
      // Log first few conditions to see their structure
      if(allConditions.length > 0) {
        console.log('Sample Condition structure:', allConditions[0]);
        console.log('First 3 patient references:'); // phi-audit: ok
        allConditions.slice(0, 3).forEach(c => {
          log.phi('- _id/patient/subject debug:', { id: c._id, patient: get(c, 'patient'), subject: get(c, 'subject') }, { action: 'read' });
        });
      }
    }
    
    // Sort by _id descending to get newest first
    // MongoDB ObjectIDs contain timestamp, so sorting by _id gives chronological order
    const results = Conditions.find(query, { sort: { _id: -1 } }).fetch();
    return results;
  }, [])
  data.conditionsIndex = useTracker(function(){
    return Session.get('ConditionsTable.conditionsIndex')
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

  function handleAddCondition(){
    console.log('Add Condition button clicked');
    navigate('/conditions/new');
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
              Conditions
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.conditions.length} conditions found
            </Typography>
          </Grid>
          <Grid item>
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
                onClick={handleAddCondition}
              >
                Add Condition
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <TextField
              id="conditionSearchInput"
              fullWidth
              placeholder="Search conditions by ID, code, patient name, asserter, or notes..."
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
  if(data.conditions.length > 0){
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
        <ConditionsTable 
          id='conditionsTable'
          conditions={data.conditions}
          count={data.conditions.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideAsserterName={false}
          hideClinicalStatus={true}
          hideEvidence={true}
          hidePatientName={!showPatientName}
          hidePatientReference={!showPatientReference}
          hideBarcode={!showSystemId}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Conditions.hideRemoveButtonOnTable', true)}
          order={sortOrder}
          onActionButtonClick={function(selectedId){
            Conditions.remove({_id: selectedId})
          }}
          onRowClick={function(conditionId){
            console.log('ConditionsPage.onRowClick', conditionId);
            navigate('/conditions/' + conditionId);
          }}
          onSetPage={function(index){
            Session.set('ConditionsTable.conditionsIndex', index)
          }}        
          page={data.conditionsIndex}
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
            onClick={handleAddCondition}
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
            Add Your First Condition
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="conditionsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.conditions.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}



export default ConditionsPage;
