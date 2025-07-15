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

// import BasicDetail from './BasicDetail';
import BasicsTable from './BasicsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get, cloneDeep } from 'lodash';

import { MuiThemeProvider, createTheme } from '@mui/material/styles';

import { Basics } from '../../lib/schemas/Basics';


//---------------------------------------------------------------
// Session Variables


Session.setDefault('basicPageTabIndex', 0);
Session.setDefault('basicSearchFilter', '');
Session.setDefault('selectedBasicId', '');
Session.setDefault('selectedBasic', false);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('basicsArray', []);
Session.setDefault('BasicsPage.onePageLayout', true)

//---------------------------------------------------------------
// Theming

const muiTheme = Theming.createTheme();



//===========================================================================
// MAIN COMPONENT  

Session.setDefault('basicChecklistMode', false)

export function BasicsPage(props){

  let data = {
    selectedAuditEventId: '',
    selectedAuditEvent: null,
    basics: [],
    onePageLayout: true,
    basicSearchFilter: '',
    options: {
      sort: {
        'focus.display': -1,
        lastModified: -1
      }
    },
    basicChecklistMode: false
  };

  


  data.onePageLayout = useTracker(function(){
    return Session.get('BasicsPage.onePageLayout');
  }, [])
  data.selectedBasicId = useTracker(function(){
    return Session.get('selectedBasicId');
  }, [])
  data.selectedBasic = useTracker(function(){
    return AuditEvents.findOne(Session.get('selectedBasicId'));
  }, [])
  data.basics = useTracker(function(){
    let results = [];
    if(Session.get('basicChecklistMode')){
      results = Basics.find({
        'focus.display': "Patient Correction"
      }, {
        limit: 10,
        sort: {lastModified: -1}
      }).fetch();      
    } else {
      results = Basics.find().fetch();
    }

    return results;
  }, [])
  data.basicSearchFilter = useTracker(function(){
    return Session.get('basicSearchFilter')
  }, [])
  data.basicChecklistMode = useTracker(function(){
    return Session.get('basicChecklistMode')
  }, [])


  function onCancelUpsertBasic(context){
    Session.set('basicPageTabIndex', 1);
  }
  function onDeleteBasic(context){
    Basics._collection.remove({_id: get(context, 'state.basicId')}, function(error, result){
      if (error) {
        if(process.env.NODE_ENV === "test") console.log('Basics.insert[error]', error);
        Bert.alert(error.reason, 'danger');
      }
      if (result) {
        Session.set('selectedBasicId', '');
        HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Basics", recordId: context.state.basicId});        
      }
    });
    Session.set('basicPageTabIndex', 1);
  }
  function onUpsertBasic(context){
    //if(process.env.NODE_ENV === "test") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Basic...', context.state)

    if(get(context, 'state.basic')){
      let self = context;
      let fhirBasicData = Object.assign({}, get(context, 'state.basic'));
  
      // if(process.env.NODE_ENV === "test") console.log('fhirBasicData', fhirBasicData);
  
      let basicValidator = BasicSchema.newContext();
      // console.log('basicValidator', basicValidator)
      basicValidator.validate(fhirBasicData)
  
      if(process.env.NODE_ENV === "development"){
        console.log('IsValid: ', basicValidator.isValid())
        console.log('ValidationErrors: ', basicValidator.validationErrors());
  
      }
  
      console.log('Checking context.state again...', context.state)
      if (get(context, 'state.basicId')) {
        if(process.env.NODE_ENV === "development") {
          console.log("Updating basic...");
        }

        delete fhirBasicData._id;
  
        // not sure why we're having to respecify this; fix for a bug elsewhere
        fhirBasicData.resourceType = 'Basic';
  
        Basics._collection.update({_id: get(context, 'state.basicId')}, {$set: fhirBasicData }, function(error, result){
          if (error) {
            if(process.env.NODE_ENV === "test") console.log("Basics.insert[error]", error);
          
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Basics", recordId: context.state.basicId});
            Session.set('selectedBasicId', '');
            Session.set('basicPageTabIndex', 1);
          }
        });
      } else {
        // if(process.env.NODE_ENV === "test") 
        console.log("Creating a new basic...", fhirBasicData);
  
        fhirBasicData.effectiveDateTime = new Date();
        Basics._collection.insert(fhirBasicData, function(error, result) {
          if (error) {
            if(process.env.NODE_ENV === "test")  console.log('Basics.insert[error]', error);           
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Basics", recordId: context.state.basicId});
            Session.set('basicPageTabIndex', 1);
            Session.set('selectedBasicId', '');
          }
        });
      }
    } 
    Session.set('basicPageTabIndex', 1);
  }
  function handleRowClick(basicId, foo, bar){
    console.log('BasicsPage.handleRowClick', basicId)
    let basic = Basics.findOne({id: basicId});

    Session.set('selectedBasicId', get(basic, 'id'));
    Session.set('selectedBasic', basic);
  }
  function onInsert(basicId){
    Session.set('selectedBasicId', '');
    Session.set('basicPageTabIndex', 1);
    HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Basics", recordId: basicId});
  }
  function onCancel(){
    Session.set('basicPageTabIndex', 1);
  } 


  // console.log('BasicsPage.data', data)

  function handleChange(event, newValue) {
    Session.set('basicPageTabIndex', newValue)
  }

  let [basicsPageIndex, setBasicsPageIndex] = setState(0);

  let layoutContents;
  if(data.onePageLayout){
    layoutContents = <Card height="auto" margin={20} scrollable >
      <CardHeader title={data.basics.length + " Code Systems"} />
      <CardContent>

        <BasicsTable 
          basics={ data.basics }
          hideCheckbox={false}
          hideStatus={false}
          hideName={false}
          hideTitle={false}
          hideVersion={false}
          hideExperimental={false}
          paginationLimit={10}     
          checklist={data.basicChecklistMode}
          rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
          count={data.basics.length}
          page={basicsPageIndex}
          onSetPage={function(index){
            setBasicsPageIndex(index)
          }}  
          />
        </CardContent>
      </Card>
  } else {
    layoutContents = <Grid container spacing={3}>
      <Grid item lg={6}>
        <Card height="auto" margin={20} >
          <CardHeader title={data.basics.length + " Code Systems"} />
          <CardContent>
            <BasicsTable 
              basics={ data.basics }
              selectedBasicId={ data.selectedBasicId }
              hideIdentifier={true} 
              hideCheckbox={false}
              hideActionIcons={true}
              hideStatus={false}
              hideName={false}
              hideTitle={false}
              hideVersion={false}
              hideExperimental={false}    
              hideBarcode={true}
              onRowClick={ handleRowClick.bind(this) }
              rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
              count={data.basics.length}
              page={basicsPageIndex}
              onSetPage={function(index){
                setBasicsPageIndex(index)
              }}  
              />
          </CardContent>
        </Card>
      </Grid>
      <Grid item lg={4}>
        <Card height="auto" margin={20} scrollable>
          <h1 className="barcode" style={{fontWeight: 100}}>{data.selectedBasicId }</h1>
          {/* <CardHeader title={data.selectedBasicId } className="helveticas barcode" /> */}
          <CardContent>
            <CardContent>
              <BasicDetail 
                id='basicDetails'                 
                displayDatePicker={true} 
                displayBarcodes={false}
                basic={ data.selectedBasic }
                basicId={ data.selectedBasicId } 
                showBasicInputs={true}
                showHints={false}
                onSetPage={function(index){
                  setBasicsPageIndex(index)
                }}    
              />
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
    <div id="basicsPage" style={{padding: "20px"}} >
      { layoutContents }
    </div>
  );
}


export default BasicsPage;