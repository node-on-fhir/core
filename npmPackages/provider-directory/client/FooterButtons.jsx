import React, { useState } from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from '../lib/httpClient';

import { 
    DialogActions,
    Button
} from '@mui/material';

import { get, has, isEqual } from 'lodash';
import JSON5 from 'json5';

import { useTracker } from 'meteor/react-meteor-data';
import { LayoutHelpers } from '/imports/lib/LayoutHelpers';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';

import moment from 'moment';

//========================================================================================================

import {
  fade,
  ThemeProvider,
  MuiThemeProvider,
  withStyles,
  makeStyles,
  createMuiTheme,
  useTheme
} from '@mui/material/styles';

  // Global Theming 
  // This is necessary for the Material UI component render layer
  let theme = {
    appBarColor: "#000000",
    appBarTextColor: "#ffffff"
  }

  // if we have a globally defined theme from a settings file
  if(get(Meteor, 'settings.public.theme.palette')){
    theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
  }

  const muiTheme = createMuiTheme({
    typography: {
      useNextVariants: true,
    },
    palette: {
      appBar: {
        main: theme.appBarColor,
        contrastText: theme.appBarTextColor
      },
      contrastThreshold: 3,
      tonalOffset: 0.2
    }
  });



//============================================================================================================================
// Shared Functions




//============================================================================================================================
// Shared Styles  

let buttonStyles = {
    west_button: {
      cursor: 'pointer',
      justifyContent: 'left',
      color: '#ffffff',
      marginLeft: '20px',
      marginTop: '5px',
      float: 'left',
      position: 'relative'
    },
    east_button: {
      cursor: 'pointer',
      justifyContent: 'right',
      color: '#ffffff',
      right: '20px',
      marginTop: '5px',
      float: 'right',
      position: 'relative'
    }
  }




//============================================================================================================================
// Turntable / Biosignature

export function VhDirFooterButtons(props){
  // const buttonClasses = buttonStyles();

  let {
    children,
    jsonContent,
    ...otherProps
  } = props;

  function togglePreferences(){
    Session.toggle('mainAppDialogOpen');

    Session.set('mainAppDialogComponent', "PreferencesDialog");
    Session.set('mainAppDialogTitle', "Preferences");
    Session.set('mainAppDialogMaxWidth', "sm");
  }
  function toggleSearchNlm(){
    Session.toggle('mainAppDialogOpen');

    Session.set('mainAppDialogComponent', "SearchLibraryOfMedicineDialog");
    Session.set('mainAppDialogTitle', "Search the National Library of Medicine");
    Session.set('mainAppDialogMaxWidth', "md");
  }


  return (
    <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
      <Button id="provider-directory-preferences-footer-btn" onClick={ togglePreferences.bind(this) } style={buttonStyles.west_button}>
        Preferences
      </Button>
      <Button id="provider-directory-search-nlm-footer-btn" onClick={ toggleSearchNlm.bind(this) } style={buttonStyles.west_button}>
        Search NLM
      </Button>
    </MuiThemeProvider>
  );
}


//============================================================================================================================
// Shared Functions


function toggleSelect(resourceType){
    Session.toggle(resourceType + 'sTable.hideCheckbox')
}
function toggleLayout(resourceType){
    Session.toggle(resourceType + 'sPage.onePageLayout')
}
function handleClose(){
    Session.set('mainAppDialogOpen', false)
}

//============================================================================================================================
// Shared Components

export function DefaultPostDialogActions(props){

    let { 
        children, 
        resourceType,
        relayUrl,
        ...otherProps 
    } = props;

    function handleSendRecord(){
        console.log('handleSendRecord', props);

        let relayUrl = get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', 'http://localhost:3000/baseR4')
        if(relayUrl){
            let currentCodeSystem = Session.get('CodeSystem.Current')
            let assembledUrl = relayUrl;
            if(has(currentCodeSystem, 'id')){
                assembledUrl = relayUrl + '/' + resourceType + '/' + get(currentCodeSystem, 'id');
                console.log('PUT ' + assembledUrl)
                HTTP.put(assembledUrl, {data: currentCodeSystem}, function(error, result){
                    if(error){
                        alert(JSON.stringify(error.message));
                    }
                    if(result){
                        Session.set('mainAppDialogOpen', false)
                    }
                })
            } else {
                assembledUrl = relayUrl + '/' + resourceType;
                console.log('POST ' + assembledUrl)
                HTTP.post(assembledUrl, {data: currentCodeSystem}, function(error, result){
                    if(error){
                        alert(JSON.stringify(error.message));
                    }
                    if(result){
                        Session.set('mainAppDialogOpen', false)
                    }
                })
            }    
        }
    }

    let actionsToRender;
    if(Meteor.currentUserId()){
        actionsToRender = <DialogActions >
            <Button onClick={handleClose} color="primary">
                Close
            </Button>
            <Button onClick={handleSendRecord.bind(this)} color="primary" variant="contained">
                Send
            </Button>
        </DialogActions>
    } else {
        actionsToRender = <DialogActions ></DialogActions>
    }
    
    

    return actionsToRender;
}

//============================================================================================================================
// Care Teams

export function CareTeamsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "CareTeamDetail");
        Session.set('mainAppDialogTitle', "New Team");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let buttonArray = [];

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-team-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
                New Team
            </Button>
            <Button id="provider-directory-toggle-select-care-team-footer-btn" onClick={ toggleSelect.bind(this, "CareTeam") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-care-team-footer-btn" onClick={ toggleLayout.bind(this, "CareTeam") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>     
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

  return (componentToRender);
}


//============================================================================================================================
// Code Systems

export function CodeSystemsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "CodeSystemDetail");
        Session.set('mainAppDialogTitle', "New Code System");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let buttonArray = [];

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-code-system-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
                New Code System
            </Button>
            <Button id="provider-directory-toggle-select-code-system-footer-btn" onClick={ toggleSelect.bind(this, "CodeSystem") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-code-system-footer-btn" onClick={ toggleLayout.bind(this, "CodeSystem") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>     
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

  return (componentToRender);
}


//============================================================================================================================
// Care Teams

export function CommunicationsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "CommunicationDetail");
        Session.set('mainAppDialogTitle', "New Communication");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let buttonArray = [];

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-communication-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
                New Communication
            </Button>
            <Button id="provider-directory-toggle-select-communication-footer-btn" onClick={ toggleSelect.bind(this, "Communication") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-communication-footer-btn" onClick={ toggleLayout.bind(this, "Communication") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>     
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

  return (componentToRender);
}



//============================================================================================================================
// Care Teams

export function CommunicationRequestsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "CommunicationRequestDetail");
        Session.set('mainAppDialogTitle', "New Communication Request");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let buttonArray = [];

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-communication-request-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
                New Communication Request
            </Button>
            <Button id="provider-directory-toggle-select-communication-request-footer-btn" onClick={ toggleSelect.bind(this, "CommunicationRequest") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-communication-request-footer-btn" onClick={ toggleLayout.bind(this, "CommunicationRequest") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>     
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

  return (componentToRender);
}



//============================================================================================================================
// Endpoints

export function EndpointsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "EndpointDetail");
        Session.set('mainAppDialogTitle', "New Endpoint");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-endpoint-footer-btn" onClick={ openDialog.bind(this, "Endpoint") } style={ buttonStyles.west_button }>
            New Endpoint
            </Button>
            <Button id="provider-directory-toggle-select-endpoint-footer-btn" onClick={ toggleSelect.bind(this, "Endpoint") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-endpoint-footer-btn" onClick={ toggleLayout.bind(this, "Endpoint") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }
  
    return (componentToRender);
  }


//============================================================================================================================
// Healthcare Services

export function HealthcareServicesFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "HealthcareServiceDetail");
        Session.set('mainAppDialogTitle', "New Service");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-service-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
                New Service
            </Button>
            <Button id="provider-directory-toggle-select-healthcare-service-footer-btn" onClick={ toggleSelect.bind(this, "HealthcareService") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-healthcare-service-footer-btn" onClick={ toggleLayout.bind(this, "HealthcareService") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }
  
    return (componentToRender);
}


//============================================================================================================================
// Insurance Plans

export function InsurancePlansFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "InsurancePlanDetail");
        Session.set('mainAppDialogTitle', "New Insurance Plan");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-plan-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Plan
            </Button>
            <Button id="provider-directory-toggle-select-insurance-plan-footer-btn" onClick={ toggleSelect.bind(this, "InsurancePlan") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-insurance-plan-footer-btn" onClick={ toggleLayout.bind(this, "InsurancePlan") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }
  
    return (componentToRender);
}

//============================================================================================================================
// Locations

export function LocationsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "LocationDetail");
        Session.set('mainAppDialogTitle', "New Location");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-location-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Location
            </Button>
            <Button id="provider-directory-toggle-select-location-footer-btn" onClick={ toggleSelect.bind(this, "Location") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-location-footer-btn" onClick={ toggleLayout.bind(this, "Location") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }
  
    return (componentToRender);
}


//============================================================================================================================
// Networks

export function NetworksFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "NetworkDetail");
        Session.set('mainAppDialogTitle', "New Network");
        Session.set('mainAppDialogMaxWidth', "md");
        // Session.set('mainAppDialogJson', {});        
    }

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-network-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
                New Network
            </Button>
            <Button id="provider-directory-toggle-select-network-footer-btn" onClick={ toggleSelect.bind(this, "Network") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-network-footer-btn" onClick={ toggleLayout.bind(this, "Network") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }
  
    return (componentToRender);
}

//============================================================================================================================
// Organizations


export function OrganizationsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "OrganizationDetail");
        Session.set('mainAppDialogTitle', "New Organization");
        Session.set('mainAppDialogMaxWidth', "md");
        // Session.set('mainAppDialogJson', {});        
    }
    function toggleFilters(){
        let defaultQuery = Session.get('OrganizationsPage.defaultQuery');

        if(isEqual(defaultQuery, {})){
            Session.set('OrganizationsPage.defaultQuery', {name: {$not: ""}});
        } else {
            Session.set('OrganizationsPage.defaultQuery', {});
        }
    }
  
    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-organization-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Organization
            </Button>
            <Button id="provider-directory-toggle-select-organization-footer-btn" onClick={ toggleSelect.bind(this, "Organization") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-organization-footer-btn" onClick={ toggleLayout.bind(this, "Organization") } style={ buttonStyles.west_button }>
                Layout
            </Button>
            <Button id="provider-directory-filters-organization-footer-btn" onClick={ toggleFilters.bind(this) } style={ buttonStyles.west_button }>
                Filters
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

    return (componentToRender);
}

//============================================================================================================================
// Organization Affiliations


export function OrganizationAffiliationsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "OrganizationAffiliationDetail");
        Session.set('mainAppDialogTitle', "New Affiliation");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-affiliation-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Affiliation
            </Button>
            <Button id="provider-directory-toggle-select-organization-affiliation-footer-btn" onClick={ toggleSelect.bind(this, "OrganizationAffiliation") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-organization-affiliation-footer-btn" onClick={ toggleLayout.bind(this, "OrganizationAffiliation") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }
  
    return (componentToRender);
}


//============================================================================================================================
// Practitioners



export function PractitionersFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "PractitionerDetail");
        Session.set('mainAppDialogTitle', "New Practitioner");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-practitioner-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
                New Practitioner
            </Button>
            <Button id="provider-directory-toggle-select-practitioner-footer-btn" onClick={ toggleSelect.bind(this, "Practitioner") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-practitioner-footer-btn" onClick={ toggleLayout.bind(this, "Practitioner") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }
  
    return (componentToRender);
}


//============================================================================================================================
// Practitioner Roles



export function PractitionerRolesFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "PractitionerRoleDetail");
        Session.set('mainAppDialogTitle', "New Role");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }
  
    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-role-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Role
            </Button>
            <Button id="provider-directory-toggle-select-practitioner-role-footer-btn" onClick={ toggleSelect.bind(this, "PractitionerRole") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-practitioner-role-footer-btn" onClick={ toggleLayout.bind(this, "PractitionerRole") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

    return (componentToRender);
}


//============================================================================================================================
// Provenances

export function ProvenancesFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "ProvenanceDetail");
        Session.set('mainAppDialogTitle', "New Provenance");
        Session.set('mainAppDialogMaxWidth', "md");
        // Session.set('mainAppDialogJson', {});        
    }
  
    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-provenance-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Provenance
            </Button>
            <Button id="provider-directory-toggle-select-provenance-footer-btn" onClick={ toggleSelect.bind(this, "Provenance") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-provenance-footer-btn" onClick={ toggleLayout.bind(this, "Provenance") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

    return (componentToRender);
}


//============================================================================================================================
// Related Persons

export function RelatedPersonsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "RelatedPersonDetail");
        Session.set('mainAppDialogTitle', "New Person");
        Session.set('mainAppDialogMaxWidth', "md");
        // Session.set('mainAppDialogJson', {});        
    }
  
    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-related-person-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New RelatedPerson
            </Button>
            <Button id="provider-directory-toggle-select-related-person-footer-btn" onClick={ toggleSelect.bind(this, "RelatedPerson") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-related-person-footer-btn" onClick={ toggleLayout.bind(this, "RelatedPerson") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

    return (componentToRender);
}


//============================================================================================================================
// Restrictions

export function RestrictionsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "RestrictionDetail");
        Session.set('mainAppDialogTitle', "New Restriction");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }
  
    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-restriction-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Restriction
            </Button>
            <Button id="provider-directory-toggle-select-restriction-footer-btn" onClick={ toggleSelect.bind(this, "Restriction") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-restriction-footer-btn" onClick={ toggleLayout.bind(this, "Restriction") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

    return (componentToRender);
}

//============================================================================================================================
// Search Parameters


export function SearchParametersFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "SearchParameterDetail");
        Session.set('mainAppDialogTitle', "New Parameters");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-parameter-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Parameter
            </Button>
            <Button id="provider-directory-toggle-select-search-parameter-footer-btn" onClick={ toggleSelect.bind(this, "SearchParameter") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-search-parameter-footer-btn" onClick={ toggleLayout.bind(this, "SearchParameter") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }
  
    return (componentToRender);
}


//============================================================================================================================
// Structure Definitions



export function StructureDefinitionsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "StructureDefinitionDetail");
        Session.set('mainAppDialogTitle', "New Definitions");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }

    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-definition-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Definition
            </Button>
            <Button id="provider-directory-toggle-select-structure-definition-footer-btn" onClick={ toggleSelect.bind(this, "StructureDefinition") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-structure-definition-footer-btn" onClick={ toggleLayout.bind(this, "StructureDefinition") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }
  
    return (componentToRender);
}


//============================================================================================================================
// Tasks

export function TasksFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "TaskDetail");
        Session.set('mainAppDialogTitle', "New Task");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }
  
    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-task-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Task
            </Button>
            <Button id="provider-directory-toggle-select-task-footer-btn" onClick={ toggleSelect.bind(this, "Task") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-task-footer-btn" onClick={ toggleLayout.bind(this, "Task") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

    return (componentToRender);
}


//============================================================================================================================
// Value Sets

export function ValueSetsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "ValueSetDetail");
        Session.set('mainAppDialogTitle', "New Value Set");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }
  
    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-value-set-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
            New Value Set
            </Button>
            <Button id="provider-directory-toggle-select-value-set-footer-btn" onClick={ toggleSelect.bind(this, "ValueSet") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-value-set-footer-btn" onClick={ toggleLayout.bind(this, "ValueSet") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

    return (componentToRender);
}


//============================================================================================================================
// Verification Results

export function VerificationResultsFooterButtons(props){

    function openDialog(){
        Session.toggle('mainAppDialogOpen');
        Session.set('mainAppDialogComponent', "VerificationResultDetail");
        Session.set('mainAppDialogTitle', "New Verification Result");
        Session.set('mainAppDialogMaxWidth', "sm");
        // Session.set('mainAppDialogJson', {});        
    }
  
    let componentToRender;
    if(Meteor.currentUserId()){
        componentToRender = <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
            <Button id="provider-directory-new-verification-result-footer-btn" onClick={ openDialog.bind(this) } style={ buttonStyles.west_button }>
                New Verification Result
            </Button>
            <Button id="provider-directory-toggle-select-verification-result-footer-btn" onClick={ toggleSelect.bind(this, "VerificationResult") } style={ buttonStyles.west_button }>
                Toggle Select
            </Button>
            <Button id="provider-directory-layout-verification-result-footer-btn" onClick={ toggleLayout.bind(this, "VerificationResult") } style={ buttonStyles.west_button }>
                Layout
            </Button>
        </MuiThemeProvider>
    } else {
        componentToRender = <MuiThemeProvider theme={muiTheme}><br/></MuiThemeProvider>;
    }

    return (componentToRender);
}



//============================================================================================================================
// Certificates

export function CertificatesButtons(props){
    // const buttonClasses = buttonStyles();

    function toggleNewCertificateDialog(){
      Session.set('mainAppDialogOpen', true);

      Session.set('mainAppDialogTitle', "Add Certificate");
      Session.set('mainAppDialogComponent', "NewCertificateDialog");
      Session.set('mainAppDialogMaxWidth', "md");
    }


    return (
      <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
        <Button id="provider-directory-new-certificate-footer-btn" onClick={ toggleNewCertificateDialog.bind(this) } style={buttonStyles.west_button}>
          New Certificate
        </Button>
        {props.children}
      </MuiThemeProvider>
    );
}

  
export function AddCertificateDialogActions(props){

    let { 
        children, 
        resourceType,
        relayUrl,
        ...otherProps 
    } = props;

    function handleSendRecord(){
        console.log('handleSendRecord', props);

        let newCertificateRecord = {
            resourceType: "UdapCertificate",
            createdAt: new Date(),
            certificateOwner:  Session.get('newUdapCertificateOwner'),
            certificate:  Session.get('newUdapCertificate')
        }

        
        console.log('JSON.stringify(newCertificateRecord)', JSON.stringify(newCertificateRecord))


        HTTP.post(Meteor.absoluteUrl() + "provider-directory/newCertificate", {data: newCertificateRecord}, function(error, result){
            if(error){
                alert(JSON.stringify(error.message));
            }
            if(result){
                console.log('HTTP.post', result)
                Session.set('mainAppDialogOpen', false);
            }
        })
        //     }    
        // }
    }

    let actionsToRender;
    if(Meteor.currentUserId()){
        actionsToRender = <DialogActions >
            <Button onClick={handleClose} color="primary">
                Close
            </Button>
            <Button onClick={handleSendRecord.bind(this)} color="primary" variant="contained">
                Send
            </Button>
        </DialogActions>
    } else {
        actionsToRender = <DialogActions >{props.children}</DialogActions>
    }
    
    

    return actionsToRender;
}



//============================================================================================================================
// Library Of Medicine

export function LibraryOfMedicineButtons(props){
    // const buttonClasses = buttonStyles();

    console.log('LibraryOfMedicineButtons')

    function toggleNewCertificateDialog(){
      Session.set('mainAppDialogOpen', true);

      Session.set('mainAppDialogTitle', "Add Certificate");
      Session.set('mainAppDialogComponent', "NewCertificateDialog");
      Session.set('mainAppDialogMaxWidth', "md");
    }


    return (
      <MuiThemeProvider theme={muiTheme} className="footer-buttons-provider-directory">
        <Button id="provider-directory-fetch-footer-btn" onClick={ toggleNewCertificateDialog.bind(this) } style={buttonStyles.west_button}>
          Fetch
        </Button>
        {props.children}
      </MuiThemeProvider>
    );
}