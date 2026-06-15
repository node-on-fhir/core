import React, { useState } from 'react';

import { 
  CardHeader,
  CardContent,
  Grid
} from '@material-ui/core';
import styled from 'styled-components';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { useTracker } from 'meteor/react-meteor-data';

// import OAuthClientDetail from './OAuthClientDetail';
import OAuthClientsTable from './OAuthClientsTable';

import { StyledCard, PageCanvas } from 'fhir-starter';

import { get, cloneDeep } from 'lodash';

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import { LayoutHelpers } from 'meteor/clinical:hl7-fhir-data-infrastructure';


//---------------------------------------------------------------
// Session Variables


Session.setDefault('oauthClientPageTabIndex', 0);
Session.setDefault('oauthClientSearchFilter', '');
Session.setDefault('selectedOAuthClientId', '');
Session.setDefault('selectedOAuthClient', false);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('oauthClientsArray', []);
Session.setDefault('OAuthClientsPage.onePageLayout', true)
Session.setDefault('OAuthClientsTable.hideCheckbox', true)

//---------------------------------------------------------------
// Theming

const muiTheme = Theming.createMuiTheme();



//===========================================================================
// MAIN COMPONENT  

Session.setDefault('oauthClientChecklistMode', false)

export function OAuthClientsPage(props){

  let data = {
    selectedAuditEventId: '',
    selectedAuditEvent: null,
    oauthClients: [],
    onePageLayout: true,
    hideCheckbox: true,
    oauthClientSearchFilter: '',
    options: {
      sort: {
        'focus.display': -1,
        lastModified: -1
      }
    },
    oauthClientChecklistMode: false
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('OAuthClientsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('OAuthClientsTable.hideCheckbox');
  }, [])
  data.selectedOAuthClientId = useTracker(function(){
    return Session.get('selectedOAuthClientId');
  }, [])
  data.selectedOAuthClient = useTracker(function(){
    return OAuthClients.findOne(Session.get('selectedOAuthClientId'));
  }, [])
  data.oauthClients = useTracker(function(){
    let results = [];
    // if(Session.get('oauthClientChecklistMode')){
    //   results = OAuthClients.find({
    //     'focus.display': "Patient Correction"
    //   }, {
    //     limit: 10,
    //     sort: {lastModified: -1}
    //   }).fetch();      
    // } else {
      results = OAuthClients.find().fetch();
    // }

    return results;
  }, [])
  data.oauthClientSearchFilter = useTracker(function(){
    return Session.get('oauthClientSearchFilter')
  }, [])
  data.oauthClientChecklistMode = useTracker(function(){
    return Session.get('oauthClientChecklistMode')
  }, [])


  
  function handleRowClick(oauthClientId){
    console.log('OAuthClientsPage.handleRowClick', oauthClientId)
    // let oauthClient = OAuthClients.findOne({id: oauthClientId});

    // if(oauthClient){
    //   Session.set('selectedOAuthClientId', get(oauthClient, 'id'));
    //   Session.set('selectedOAuthClient', oauthClient);
    //   Session.set('OAuthClient.Current', oauthClient);
      
    //   let showModals = true;
    //   if(showModals){
    //     Session.set('mainAppDialogOpen', true);
    //     Session.set('mainAppDialogComponent', "OAuthClientDetail");
    //     Session.set('mainAppDialogMaxWidth', "sm");

    //     if(Meteor.currentUserId()){
    //       Session.set('mainAppDialogTitle', "Edit OAuthClient");
    //     } else {
    //       Session.set('mainAppDialogTitle', "View OAuthClient");
    //     }
    //   }      
    // } else {
    //   console.log('No oauthClient found...')
    // }
  }
  function onInsert(oauthClientId){
    Session.set('selectedOAuthClientId', '');
    Session.set('oauthClientPageTabIndex', 1);
    // HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "OAuthClients", recordId: oauthClientId});
  }
  function onCancel(){
    Session.set('oauthClientPageTabIndex', 1);
  } 


  // console.log('OAuthClientsPage.data', data)

  function handleChange(event, newValue) {
    Session.set('oauthClientPageTabIndex', newValue)
  }


  let layoutContents;
  if(data.onePageLayout){
    layoutContents = <StyledCard height="auto" margin={20} scrollable >
      <CardHeader title={data.oauthClients.length + " OAuthClients"} />
      <CardContent>

        <OAuthClientsTable 
          oauthClients={ data.oauthClients }
          hideCheckbox={data.hideCheckbox}
          hideStatus={false}
          hideName={false}
          hideConnectionType={false}
          hideOrganization={false}
          hideAddress={false}    
          paginationLimit={10}     
          checklist={data.oauthClientChecklistMode}
          onRowClick={ handleRowClick.bind(this) }
          rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
          count={data.oauthClients.length}
          />
        </CardContent>
      </StyledCard>
  } else {
    layoutContents = <Grid container spacing={3}>
      <Grid item lg={6}>
        <StyledCard height="auto" margin={20} >
          <CardHeader title={data.oauthClients.length + " Code Systems"} />
          <CardContent>
            <OAuthClientsTable 
              oauthClients={ data.oauthClients }
              selectedOAuthClientId={ data.selectedOAuthClientId }
              hideIdentifier={true} 
              hideCheckbox={data.hideCheckbox}
              hideActionIcons={true}
              hideStatus={false}
              hideName={false}
              hideConnectionType={false}
              hideOrganization={false}
              hideAddress={false}    
              onRowClick={ handleRowClick.bind(this) }
              rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
              count={data.oauthClients.length}
              />
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item lg={4}>
        <StyledCard height="auto" margin={20} scrollable>
          <h1 className="barcode" style={{fontWeight: 100}}>{data.selectedOAuthClientId }</h1>
          {/* <CardHeader title={data.selectedOAuthClientId } className="helveticas barcode" /> */}
          <CardContent>
            <CardContent>
              {/* <OAuthClientDetail 
                id='oauthClientDetails'                 
                displayDatePicker={true} 
                displayBarcodes={false}
                oauthClient={ data.selectedOAuthClient }
                oauthClientId={ data.selectedOAuthClientId } 
                showOAuthClientInputs={true}
                showHints={false}

              /> */}
            </CardContent>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  }


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  return (
    <PageCanvas id="certsStoragePage" headerHeight={headerHeight} paddingLeft={paddingWidth} paddingRight={paddingWidth}>
      <MuiThemeProvider theme={muiTheme} >
        { layoutContents }
      </MuiThemeProvider>
    </PageCanvas>
  );
}


export default OAuthClientsPage;