import React from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Button } from '@mui/material';
import { Box } from '@mui/material';

import { get } from 'lodash';

import MedicalRecordImporter from '../lib/MedicalRecordImporter';

//========================================================================================================
// Theming 

import {
  MuiThemeProvider,
  createTheme,
} from '@mui/material/styles';


//============================================================================================================================
// THEMING

  // This is necessary for the Material UI component render layer
  let palette = {}

  // if we have a globally defined theme from a settings file
  if(get(Meteor, 'settings.public.theme.palette')){
    palette = get(Meteor, 'settings.public.theme.palette');
  }

  const muiTheme = createTheme({
    typography: {
      useNextVariants: true,
    },
    palette: {
      appBar: {
        main: palette.appBarColor,
        contrastText: palette.appBarTextColor
      },
      contrastThreshold: 3,
      tonalOffset: 0.2
    }
  });

  let useTheme;
  let useNavigate;
  Meteor.startup(function(){
    useTheme = Meteor.useTheme;
    if (window.ReactRouter) {
      useNavigate = window.ReactRouter.useNavigate;
    }
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
  const navigate = useNavigate ? useNavigate() : null;

  function loadData(){
    let data = Session.get('previewBuffer') || Session.get('importBuffer');
    let fileExtension = Session.get('fileExtension') || 'json';

    if(!data){
      console.warn('[ImportButtons.loadData] No data to import');
      return;
    }

    const ndjsonExtensions = ['ndjson', 'phr', 'sphr', 'application/ndjson', 'application/ndjson+fhir', 'application/phr', 'application/sphr'];

    if(ndjsonExtensions.includes(fileExtension)){
      console.log('[ImportButtons.loadData] Importing NDJSON data');
      MedicalRecordImporter.importNdjson(data);
    } else {
      console.log('[ImportButtons.loadData] Importing Bundle data');
      MedicalRecordImporter.importBundle(data);
    }

    if(navigate){
      navigate('/');
    }
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


  let appBarColor = get(Meteor, 'settings.public.theme.palette.appBarColor');
  let appBarColorDark = get(Meteor, 'settings.public.theme.palette.appBarColorDark');
  let appBarTextColor = get(Meteor, 'settings.public.theme.palette.appBarTextColor');
  let appBarTextColorDark = get(Meteor, 'settings.public.theme.palette.appBarTextColorDark');

  let appStyle;
  console.log('theme', theme)
  if(theme === 'light'){
    appStyle = {color: appBarTextColorDark};
  } else {
    appStyle = {color: appBarTextColor};
  }

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


