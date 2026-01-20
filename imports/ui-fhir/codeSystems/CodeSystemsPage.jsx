import { 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Typography,
  Box,
  Grid 
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import CodeSystemDetail from './CodeSystemDetail';
import CodeSystemsTable from './CodeSystemsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';


import { get, cloneDeep } from 'lodash';

import { CodeSystems } from '../../lib/schemas/SimpleSchemas/CodeSystems';



//=============================================================================================================================================
// GLOBAL THEMING

import { MuiThemeProvider, createTheme } from '@mui/material/styles';

// This is necessary for the Material UI component render layer
let theme = {
  primaryColor: "rgb(177, 128, 13)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(177, 128, 13)",
  secondaryText: "rgba(255, 255, 255, 1) !important",

  cardColor: "rgba(255, 255, 255, 1) !important",
  cardTextColor: "rgba(0, 0, 0, 1) !important",

  errorColor: "rgb(128,20,60) !important",
  errorText: "#ffffff !important",

  appBarColor: "#f5f5f5 !important",
  appBarTextColor: "rgba(0, 0, 0, 1) !important",

  paperColor: "#f5f5f5 !important",
  paperTextColor: "rgba(0, 0, 0, 1) !important",

  backgroundCanvas: "rgba(255, 255, 255, 1) !important",
  background: "linear-gradient(45deg, rgb(177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

  nivoTheme: "greens"
}

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}

const muiTheme = createTheme({
  typography: {
    useNextVariants: true,
  },
  palette: {
    primary: {
      main: theme.primaryColor,
      contrastText: theme.primaryText
    },
    secondary: {
      main: theme.secondaryColor,
      contrastText: theme.errorText
    },
    appBar: {
      main: theme.appBarColor,
      contrastText: theme.appBarTextColor
    },
    cards: {
      main: theme.cardColor,
      contrastText: theme.cardTextColor
    },
    paper: {
      main: theme.paperColor,
      contrastText: theme.paperTextColor
    },
    error: {
      main: theme.errorColor,
      contrastText: theme.secondaryText
    },
    background: {
      default: theme.backgroundCanvas
    },
    contrastThreshold: 3,
    tonalOffset: 0.2
  }
});


//---------------------------------------------------------------
// Session Variables


Session.setDefault('codeSystemPageTabIndex', 0);
Session.setDefault('codeSystemSearchFilter', '');
Session.setDefault('selectedCodeSystemId', '');
Session.setDefault('selectedCodeSystem', false);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('codeSystemsArray', []);
Session.setDefault('CodeSystemsPage.onePageLayout', true)
Session.setDefault('CodeSystemsTable.hideCheckbox', true)
Session.setDefault('CodeSystemsTable.codeSystemsPageIndex', 0)

Session.setDefault('codeSystemChecklistMode', false)


//===========================================================================
// MAIN COMPONENT  


export function CodeSystemsPage(props){


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  

  let data = {
    selectedAuditEventId: '',
    selectedAuditEvent: null,
    codeSystems: [],
    onePageLayout: true,
    codeSystemSearchFilter: '',
    hideCheckbox: true,
    options: {
      sort: {
        'focus.display': -1,
        lastModified: -1
      }
    },
    codeSystemChecklistMode: false
  };

  

  data.hideCheckbox = useTracker(function(){
    return Session.get('CodeSystemsTable.hideCheckbox');
  }, [])
  data.onePageLayout = useTracker(function(){
    return Session.get('CodeSystemsPage.onePageLayout');
  }, [])
  data.selectedCodeSystemId = useTracker(function(){
    return Session.get('selectedCodeSystemId');
  }, [])
  data.selectedCodeSystem = useTracker(function(){
    return AuditEvents.findOne(Session.get('selectedCodeSystemId'));
  }, [])
  data.codeSystems = useTracker(function(){
    let results = [];
    if(Session.get('codeSystemChecklistMode')){
      results = CodeSystems.find({
        'focus.display': "Patient Correction"
      }, {
        limit: 10,
        sort: {lastModified: -1}
      }).fetch();      
    } else {
      results = CodeSystems.find().fetch();
    }

    return results;
  }, [])
  data.codeSystemSearchFilter = useTracker(function(){
    return Session.get('codeSystemSearchFilter')
  }, [])
  data.codeSystemChecklistMode = useTracker(function(){
    return Session.get('codeSystemChecklistMode')
  }, [])
  data.codeSystemsPageIndex = useTracker(function(){
    return Session.get('CodeSystemsTable.codeSystemsPageIndex')
  }, [])


  function setCodeSystemsPageIndex(newIndex){
    Session.set('CodeSystemsTable.codeSystemsPageIndex', newIndex)
  }
  function onCancelUpsertCodeSystem(context){
    Session.set('codeSystemPageTabIndex', 1);
  }
  function onDeleteCodeSystem(context){
    CodeSystems._collection.remove({_id: get(context, 'state.codeSystemId')}, function(error, result){
      if (error) {
        if(process.env.NODE_ENV === "test") console.log('CodeSystems.insert[error]', error);
        Bert.alert(error.reason, 'danger');
      }
      if (result) {
        Session.set('selectedCodeSystemId', '');
        HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "CodeSystems", recordId: context.state.codeSystemId});        
      }
    });
    Session.set('codeSystemPageTabIndex', 1);
  }
  function onUpsertCodeSystem(context){
    //if(process.env.NODE_ENV === "test") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new CodeSystem...', context.state)

    if(get(context, 'state.codeSystem')){
      let self = context;
      let fhirCodeSystemData = Object.assign({}, get(context, 'state.codeSystem'));
  
      // if(process.env.NODE_ENV === "test") console.log('fhirCodeSystemData', fhirCodeSystemData);
  
      let codeSystemValidator = CodeSystemSchema.newContext();
      // console.log('codeSystemValidator', codeSystemValidator)
      codeSystemValidator.validate(fhirCodeSystemData)
  
      if(process.env.NODE_ENV === "development"){
        console.log('IsValid: ', codeSystemValidator.isValid())
        console.log('ValidationErrors: ', codeSystemValidator.validationErrors());
  
      }
  
      console.log('Checking context.state again...', context.state)
      if (get(context, 'state.codeSystemId')) {
        if(process.env.NODE_ENV === "development") {
          console.log("Updating codeSystem...");
        }

        delete fhirCodeSystemData._id;
  
        // not sure why we're having to respecify this; fix for a bug elsewhere
        fhirCodeSystemData.resourceType = 'CodeSystem';
  
        CodeSystems._collection.update({_id: get(context, 'state.codeSystemId')}, {$set: fhirCodeSystemData }, function(error, result){
          if (error) {
            if(process.env.NODE_ENV === "test") console.log("CodeSystems.insert[error]", error);
          
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "CodeSystems", recordId: context.state.codeSystemId});
            Session.set('selectedCodeSystemId', '');
            Session.set('codeSystemPageTabIndex', 1);
          }
        });
      } else {
        // if(process.env.NODE_ENV === "test") 
        console.log("Creating a new codeSystem...", fhirCodeSystemData);
  
        fhirCodeSystemData.effectiveDateTime = new Date();
        CodeSystems._collection.insert(fhirCodeSystemData, function(error, result) {
          if (error) {
            if(process.env.NODE_ENV === "test")  console.log('CodeSystems.insert[error]', error);           
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "CodeSystems", recordId: context.state.codeSystemId});
            Session.set('codeSystemPageTabIndex', 1);
            Session.set('selectedCodeSystemId', '');
          }
        });
      }
    } 
    Session.set('codeSystemPageTabIndex', 1);
  }
  function handleRowClick(codeSystemId, foo, bar){
    console.log('CodeSystemsPage.handleRowClick', codeSystemId)
    let codeSystem = CodeSystems.findOne({id: codeSystemId});

    if(codeSystem){
      Session.set('selectedCodeSystemId', get(codeSystem, 'id'));
      Session.set('selectedCodeSystem', codeSystem);
      Session.set('CodeSystem.Current', codeSystem);
      
      let showModals = true;
      if(showModals){
        Session.set('mainAppDialogOpen', true);
        Session.set('mainAppDialogComponent', "CodeSystemDetail");
        Session.set('mainAppDialogMaxWidth', "sm");
        if(Meteor.currentUserId()){
          Session.set('mainAppDialogTitle', "Edit Code System");
        } else {
          Session.set('mainAppDialogTitle', "View Code System");
        }
      }      
    }
  }
  function onInsert(codeSystemId){
    Session.set('selectedCodeSystemId', '');
    Session.set('codeSystemPageTabIndex', 1);
    HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "CodeSystems", recordId: codeSystemId});
  }
  function onCancel(){
    Session.set('codeSystemPageTabIndex', 1);
  } 
  function handleChange(event, newValue) {
    Session.set('codeSystemPageTabIndex', newValue)
  }


  let layoutContents;
  if(data.codeSystems.length > 0){
    if(data.onePageLayout){
      layoutContents = <Card height="auto" margin={20} scrollable >
        <CardHeader title={data.codeSystems.length + " Code Systems"} />
          <CardContent>
            <CodeSystemsTable 
              formFactorLayout={formFactor}  
              codeSystems={ data.codeSystems }
              count={data.codeSystems.length}
              hideCheckbox={data.hideCheckbox}
              hideStatus={false}
              hideName={false}
              hideTitle={false}
              hideVersion={false}
              hideExperimental={false}
              paginationLimit={10}    
              onRowClick={ handleRowClick.bind(this) } 
              checklist={data.codeSystemChecklistMode}
              rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
              onSetPage={function(index){
                setCodeSystemsPageIndex(index)
              }}    
              page={data.codeSystemsPageIndex}
              size="small"
            />
          </CardContent>
        </Card>
    } else {
      layoutContents = <Grid container spacing={3}>
        <Grid item lg={6}>
          <Card height="auto" margin={20} >
            <CardHeader title={data.codeSystems.length + " Code Systems"} />
            <CardContent>
              <CodeSystemsTable 
                formFactorLayout={formFactor}  
                codeSystems={ data.codeSystems }
                count={data.codeSystems.length}
                selectedCodeSystemId={ data.selectedCodeSystemId }
                hideIdentifier={true} 
                hideCheckbox={data.hideCheckbox}
                hideActionIcons={true}
                hideStatus={false}
                hideName={false}
                hideTitle={false}
                hideVersion={false}
                hideExperimental={false}    
                hideBarcode={true}
                onRowClick={ handleRowClick.bind(this) }
                rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
                onSetPage={function(index){
                  setCodeSystemsPageIndex(index)
                }}  
                page={data.codeSystemsPageIndex}
                size="medium"
                />
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={4}>
          <Card height="auto" margin={20} scrollable>
            <h1 className="barcode" style={{fontWeight: 100}}>{data.selectedCodeSystemId }</h1>
            {/* <CardHeader title={data.selectedCodeSystemId } className="helveticas barcode" /> */}
            <CardContent>
              <CardContent>
                <CodeSystemDetail 
                  id='codeSystemDetails'                 
                  displayDatePicker={true} 
                  displayBarcodes={false}
                  codeSystem={ data.selectedCodeSystem }
                  codeSystemId={ data.selectedCodeSystemId } 
                  showCodeSystemInputs={true}
                  showHints={false}
                />
              </CardContent>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    }
  } else {
    layoutContents = <Container maxWidth="sm" style={{display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', height: '100%', justifyContent: 'center'}}>
      {/* <img src={Meteor.absoluteUrl() + noDataImage} style={{width: '100%'}}  /> */}
      <CardContent>
        <CardHeader 
          title={get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")} 
          subheader={get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor.  To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries.  If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")} 
        />
      </CardContent>
    </Container>
  }

  return (
    <div id="codeSystemsPage" style={{padding: "20px"}} >
      { layoutContents }
    </div>
  );
}


export default CodeSystemsPage;