// https://www.npmjs.com/package/react-dropzone-component
// http://www.dropzonejs.com/import { 

  import React, { useState, useEffect, useCallback } from 'react';
  
  import { 
    Button, 
    Card,
    CardContent, 
    CardHeader, 
    CardActions,
    Checkbox,
    Grid, 
    Typography,
    Table,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TablePagination,
  } from '@mui/material';


import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { get } from 'lodash';
import moment from 'moment';

import "ace-builds";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-monokai";

//====================================================================================
// Shared Components

let useTheme;
let DynamicSpacer;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
  DynamicSpacer = Meteor.DynamicSpacer;
})

//====================================================================================
// Collections

let AllergyIntolerances;
let CarePlans;
let Conditions;
let Encounters;
let Immunizations;
let MedicationStatements;
let Observations;
let Patients;
let Procedures;

Meteor.startup(function(){
  AllergyIntolerances = Meteor.Collections.AllergyIntolerances;
  CarePlans = Meteor.Collections.CarePlans;
  Conditions = Meteor.Collections.Conditions;
  Encounters = Meteor.Collections.Encounters;
  Immunizations = Meteor.Collections.Immunizations;
  MedicationStatements = Meteor.Collections.MedicationStatements;
  Observations = Meteor.Collections.Observations;
  Patients = Meteor.Collections.Patients;
  Procedures = Meteor.Collections.Procedures;
})


//============================================================================
//Global Theming 

import { MuiThemeProvider, createTheme } from '@mui/material/styles';


let theme = {
  primaryColor: "rgb(108, 183, 110)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(108, 183, 110)",
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
  background: "linear-gradient(45deg, rgb(108, 183, 110) 30%, rgb(150, 202, 144) 90%)",

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

//============================================================================
// Main Component  

let defaultResource = {
  "resourceType": "Basic"
}

export function EditorPage(props){

  const { theme, toggleTheme } = useTheme();

  const [showPreviewData, setShowPreviewData] = useState(false);

  const [editorContent, setEditorContent] = useState("");

  let headerHeight = Meteor.LayoutHelpers.calcHeaderHeight();
  let formFactor = Meteor.LayoutHelpers.determineFormFactor();
  let paddingWidth = Meteor.LayoutHelpers.calcCanvasPaddingWidth();
  let cardWidth = window.innerWidth - paddingWidth;
  let columnWidth = 4;

  function onChange(newValue){
    console.log('onChange', newValue)
    setEditorContent(newValue)
  }

  function clearEditor(){
    setEditorContent("");
  }
  function saveResource(){
    console.log('saveResource', editorContent)
    let parsedEditorContent = JSON.parse(editorContent);
    // Meteor.call("saveUnknownResourceType", editorContent, function(error, saveResult){
    //   if(error){console.log("error", error)}
    //   if(error){console.log("saveResult", saveResult)}      
    // })
    let resultId;
    let resourceType = get(parsedEditorContent, 'resourceType');
    console.log('resourceType', resourceType)
    switch (resourceType) {
      
      case "AllergyIntolerance":
        console.log("Posting AllergyIntolerance...")
        AllergyIntolerances._collection.insert(parsedEditorContent, function(allergyIntolerancesError, result){
          if(allergyIntolerancesError){
            console.log('allergyIntolerancesError', allergyIntolerancesError)
          }
          if(result){
            console.log('result', result)
          }
        });

        // resultId = HTTP.post("http://localhost:3000/baseR4/AllergyIntolerance", {
        //   headers: {},
        //   data: parsedEditorContent
        // }, function(allergyIntolerancesError, result){
        //   if(allergyIntolerancesError){
        //     console.log('allergyIntolerancesError', allergyIntolerancesError)
        //   }
        //   if(result){
        //     console.log('result', result)
        //   }
        // });
        break;
      case "Condition":
        Conditions._collection.insert(parsedEditorContent, function(conditionsError, result){
          if(conditionsError){
            console.log('conditionsError', conditionsError)
          }
          if(result){
            console.log('result', result)
          }
        })
        // resultId = HTTP.post("http://localhost:3000/baseR4/Condition", {
        //   headers: {},
        //   data: parsedEditorContent
        // }, function(conditionsError, result){
        //   if(conditionsError){
        //     console.log('conditionsError', conditionsError)
        //   }
        //   if(result){
        //     console.log('result', result)
        //   }
        // });
        break;
      case "CarePlan":
        CarePlans._collection.insert(parsedEditorContent, function(carePlansError, result){
          if(carePlansError){
            console.log('carePlansError', carePlansError)
          }
          if(result){
            console.log('result', result)
          }
        })
        // resultId = HTTP.post("http://localhost:3000/baseR4/CarePlan", {
        //   headers: {},
        //   data: parsedEditorContent
        // }, function(carePlansError, result){
        //   if(carePlansError){
        //     console.log('carePlansError', carePlansError)
        //   }
        //   if(result){
        //     console.log('result', result)
        //   }
        // });
        break;
      case "Encounter":
        Encounters._collection.insert(parsedEditorContent, function(encountersError, result){
          if(encountersError){
            console.log('encountersError', encountersError)
          }
          if(result){
            console.log('result', result)
          }
        })
        // resultId = HTTP.post("http://localhost:3000/baseR4/Encounter", {
        //   headers: {},
        //   data: parsedEditorContent
        // }, function(encountersError, result){
        //   if(encountersError){
        //     console.log('encountersError', encountersError)
        //   }
        //   if(result){
        //     console.log('result', result)
        //   }
        // });
        break;
      case "Immunization":
        Immunizations._collection.insert(parsedEditorContent, function(immunizationsError, result){
          if(immunizationsError){
            console.log('immunizationsError', immunizationsError)
          }
          if(result){
            console.log('result', result)
          }
        })
        // resultId = HTTP.post("http://localhost:3000/baseR4/Immunization", {
        //   headers: {},
        //   data: parsedEditorContent
        // }, function(immunizationsError, result){
        //   if(immunizationsError){
        //     console.log('immunizationsError', immunizationsError)
        //   }
        //   if(result){
        //     console.log('result', result)
        //   }
        // });
        break;
      case "MedicationStatement":
        MedicationStatements._collection.insert(parsedEditorContent, function(medicationStatementsError, result){
          if(medicationStatementsError){
            console.log('medicationStatementsError', medicationStatementsError)
          }
          if(result){
            console.log('result', result)
          }
        })
        // resultId = HTTP.post("http://localhost:3000/baseR4/MedicationStatement", {
        //   headers: {},
        //   data: parsedEditorContent
        // }, function(medicationStatementsError, result){
        //   if(medicationStatementsError){
        //     console.log('medicationStatementsError', medicationStatementsError)
        //   }
        //   if(result){
        //     console.log('result', result)
        //   }
        // });
        break;
      case "Observation":
        Observations._collection.insert(parsedEditorContent, function(observationsError, result){
          if(observationsError){
            console.log('observationsError', observationsError)
          }
          if(result){
            console.log('result', result)
          }
        })
        // resultId = HTTP.post("http://localhost:3000/baseR4/Observation", {
        //   headers: {},
        //   data: parsedEditorContent
        // }, function(observationsError, result){
        //   if(observationsError){
        //     console.log('observationsError', observationsError)
        //   }
        //   if(result){
        //     console.log('result', result)
        //   }
        // });
        break;
      case "Patient":
        Patients._collection.insert(parsedEditorContent, function(patientsError, result){
          if(patientsError){
            console.log('patientsError', patientsError)
          }
          if(result){
            console.log('result', result)
          }
        })
        // resultId = HTTP.post("http://localhost:3000/baseR4/Patient", {
        //   headers: {},
        //   data: parsedEditorContent
        // }, function(patientsError, result){
        //   if(patientsError){
        //     console.log('patientsError', patientsError)
        //   }
        //   if(result){
        //     console.log('result', result)
        //   }
        // });
        break;
      case "Procedure":
        Procedures._collection.insert(parsedEditorContent, function(proceduresError, result){
          if(proceduresError){
            console.log('proceduresError', proceduresError)
          }
          if(result){
            console.log('result', result)
          }
        })
        // resultId = HTTP.post("http://localhost:3000/baseR4/Procedure", {
        //   headers: {},
        //   data: parsedEditorContent
        // }, function(proceduresError, result){
        //   if(proceduresError){
        //     console.log('proceduresError', proceduresError)
        //   }
        //   if(result){
        //     console.log('result', result)
        //   }
        // });
        break;
    
      default:
        break;
    }

    console.log('resultId', resultId);
  }

  function loadPatient(){
    setEditorContent(JSON.stringify({
      "resourceType": "Patient",
      "birthDate": moment().format("YYYY-MM-DD"),
      "gender": "unknown",
      "name": [{
        "text": "",
        "given": "",
        "family": ""
      }]
    }, null, 2))
  }
  function loadEncounter(){
    setEditorContent(JSON.stringify({
      "resourceType": "Encounter",
      "status": "finished",
      "subject": {
        "display": "",
        "reference": ""
      },
      "period": {
        "start": moment().format("YYYY-MM-DD")
      },
      "class": {
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        "code": "",
        "display": ""
      }
    }, null, 2))
  }
  function loadCondition(){
    setEditorContent(JSON.stringify({
      "resourceType": "Condition",
      "clinicalStatus": "active",
      "onsetDateTime": moment().format("YYYY-MM-DD"),
      "subject": {
        "display": "",
        "reference": ""
      },
      "code": {
        "text": "",
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "",
          "display": ""
        }]
      }
    }, null, 2))
  }
  function loadProcedure(){
    setEditorContent(JSON.stringify({
      "resourceType": "Procedure",
      "status": "completed",
      "performedDateTime": moment().format("YYYY-MM-DD"),
      "subject": {
        "display": "",
        "reference": ""
      },
      "performer": {
        "actor": {
          "display": "",
          "reference": ""
        }
      },
      "code": {
        "text": "",
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "",
          "display": ""
        }]
      }
    }, null, 2))
  }
  function loadCarePlan(){
    setEditorContent(JSON.stringify({
      "resourceType": "CarePlan",
      "status": "completed",
      "title": "",
      "description": "",
      "created": moment().format("YYYY-MM-DD"),
      "subject": {
        "display": "",
        "reference": ""
      },
      "period": {
        "start": moment().format("YYYY-MM-DD"),
        "end": moment().format("YYYY-MM-DD")
      },
      "category": [{
        "text": "",
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "",
          "display": ""
        }]
      }]
    }, null, 2))
  }
  function loadObservation(){
    setEditorContent(JSON.stringify({
      "resourceType": "Observation",
      "status": "final",
      "effectiveDateTime": moment().format("YYYY-MM-DD"),
      "subject": {
        "display": "",
        "reference": ""
      },
      "code": {
        "text": "",
        "coding": [{
          "system": "http://loinc.org",
          "code": "",
          "display": ""
        }]
      },
      "category": {
        "text": "",
        "coding": [{
          "system": "http://hl7.org/fhir/ValueSet/observation-category",
          "code": "",
          "display": ""
        }]
      }
    }, null, 2))
  }
  function loadAllergyIntolerance(){
    setEditorContent(JSON.stringify({
      "resourceType": "AllergyIntolerance",
      "clinicalStatus": "active",
      "onsetDateTime": moment().format("YYYY-MM-DD"),
      "subject": {
        "display": "",
        "reference": ""
      },
      "code": {
        "text": "",
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "",
          "display": ""
        }]
      }
    }, null, 2))
  }
  function loadImmunization(){
    setEditorContent(JSON.stringify({
      "resourceType": "Immunization",
      "status": "completed",
      "occurenceDateTime": moment().format("YYYY-MM-DD"),
      "recorded": moment().format("YYYY-MM-DD"),
      "subject": {
        "display": "",
        "reference": ""
      },
      "vaccineCode": {
        "text": "",
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "",
          "display": ""
        }]
      }
    }, null, 2))
  }
  function loadMedicationStatement(){
    setEditorContent(JSON.stringify({
      "resourceType": "MedicationStatement",
      "status": "active",
      "effectiveDateTime": moment().format("YYYY-MM-DD"),
      "subject": {
        "display": "",
        "reference": ""
      }
    }, null, 2))
  }
  return(
    <div id="EditorPage" style={{height: window.innerHeight, "paddingBottom": "128px", "overflow": "scroll" }}>

        <Grid container spacing={8} justify="center">
          <Grid item md={3}>
            <DynamicSpacer height={80} />

            <Button variant="contained" onClick={loadAllergyIntolerance.bind(this)} style={{marginRight: '20px', float: 'right', width: '240px'}}>Allergy Intolerance</Button> <br />  
            <DynamicSpacer height={30} />
            <Button variant="contained" onClick={loadCondition.bind(this)} style={{marginRight: '20px', float: 'right', width: '240px'}}>Condition</Button> <br />  
            <DynamicSpacer height={30} />
            <Button variant="contained" onClick={loadCarePlan.bind(this)} style={{marginRight: '20px', float: 'right', width: '240px'}}>Care Plan</Button> <br />  
            <DynamicSpacer height={30} />
            <Button variant="contained" onClick={loadEncounter.bind(this)} style={{marginRight: '20px', float: 'right', width: '240px'}}>Encounter</Button><br />   
            <DynamicSpacer height={30} />
            <Button variant="contained" onClick={loadImmunization.bind(this)} style={{marginRight: '20px', float: 'right', width: '240px'}}>Immunization</Button> <br />  
            <DynamicSpacer height={30} />
            <Button variant="contained" onClick={loadMedicationStatement.bind(this)} style={{marginRight: '20px', float: 'right', width: '240px'}}>Medication Statement</Button> <br />  
            <DynamicSpacer height={30} />
            <Button variant="contained" onClick={loadObservation.bind(this)} style={{marginRight: '20px', float: 'right', width: '240px'}}>Observation</Button> <br />  
            <DynamicSpacer height={30} />
            <Button variant="contained" onClick={loadPatient.bind(this)} style={{marginRight: '20px', float: 'right', width: '240px'}}>Patient</Button><br />   
            <DynamicSpacer height={30} />
            <Button variant="contained" onClick={loadProcedure.bind(this)} style={{marginRight: '20px', float: 'right', width: '240px'}}>Procedure</Button> <br />  
            <DynamicSpacer height={30} />

          </Grid>
          <Grid item md={6} style={{width: '100%'}}>
            <CardHeader title="Data Editor" style={{cursor: 'pointer'}}  />
            <Card style={{height: window.innerHeight - 300}} width={cardWidth + 'px'}>
              <AceEditor
                mode="json"
                theme={theme === 'light' ? "tomorrow" : "monokai"}
                wrapEnabled={true}
                onChange={onChange}
                name="aceEditor"
                editorProps={{ $blockScrolling: true }}
                style={{width: '100%', height: '100%'}}
                value={editorContent}
                defaultValue={JSON.stringify(defaultResource, null, 2)}
              />
            </Card>
          </Grid>
          <Grid item md={3}>
            <DynamicSpacer height={80} />
            <Button 
              variant="contained"
              color="primary"
              onClick={saveResource.bind(this)} 
              style={{marginRight: '20px', width: '240px'}}
              >Save</Button>   
              <DynamicSpacer height={30} />
              <Button 
              variant="contained"
              onClick={clearEditor.bind(this)} 
              style={{marginRight: '20px', width: '240px'}}
              >Clear</Button>   
          </Grid>
        </Grid>  
    </div>
  );
}


export default EditorPage;