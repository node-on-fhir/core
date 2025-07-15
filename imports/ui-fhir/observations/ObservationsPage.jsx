import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { 
  Grid, 
  Divider,
  Card,
  CardHeader,
  CardContent,
  Container,
  Button,
  Tab, 
  Tabs,
  Typography,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import ObservationDetail from './ObservationDetail';
import ObservationsTable from './ObservationsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get, has } from 'lodash'; 

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Observations = Meteor.Collections.Observations;
})

//=============================================================================================================================================
// COMPONENT

Session.setDefault('observationPageTabIndex', 1);
Session.setDefault('observationSearchFilter', '');
Session.setDefault('selectedObservationId', false);
Session.setDefault('selectedObservation', false)
Session.setDefault('ObservationsPage.onePageLayout', true)
Session.setDefault('ObservationsPage.defaultQuery', {})
Session.setDefault('ObservationsTable.hideCheckbox', true)
Session.setDefault('ObservationsTable.observationsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function ObservationsPage(props){
  const navigate = useNavigate();

  let data = {
    selectedObservationId: '',
    selectedObservation: null,
    observations: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    organizationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ObservationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ObservationsTable.hideCheckbox');
  }, [])
  data.selectedObservationId = useTracker(function(){
    return Session.get('selectedObservationId');
  }, [])
  data.selectedObservation = useTracker(function(){
    return Observations.findOne({_id: Session.get('selectedObservationId')});
  }, [])
  data.observations = useTracker(function(){
    return Observations.find().fetch();
  }, [])
  data.observationsIndex = useTracker(function(){
    return Session.get('ObservationsTable.observationsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  function onDeleteObservation(context){
    Observations._collection.remove({_id: get(context, 'state.observationId')}, function(error, result){
      if (error) {
        if(process.env.NODE_ENV === "test") console.log('Observations.insert[error]', error);
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        Session.set('selectedObservationId', false);
        HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Observations", recordId: context.state.observationId});
        // Bert.alert('Observation removed!', 'success');
      }
    });
    Session.set('observationPageTabIndex', 1);
  }
  function onUpsertObservation(context){
    //if(process.env.NODE_ENV === "test") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Observation...', context.state)

    if(get(context, 'state.observation')){
      let self = context;
      let fhirObservationData = Object.assign({}, get(context, 'state.observation'));
  
      // if(process.env.NODE_ENV === "test") console.log('fhirObservationData', fhirObservationData);
  
      let observationValidator = ObservationSchema.newContext();
      // console.log('observationValidator', observationValidator)
      observationValidator.validate(fhirObservationData)
  
      if(process.env.NODE_ENV === "development"){
        console.log('IsValid: ', observationValidator.isValid())
        console.log('ValidationErrors: ', observationValidator.validationErrors());
  
      }
  
      console.log('Checking context.state again...', context.state)
      if (get(context, 'state.observationId')) {
        if(process.env.NODE_ENV === "development") {
          console.log("Updating observation...");
        }

        delete fhirObservationData._id;
  
        // not sure why we're having to respecify this; fix for a bug elsewhere
        fhirObservationData.resourceType = 'Observation';
  
        Observations._collection.update({_id: get(context, 'state.observationId')}, {$set: fhirObservationData }, function(error, result){
          if (error) {
            if(process.env.NODE_ENV === "test") console.log("Observations.insert[error]", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Observations", recordId: context.state.observationId});
            Session.set('selectedObservationId', false);
            Session.set('observationPageTabIndex', 1);
            // Bert.alert('Observation added!', 'success');
          }
        });
      } else {
        // if(process.env.NODE_ENV === "test") 
        console.log("Creating a new observation...", fhirObservationData);
  
        fhirObservationData.effectiveDateTime = new Date();
        Observations._collection.insert(fhirObservationData, function(error, result) {
          if (error) {
            if(process.env.NODE_ENV === "test")  console.log('Observations.insert[error]', error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Observations", recordId: context.state.observationId});
            Session.set('observationPageTabIndex', 1);
            Session.set('selectedObservationId', false);
            // Bert.alert('Observation added!', 'success');
          }
        });
      }
    } 
    Session.set('observationPageTabIndex', 1);
  }
  function onTableRowClick(observationId){
    Session.set('selectedObservationId', observationId);
    Session.set('selectedPatient', Observations.findOne({_id: observationId}));
  }
  function onTableCellClick(id){
    Session.set('observationsUpsert', false);
    Session.set('selectedObservationId', id);
    Session.set('observationPageTabIndex', 2);
  }
  function tableActionButtonClick(_id){
    let observation = Observations.findOne({_id: _id});

    // console.log("ObservationTable.onSend()", observation);

    var httpEndpoint = "http://localhost:8080";
    if (get(Meteor, 'settings.public.interfaces.default.channel.endpoint')) {
      httpEndpoint = get(Meteor, 'settings.public.interfaces.default.channel.endpoint');
    }
    HTTP.post(httpEndpoint + '/Observation', {
      data: observation
    }, function(error, result){
      if (error) {
        console.log("error", error);
      }
      if (result) {
        console.log("result", result);
      }
    });
  }
  function onRemove(observationId){
    Session.set('observationPageTabIndex', 1);
    Session.set('selectedObservationId', false);
    HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Observations", recordId: observationId});
  }

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let cardWidth = window.innerWidth - paddingWidth;


  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  // let [observationsIndex, setObservationsIndex] = setState(0);

  function handleAddObservation(){
    console.log('Add Observation button clicked');
    navigate('/observations/new');
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Observations
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.observations.length} observations found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddObservation}
            >
              Add Observation
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.observations.length > 0){
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
        <ObservationsTable 
          formFactorLayout={formFactor}
          observations={ data.observations }
          count={ data.observations.length }
          rowsPerPage={LayoutHelpers.calcTableRows()}
          actionButtonLabel="Send"
          onRowClick={ onTableRowClick }
          onCellClick={ onTableCellClick }
          onActionButtonClick={tableActionButtonClick}
          onRemoveRecord={ onDeleteObservation }
          onSetPage={function(index){
            Session.set('ObservationsTable.observationsIndex', index)
          }}  
          page={data.observationsIndex}                              
          tableRowSize="medium"
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
            onClick={handleAddObservation}
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
            Add Your First Observation
          </Button>
        </CardContent>
      </Card>
    </Box>
  }


  return (
    <Box 
      id="observationsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.observations.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}


export default ObservationsPage;