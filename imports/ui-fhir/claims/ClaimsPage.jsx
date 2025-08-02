import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button
} from '@mui/material'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import ClaimDetail from './ClaimDetail';
import ClaimsTable from './ClaimsTable';
// import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// 

Meteor.startup(function(){
  window.Claims = Meteor.Collections.Claims;
  window.LayoutHelpers = Meteor.LayoutHelpers;
})


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedClaimId', false);


Session.setDefault('claimPageTabIndex', 1); 
Session.setDefault('claimSearchFilter', ''); 
Session.setDefault('selectedClaimId', false);
Session.setDefault('selectedClaim', false)
Session.setDefault('ClaimsPage.onePageLayout', true)
Session.setDefault('ClaimsPage.defaultQuery', {})
Session.setDefault('ClaimsTable.hideCheckbox', true)
Session.setDefault('ClaimsTable.claimsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ClaimsPage(props){

  let data = {
    currentClaimId: '',
    selectedClaim: null,
    claims: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    claimsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ClaimsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ClaimsTable.hideCheckbox');
  }, [])
  data.selectedClaimId = useTracker(function(){
    return Session.get('selectedClaimId');
  }, [])
  data.selectedClaim = useTracker(function(){
    return Claims.findOne({_id: Session.get('selectedClaimId')});
  }, [])
  data.claims = useTracker(function(){
    return Claims.find().fetch();
  }, [])
  data.claimsIndex = useTracker(function(){
    return Session.get('ClaimsTable.claimsIndex')
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

  let layoutContainer;
  if(data.claims.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.claims.length + " Claims"} />
      <CardContent>
        <ClaimsTable 
          id='claimsTable'
          claims={data.claims}
          count={data.claims.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Claims.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Claims._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setClaimsPageIndex(index)
          }}        
          page={data.claimsIndex}
        />
      </CardContent>
    </Card>
  } else {
    layoutContainer = <Container maxWidth="sm" style={{display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', height: '100%', justifyContent: 'center'}}>
      {/* <img src={Meteor.absoluteUrl() + noDataImage} style={{width: '100%'}} />     */}
      <CardContent>
        <CardHeader 
          title={get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")} 
          subheader={get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor.  To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries.  If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")} 
        />
      </CardContent>
    </Container>
  }
  
  return (
    <div id="claimsPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default ClaimsPage;
