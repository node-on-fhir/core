import React, { useState, useEffect, StrictMode } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { get, set, has, concat, pullAt } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Alert, Button, Grid, Box, MenuItem, Select, Card, CardMedia, CardHeader, CardContent, CardActions, Typography } from '@mui/material';


import { useLocation, useNavigate } from "react-router-dom";

import PractitionersTable from './PractitionersTable';



//====================================================================================
// Shared Components

let DynamicSpacer;
let useTheme;
let FhirUtilities;
let LayoutHelpers;

let ConditionsTable;
let PersonsTable;

Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
  FhirUtilities = Meteor.FhirUtilities;
  LayoutHelpers = Meteor.LayoutHelpers;
  useTheme = Meteor.useTheme;

  PersonsTable = Meteor.Tables.PersonsTable;
})


//====================================================================================
// Data Cursors



let Conditions;
let Patients;

Meteor.startup(async function(){
  Conditions = Meteor.Collections.Conditions;
  Patients = Meteor.Collections.Patients;
})

//====================================================================================
// Main Function  

function LeaderboardPage(props){
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  
  let searchParams = new URLSearchParams(window.location.search);

  let headerHeight = 84;
  if(get(Meteor, 'settings.public.defaults.prominantHeader')){
    headerHeight = 148;
  }  
  let isMobile = false
  if(window.innerWidth < 920){
      isMobile = true;
  }


  //----------------------------------------------------------------------
  // State Variables

  let [practitionersPage, setPersonsPage] = useState(0);
  let [practitioners, setPersons] = useState(true);


  //----------------------------------------------------------------------
  // Data Trackers

  let data = {
    allergyIntolerances: [],
    careTeams: [],
    carePlans: [],
    conditions: [],
    consents: [],
    devices: [],
    encounters: [],
    immunizations: [],
    locations: [],
    medications: [],
    observations: [],
    procedures: [],
    selectedPatientId: '',
    selectedPatient: null,
    patients: [],
    questionnaires: [],
    questionnaireResponses: [],
    basicQuery: {}
  }

  data.selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);
  data.selectedPatient = useTracker(function(){
      if(Session.get('selectedPatientId')){
          return Patients.findOne({id: Session.get('selectedPatientId')});
      } else if(get(Session.get('currentUser'), 'patientId')){
          return Patients.findOne({id: get(Session.get('currentUser'), 'patientId')});
      }   
  }, []);
  data.basicQuery = useTracker(function(){
    return FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'));
  }, []);



  useEffect(function(){
    Session.set('QuestionnaireResponsesPage.onePageLayout', false);
  }, [])


  
  //------------------------------------------------------------------------------------------------------
  // Data Cursors

  if(Conditions){
      data.practitioners = useTracker(function(){
        return Conditions.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])    
  }


  //----------------------------------------------------------------------
  // Functions

  function openLink(url){
    console.log("openLink", url);

    if(typeof Package["symptomatic:data-importer"] === "object"){
      navigate(url, {replace: true});
    } else {
      // TODO:  load Daniel_Gaitan directly      
    }
  }




  //----------------------------------------------------------------------
  // Cards

  let practitionersContent = [];

  practitionersContent.push(<Card>
    <CardHeader title={"Leaderboard"} />
    <CardContent>
      <PractitionersTable
          practitioners={data.practitioners}
          hideCheckbox={true}
          hideActionIcons={true}
          hidePatientName={true}
          hidePatientReference={true}
          hideAsserterName={true}
          hideEvidence={true}
          hideBarcode={true}
          hideDates={false}
          hideTextIcon={true}
          count={data.practitioners.length}
          page={practitionersPage}
          rowsPerPage={5}
          onSetPage={function(newPage){
              setPersonsPage(newPage);
          }}
      />                                        
    </CardContent>
    <CardActions>
      <Button size="small" color={practitioners ? "primary" : "inherit"} onClick={function(){
        setPersons(!practitioners);
      }}>Include: {practitioners ? "YES" : "NO"} </Button>
    </CardActions>
  </Card>)   
  practitionersContent.push(<DynamicSpacer />)              

  //----------------------------------------------------------------------
  // Page Styling and Layout

  let containerStyle = {
    marginBottom: '84px', 
    paddingBottom: '84px'
  }

  let pageStyle = {};

  if(window.innerWidth < 800){
    pageStyle.padingLeft = '0px !important';
    pageStyle.paddingRight = '0px !important';
  } else {
    pageStyle.padingLeft = '100px';
    pageStyle.paddingRight = '100px';
  }


  let relayOptions = [];
  let preprocessElements;
  let cardWidth = 4;
  let interfacesObject = get(Meteor, 'settings.public.interfaces');
  if(interfacesObject){
    Object.keys(interfacesObject).forEach(function(key, index){
      let interfaceKey = interfacesObject[key];
      if(has(interfaceKey, 'channel.endpoint') && (get(interfaceKey, 'status') === "active")){
        relayOptions.push(<MenuItem value={get(interfaceKey, 'channel.endpoint')} id={"relay-menu-item-" + index} key={"relay-menu-item-" + index} >{get(interfaceKey, 'name')}</MenuItem>)
      }
    });  
  } else {
    console.log('WARNING:  No interfaces defined!')
  }
  


  //----------------------------------------------------------------------
  // Page Content

  let patientChartContent = <div style={{marginBottom: '120px'}}>    
      {practitionersContent}           
    </div>                

  let nextUrl =  get(Meteor, 'settings.public.defaults.dataExporterNextPageUrl', '');
  if(searchParams.get('next')){
    nextUrl = "/" + searchParams.get('next');
  }

  if(searchParams.get('next')){
    nextPageElements = <div>
      <DynamicSpacer />
      <Button
        color="primary"
        variant="contained" 
        fullWidth
        onClick={openLink.bind(this, nextUrl)}
      >Next</Button> 
    </div>
  }

  //----------------------------------------------------------------------
  // Main Render Method  

  return (
    <div id='LeaderboardPage' style={{overflow: 'scroll', height: window.innerHeight, padding: '20px'}}>
        <Grid container spacing={3} justifyContent="center" style={{marginBottom: '80px'}}>
          <Grid item md={12} lg={8} style={{width: '100%'}}>
            
            <DynamicSpacer />
            { patientChartContent } 
          </Grid>
          { preprocessElements }   
        </Grid>
    </div>
  );
}

export default LeaderboardPage;