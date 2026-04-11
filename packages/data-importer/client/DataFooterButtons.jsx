import React from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Button } from '@mui/material';
import { Box } from '@mui/material';

//========================================================================================================
// Theming

  let useTheme;
  Meteor.startup(function(){
    useTheme = Meteor.useTheme;
  })


//============================================================================================================================
// MAIN COMPONENT


export function SampleDialogComponent(props){
  return(
    <div>
      This is a sample component!
    </div>
  )
}

Session.setDefault('editorWrapEnabled', false);
export function ImportButtons(props){

  const { theme, toggleTheme } = useTheme();
  function loadData(){
    let data = Session.get('previewBuffer') || Session.get('importBuffer');

    if(!data){
      console.warn('[ImportButtons.loadData] No data to import');
      return;
    }

    console.log('[ImportButtons.loadData] Opening import dialog');
    Session.set('importDialogRequested', true);
  }

  function enableEditorWrap(){
    Session.toggle('editorWrapEnabled');
  }
  function clearAllClientData(){
    console.log('Clear all data cursors!');

    if(confirm("Are you sure?")){
      
      let resourceTypes = [
        // 'AllergyIntolerances',
        'CarePlans',
        'Conditions',
        'Consents',
        'Contracts',
        'ClinicalImpressions',
        'Communications',
        'Composition',
        'Devices',
        'DiagnosticReports',
        'DocumentReferences',
        'DocumentManifests',
        'Encounters',
        'Goals',
        'Immunizations',
        'ImagingStudies',
        'Locations',
        'Measures',
        'MeasureReports',
        'Medications',
        'MedicationOrders',
        'MedicationStatements',
        'Organizations',
        'Observations',
        'Patients',
        'Practitioners',
        'Persons',
        'Procedures',
        'Questionnaires',
        'QuestionnaireResponses',
        'RiskAssessments',
        'RelatedPersons',
        'Sequences'
      ];

      resourceTypes.forEach(function(resourceType){


        if(Meteor.isClient){
          console.log('Clearing client data for: ', resourceType);

          if(typeof resourceType === "object"){
    
            try {
              console.log('Removing all records from: ', resourceType)  
              resourceType.remove({})
            } catch (error) {
              console.log('Error', error);
              console.log('Trying to remove records one at a time.')
              resourceType.find().forEach(function(record){
                resourceType.remove({_id: record._id})
              })                            
            }
          } else if(typeof window[resourceType] === "object"){
            try {
              window[resourceType].remove()
            } catch (error) {
              window[resourceType].find().forEach(function(record){
                window[resourceType].remove({_id: record._id})
              })                            
            }
          }  
        }
      })
      Session.set('geoJsonLayer', "");    
    }
  }


  const isDark = theme === 'dark';
  let appStyle = {
    color: isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)'
  };

  return (
    <Box>
      <Button onClick={ loadData } sx={appStyle}>
        Load Data
      </Button>
      <Button onClick={ enableEditorWrap.bind(this) } sx={appStyle}>
        Editor Wrap
      </Button>
      <Button onClick={ clearAllClientData.bind(this) } sx={appStyle}>
        Clear All Client Data
      </Button>
    </Box>
  );
}


