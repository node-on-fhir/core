import React from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Button } from '@mui/material';
import { Box } from '@mui/material';

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


  // The footer bar is an AppBar (dark appbar palette in BOTH light and dark
  // mode), so buttons must inherit the AppBar's contrast text — never the
  // page text color, which is black in light mode and illegible here.
  return (
    <Box className="footer-buttons-data-importer">
      <Button id="data-importer-load-data-footer-btn" color="inherit" onClick={ loadData }>
        Load Data
      </Button>
      <Button id="data-importer-editor-wrap-footer-btn" color="inherit" onClick={ enableEditorWrap.bind(this) }>
        Editor Wrap
      </Button>
      <Button id="data-importer-clear-all-client-data-footer-btn" color="inherit" onClick={ clearAllClientData.bind(this) }>
        Clear All Client Data
      </Button>
    </Box>
  );
}


