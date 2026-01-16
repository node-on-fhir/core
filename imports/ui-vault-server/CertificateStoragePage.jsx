import React, { useState } from 'react';

import { 
  CardHeader,
  CardContent,
  Grid
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { useTracker } from 'meteor/react-meteor-data';

// import CertificateDetail from './CertificateDetail';
import CertificatesTable from './CertificatesTable';

import { get, cloneDeep } from 'lodash';

import { MuiThemeProvider, createMuiTheme } from '@mui/material/styles';

import { LayoutHelpers } from '../lib/LayoutHelpers'
import { UdapCertificates } from '../imports/lib/schemas-extra/SimpleSchemas/UdapCertificates';


//---------------------------------------------------------------
// Session Variables


Session.setDefault('certificatePageTabIndex', 0);
Session.setDefault('certificateSearchFilter', '');
Session.setDefault('selectedCertificateId', '');
Session.setDefault('selectedCertificate', false);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('certificatesArray', []);
Session.setDefault('CertificateStoragePage.onePageLayout', true)
Session.setDefault('CertificatesTable.hideCheckbox', true)

//---------------------------------------------------------------
// Theming

const muiTheme = Theming.createMuiTheme();



//===========================================================================
// MAIN COMPONENT  

Session.setDefault('certificateChecklistMode', false)

export function CertificateStoragePage(props){

  let data = {
    selectedAuditEventId: '',
    selectedAuditEvent: null,
    certificates: [],
    onePageLayout: true,
    hideCheckbox: true,
    certificateSearchFilter: '',
    options: {
      sort: {
        'focus.display': -1,
        lastModified: -1
      }
    },
    certificateChecklistMode: false
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('CertificateStoragePage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('CertificatesTable.hideCheckbox');
  }, [])
  data.selectedCertificateId = useTracker(function(){
    return Session.get('selectedCertificateId');
  }, [])
  data.selectedCertificate = useTracker(function(){
    return AuditEvents.findOne(Session.get('selectedCertificateId'));
  }, [])
  data.certificates = useTracker(function(){
    return UdapCertificates.find().fetch();
  }, [])
  data.certificateSearchFilter = useTracker(function(){
    return Session.get('certificateSearchFilter')
  }, [])
  data.certificateChecklistMode = useTracker(function(){
    return Session.get('certificateChecklistMode')
  }, [])


  // function onCancelUpsertCertificate(context){
  //   Session.set('certificatePageTabIndex', 1);
  // }
  // function onDeleteCertificate(context){
  //   Certificates._collection.remove({_id: get(context, 'state.certificateId')}, function(error, result){
  //     if (error) {
  //       if(process.env.NODE_ENV === "test") console.log('Certificates.insert[error]', error);
  //       Bert.alert(error.reason, 'danger');
  //     }
  //     if (result) {
  //       Session.set('selectedCertificateId', '');
  //       HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Certificates", recordId: context.state.certificateId});        
  //     }
  //   });
  //   Session.set('certificatePageTabIndex', 1);
  // }
  // function onUpsertCertificate(context){
  //   //if(process.env.NODE_ENV === "test") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
  //   console.log('Saving a new Certificate...', context.state)

  //   if(get(context, 'state.certificate')){
  //     let self = context;
  //     let fhirCertificateData = Object.assign({}, get(context, 'state.certificate'));
  
  //     // if(process.env.NODE_ENV === "test") console.log('fhirCertificateData', fhirCertificateData);
  
  //     let certificateValidator = CertificateSchema.newContext();
  //     // console.log('certificateValidator', certificateValidator)
  //     certificateValidator.validate(fhirCertificateData)
  
  //     if(process.env.NODE_ENV === "development"){
  //       console.log('IsValid: ', certificateValidator.isValid())
  //       console.log('ValidationErrors: ', certificateValidator.validationErrors());
  
  //     }
  
  //     console.log('Checking context.state again...', context.state)
  //     if (get(context, 'state.certificateId')) {
  //       if(process.env.NODE_ENV === "development") {
  //         console.log("Updating certificate...");
  //       }

  //       delete fhirCertificateData._id;
  
  //       // not sure why we're having to respecify this; fix for a bug elsewhere
  //       fhirCertificateData.resourceType = 'Certificate';
  
  //       Certificates._collection.update({_id: get(context, 'state.certificateId')}, {$set: fhirCertificateData }, function(error, result){
  //         if (error) {
  //           if(process.env.NODE_ENV === "test") console.log("Certificates.insert[error]", error);
          
  //         }
  //         if (result) {
  //           HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Certificates", recordId: context.state.certificateId});
  //           Session.set('selectedCertificateId', '');
  //           Session.set('certificatePageTabIndex', 1);
  //         }
  //       });
  //     } else {
  //       // if(process.env.NODE_ENV === "test") 
  //       console.log("Creating a new certificate...", fhirCertificateData);
  
  //       fhirCertificateData.effectiveDateTime = new Date();
  //       Certificates._collection.insert(fhirCertificateData, function(error, result) {
  //         if (error) {
  //           if(process.env.NODE_ENV === "test")  console.log('Certificates.insert[error]', error);           
  //         }
  //         if (result) {
  //           HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Certificates", recordId: context.state.certificateId});
  //           Session.set('certificatePageTabIndex', 1);
  //           Session.set('selectedCertificateId', '');
  //         }
  //       });
  //     }
  //   } 
  //   Session.set('certificatePageTabIndex', 1);
  // }
  function handleRowClick(certificateId){
    console.log('CertificateStoragePage.handleRowClick', certificateId)
    // let certificate = Certificates.findOne({id: certificateId});

    // if(certificate){
    //   Session.set('selectedCertificateId', get(certificate, 'id'));
    //   Session.set('selectedCertificate', certificate);
    //   Session.set('Certificate.Current', certificate);
      
    //   let showModals = true;
    //   if(showModals){
    //     Session.set('mainAppDialogOpen', true);
    //     Session.set('mainAppDialogComponent', "CertificateDetail");
    //     Session.set('mainAppDialogMaxWidth', "sm");

    //     if(Meteor.currentUserId()){
    //       Session.set('mainAppDialogTitle', "Edit Certificate");
    //     } else {
    //       Session.set('mainAppDialogTitle', "View Certificate");
    //     }
    //   }      
    // } else {
    //   console.log('No certificate found...')
    // }
  }
  function onInsert(certificateId){
    Session.set('selectedCertificateId', '');
    Session.set('certificatePageTabIndex', 1);
    // HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Certificates", recordId: certificateId});
  }
  function onCancel(){
    Session.set('certificatePageTabIndex', 1);
  } 


  // console.log('CertificateStoragePage.data', data)

  function handleChange(event, newValue) {
    Session.set('certificatePageTabIndex', newValue)
  }


  let layoutContents;
  if(data.onePageLayout){
    layoutContents = <Card height="auto" margin={20} scrollable >
      <CardHeader title={data.certificates.length + " Certificates"} />
      <CardContent>

        <CertificatesTable 
          certificates={ data.certificates }
          hideCheckbox={data.hideCheckbox}
          hideStatus={false}
          hideName={false}
          hideConnectionType={false}
          hideOrganization={false}
          hideAddress={false}    
          paginationLimit={10}     
          checklist={data.certificateChecklistMode}
          onRowClick={ handleRowClick.bind(this) }
          rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
          count={data.certificates.length}
          />
        </CardContent>
      </Card>
  } else {
    layoutContents = <Grid container spacing={3}>
      <Grid item lg={6}>
        <Card height="auto" margin={20} >
          <CardHeader title={data.certificates.length + " Code Systems"} />
          <CardContent>
            <CertificatesTable 
              certificates={ data.certificates }
              selectedCertificateId={ data.selectedCertificateId }
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
              count={data.certificates.length}
              />
          </CardContent>
        </Card>
      </Grid>
      <Grid item lg={4}>
        <Card height="auto" margin={20} scrollable>
          <h1 className="barcode" style={{fontWeight: 100}}>{data.selectedCertificateId }</h1>
          {/* <CardHeader title={data.selectedCertificateId } className="helveticas barcode" /> */}
          <CardContent>
            <CardContent>
              {/* <CertificateDetail 
                id='certificateDetails'                 
                displayDatePicker={true} 
                displayBarcodes={false}
                certificate={ data.selectedCertificate }
                certificateId={ data.selectedCertificateId } 
                showCertificateInputs={true}
                showHints={false}

              /> */}
            </CardContent>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  }


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  return (
    <div id="certsStoragePage" headerHeight={headerHeight} paddingLeft={paddingWidth} paddingRight={paddingWidth}>
      <MuiThemeProvider theme={muiTheme} >
        { layoutContents }
      </MuiThemeProvider>
    </div>
  );
}


export default CertificateStoragePage;