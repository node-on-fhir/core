import React, { useState, useEffect, StrictMode } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { get, set, has, concat, pullAt } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Button, Grid, Box, MenuItem, Select, Card, CardMedia, CardHeader, CardContent, CardActions, Typography } from '@mui/material';


import "ace-builds";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import { useNavigate } from "react-router-dom";

import PatientCard from './PatientCard';
import SmartOnFhir, { fetchCapabilityStatement } from './SmartOnFhir';

import Daniel from '../data/Daniel959_Gaitán874_39f25659-e79f-43e0-f3a9-8b78f2a9173e.json';

import MedicalRecordImporter from '../lib/MedicalRecordImporter';

//====================================================================================
// SMART on FHIR

let firstSmartConfig = get(Meteor, 'settings.public.smartOnFhir[0]', []);

function generateCodeVerifier() {
  const array = new Uint32Array(56); // 56 random bytes -> 112 base64 characters
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array)).replace(/[\+/=]/g, '').substr(0, 128);
}

  // Function to generate code_challenge from code_verifier
async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return uint8ToBase64(new Uint8Array(hash))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Helper function to convert Uint8Array to base64 string
function uint8ToBase64(uint8Array) {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}


async function verifyCodeChallenge(codeVerifier, expectedCodeChallenge) {

  // Generate the code_challenge from the code_verifier
  const generatedCodeChallenge = await generateCodeChallenge(codeVerifier);

  console.log('Generated code_challenge:', generatedCodeChallenge);
  console.log('Expected code_challenge:', expectedCodeChallenge);

  // Compare the generated code_challenge with the expected one
  if (generatedCodeChallenge === expectedCodeChallenge) {
      console.log('Success: The code_verifier correctly generates the expected code_challenge.');
  } else {
      console.error('Failure: The code_verifier does NOT generate the expected code_challenge.');
  }
}

//====================================================================================
// Session Variables

Session.setDefault('foo', 'bar');


//====================================================================================
// Shared Components

let DynamicSpacer;
let useTheme;
let FhirUtilities;
let LayoutHelpers;

let AllergyIntolerancesTable;
let CarePlansTable;
let CareTeamsTable;
let ConditionsTable;
let ConsentsTable;
let DevicesTable;
let EncountersTable;
let ImmunizationsTable;
let LocationsTable;
let MedicationsTable;
let ObservationsTable;
let ProceduresTable;
let QuestionnairesTable;
let QuestionnaireResponsesTable;

Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
  FhirUtilities = Meteor.FhirUtilities;
  LayoutHelpers = Meteor.LayoutHelpers;
  useTheme = Meteor.useTheme;

  AllergyIntolerancesTable = Meteor.Tables.AllergyIntolerancesTable;
  CarePlansTable = Meteor.Tables.CarePlansTable;
  CareTeamsTable = Meteor.Tables.CareTeamsTable;
  ConditionsTable = Meteor.Tables.ConditionsTable;
  ConsentsTable = Meteor.Tables.ConsentsTable;
  DevicesTable = Meteor.Tables.DevicesTable;
  EncountersTable = Meteor.Tables.EncountersTable;
  ImmunizationsTable = Meteor.Tables.ImmunizationsTable;
  LocationsTable = Meteor.Tables.LocationsTable;
  MedicationsTable = Meteor.Tables.MedicationsTable;
  ObservationsTable = Meteor.Tables.ObservationsTable;
  ProceduresTable = Meteor.Tables.ProceduresTable;
  QuestionnairesTable = Meteor.Tables.QuestionnairesTable;
  QuestionnaireResponsesTable = Meteor.Tables.QuestionnaireResponsesTable;
})


//====================================================================================
// Data Cursors



let AllergyIntolerances;
let CarePlans;
let CareTeams;
let Consents;
let Compositions;
let Conditions;
let Devices;
let Encounters;
let Immunizations;
let Locations;
let Medications;
let MedicationRequests;
let Observations;
let Procedures;
let Patients;
let Questionnaires;
let QuestionnaireResponses;

Meteor.startup(async function(){
  AllergyIntolerances = Meteor.Collections.AllergyIntolerances;
  CarePlans = Meteor.Collections.CarePlans;
  CareTeams = Meteor.Collections.CareTeams;
  Consents = Meteor.Collections.Consents;
  Compositions = Meteor.Collections.Compositions;
  Conditions = Meteor.Collections.Conditions;
  Encounters = Meteor.Collections.Encounters;
  Immunizations = Meteor.Collections.Immunizations;
  Locations = Meteor.Collections.Locations;
  Medications = Meteor.Collections.Medications;
  MedicationRequests = Meteor.Collections.MedicationRequests;
  Observations = Meteor.Collections.Observations;
  Patients = Meteor.Collections.Patients;
  Procedures = Meteor.Collections.Procedures;
  Questionnaires = Meteor.Collections.Questionnaires;
  QuestionnaireResponses = Meteor.Collections.QuestionnaireResponses;
})

//====================================================================================
// Main Function  

function PatientChart(props){
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

  let [allergyIntolerancesPage, setAllergyIntolerancesPage] = useState(0);
  let [careTeamsPage, setCareTeamsPage] = useState(0);
  let [carePlansPage, setCarePlansPage] = useState(0);
  let [conditionsPage, setConditionsPage] = useState(0);
  let [consentsPage,   setConsentsPage] = useState(0);
  let [devicesPage, setDevicesPage] = useState(0);
  let [encountersPage, setEncountersPage] = useState(0);
  let [immunizationsPage, setImmunizationsPage] = useState(0);
  let [locationsPage, setLocationsPage] = useState(0);
  let [medicationsPage, setMedicationsPage] = useState(0);  
  let [observationsPage, setObservationsPage] = useState(0);
  let [proceduresPage, setProceduresPage] = useState(0);
  let [patientsPage, setPatientsPage] = useState(0);
  let [questionnairesPage, setQuestionnairesPage] = useState(0);
  let [questionnaireResponsesPage, setQuestionnaireResponsesPage] = useState(0);

  let [includeAllergyIntolerances, setIncludeAllergyIntolerances] = useState(true);
  let [includeCareTeams, setIncludeCareTeams] = useState(true);
  let [includeCarePlans, setIncludeCarePlans] = useState(true);
  let [includeConditions, setIncludeConditions] = useState(true);
  let [includeConsents, setIncludeConsents] = useState(true);
  let [includeDevices, setIncludeDevices] = useState(true);
  let [includeEncounters, setIncludeEncounters] = useState(true);
  let [includeImmunizations, setIncludeImmunizations] = useState(true);
  let [includeLocations, setIncludeLocations] = useState(true);
  let [includeMedications, setIncludeMedications] = useState(true);
  let [includeObservations, setIncludeObservations] = useState(true);
  let [includeProcedures, setIncludeProcedures] = useState(true);
  let [includePastIllnessHistory, setIncludePastIllnessHistory] = useState(true);
  let [includeVitalSigns, setIncludeVitalSigns] = useState(true);
  let [includeExamResults, setIncludeExamResults] = useState(true);
  let [includeQuestionnaires, setIncludeQuestionnaires] = useState(true);
  let [includeQuestionnaireResponses, setIncludeQuestionnaireResponses] = useState(true);

  let [editorText, setEditorText] = useState("");



  //----------------------------------------------------------------------
  // SMART on FHIR State Variables

  import jwt from 'jsonwebtoken';
  import moment from 'moment';

  let [serverCapabilityStatement, setServerCapabilityStatement] = useState("");
  let [wellKnownSmartConfig, setWellKnownSmartConfig] = useState("");
  let [smartAccessToken, setSmartAccessToken] = useState("");
  let [fhirPatient, setFhirPatient] = useState("");

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


  let selectedPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, [])

  let innerWidth = useTracker(function(){
    return Session.get('innerWidth');
  }, [])



  useEffect(function(){

    fetchCapabilityStatement();

    Session.set('QuestionnaireResponsesPage.onePageLayout', false);
  }, [])


  
  //------------------------------------------------------------------------------------------------------
  // Data Cursors
  
  if(AllergyIntolerances){
    data.allergyIntolerances = useTracker(function(){
      return AllergyIntolerances.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
    }, [])    
  }
  if(CareTeams){
    data.careTeams = useTracker(function(){
      return CareTeams.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
    }, [])    
  }
  if(CarePlans){
      data.carePlans = useTracker(function(){
        return CarePlans.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])    
  }
  if(Consents){
      data.consents = useTracker(function(){
        return Consents.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])    
  }
  if(Conditions){
      data.conditions = useTracker(function(){
        return Conditions.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])    
  }
  if(Devices){
    data.devices = useTracker(function(){
        return Devices.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
    }, [])    
  }
  if(Encounters){
      data.encounters = useTracker(function(){
          return Encounters.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }
  if(Immunizations){
      data.immunizations = useTracker(function(){
          return Immunizations.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }
  if(Locations){
      data.locations = useTracker(function(){
          return Locations.find().fetch()
      }, [])   
  }
  if(Medications){
    data.medications = useTracker(function(){
        return Medications.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
    }, [])    
  }
  if(Procedures){
      data.procedures = useTracker(function(){
          return Procedures.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }
  if(Observations){
      data.observations = useTracker(function(){
          return Observations.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }

  if(Questionnaires){
      data.questionnaires = useTracker(function(){
          return Questionnaires.find().fetch()
      }, [])   
  }
  if(QuestionnaireResponses){
      data.questionnaireResponses = useTracker(function(){
          return QuestionnaireResponses.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }

  //----------------------------------------------------------------------
  // Functions

  function openLink(url){
    console.log("openLink", url);

    navigate(url, {replace: true});
  }

  async function fetchCapabilityStatement(){
    console.log('fetchCapabilityStatement');

    await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/metadata?_format=json", {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Epic-Client-ID": get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''),
      }
    }).then(response => response.json())
    .then(result => {
      console.log('fetch.get /metadata result', result)
      if(result){
        setServerCapabilityStatement(result);
        fetchWellKnownSmartConfig();
      } 
    }).catch((error) => {
      console.error('fetch.get /metadata error', error)
    });

  }
  async function fetchWellKnownSmartConfig(callback){
    console.log('fetchWellKnownSmartConfig');

    await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/.well-known/smart-configuration", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    .then(async function(result){
      console.log('fetch.get /.well-known/smart-configuration result', result)
      setWellKnownSmartConfig(result);

      exchangeCodeForAccessToken(result);

    }).catch((error) => {
      console.error('fetch.get /.well-known/smart-configuration error', error)
    });
  }
  async function exchangeCodeForAccessToken(wellKnownSmartConfig){
    console.info('exchangeCodeForAccessToken')
    console.info('exchangeCodeForAccessToken.url', get(wellKnownSmartConfig, 'token_endpoint'))


    // Retrieve from Local Storage
    const codeVerifier = localStorage.getItem('pkce_code_verifier');

    // // OR Retrieve from Session Storage
    // const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

    
    let payload = {
      code: encodeURIComponent(searchParams.get('code')),
      grant_type: encodeURIComponent('authorization_code'),
      redirect_uri: encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')),
      client_id: encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''))
      // scope: encodeURIComponent(get(firstSmartConfig, 'scope', 'openid profile fhirUser'))
    }

    if(codeVerifier){
      payload.code_verifier = encodeURIComponent(codeVerifier)
    }

    console.info('exchangeCodeForAccessToken.code', searchParams.get('code'))
    console.info('exchangeCodeForAccessToken.payload', payload)
    
    const decodedCode = jwt.decode(searchParams.get('code'));
    console.info('exchangeCodeForAccessToken.decodedCode', decodedCode);

    // Convert to human-readable dates
    if(get(decodedCode, 'iat')){
      const issuedAtDate = moment.unix(decodedCode.iat).format('YYYY-MM-DD HH:mm:ss');
      console.log(`Issued At:  ${issuedAtDate}`);
    }

    const nowDate = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log(`Now:        ${nowDate}`);

    if(get(decodedCode, 'exp')){
      const expirationDate = moment.unix(decodedCode.exp).format('YYYY-MM-DD HH:mm:ss');
      console.log(`Expiration: ${expirationDate}`);
    }


    // code_verifier
    // 47f39e65a70db0e5a707f8dc2e58ee938b598c23617ebe3fcce657b77a2ed6b0
  
    
    // code-challenge
    // CUbiZl2t0ZPNYsclnnfFARcMuMUbQ0Qbsom-dUgz4EA
    
    // let stringEncodedData = "grant_type=authorization_code&code=" + searchParams.get('code') + '&redirect_uri=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')) + '&client_id=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].client_id', '')) + '&scope=' + encodeURIComponent(get(firstSmartConfig, 'scope', 'openid profile fhirUser'))
    let stringEncodedData = "grant_type=authorization_code&code=" + searchParams.get('code') + '&redirect_uri=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')) + '&client_id=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].client_id', '')) + '&code_verifier=' + encodeURIComponent(codeVerifier) 
    console.info('exchangeCodeForAccessToken.stringEncodedData', stringEncodedData);


    // grant_type=authorization_code&code=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ1cm46b2lkOjEuMi44NDAuMTE0MzUwLjEuMTMuMC4xLjcuMy42ODg4ODQuMTAwIiwiY2xpZW50X2lkIjoiZGI2ODNlZGYtOGM1Ny00MzIyLThlMmItZGZjMGM0YWM2MmY2IiwiZXBpYy5lY2kiOiJ1cm46ZXBpYzpPcGVuLkVwaWMtY3VycmVudCIsImVwaWMubWV0YWRhdGEiOiJfSGkteTFsQ051cVZhV3NZSEM2SU12UFI1aDEwZDdwV1hKUTZhR0YxbDdIcnotVVc1aDNRaU1va3pWQUJVVGdYN3NTbjF5dmtTb1ZqTTVNR3RPRTlIOEpXQkRCSFk0ZTQ2OEE4S2FpVFhaTnJhSHFGeFFQTF96Yk1md1p2NzJ2bSIsImVwaWMudG9rZW50eXBlIjoiY29kZSIsImV4cCI6MTcyNTExNTg4MywiaWF0IjoxNzI1MTE1NTgzLCJpc3MiOiJ1cm46b2lkOjEuMi44NDAuMTE0MzUwLjEuMTMuMC4xLjcuMy42ODg4ODQuMTAwIiwianRpIjoiOWY5ODg5ZTAtZWQ5NC00NjkxLWJlM2QtMTU1MzBjNGNkNzZiIiwibmJmIjoxNzI1MTE1NTgzLCJzdWIiOiJlYjRHaWE3RnlpanRQbVhrcnRqUnBQdzMifQ.VfyPMjE-9ekfgJiEUk6M5b0ChL7kDhZQfAePRgPbm_lkJPYtmMemGK_Or-YxTCa0to0OkEYj9WvObl4Nj0gicbNevEpgOh1lKrt0JhPeUINU6n28xYzR96g3HvY9YmC1L9vo10Qpza1qiHK_9TBU5B4UuRQSWLkT9skx8pvkAk-KrGpwKuh6bdcEFWcVHJ1lqqFJRPSJBo65XYODEZgn7GLNdYtzMKLooBMvypwmCkXDUD10HgooRScdOzvQYa1n5crnfrfVnSUxSH84-5EALL38MTBZGRZfgme8nrcsSDa_k31Ahvq3L9v2bmbQ0Tkz2TI8fQ-tv9qRpkx4xzJl9g&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcms-home-page&client_id=db683edf-8c57-4322-8e2b-dfc0c4ac62f6&scope=openid%20profile%20fhirUser



    // we don't want to generate failed authentication attempts from basic page renders
    if(searchParams.get('code')){


      // try {
      //   const response = await fetch(get(wellKnownSmartConfig, 'token_endpoint'), {
      //     method: 'POST',
      //     body: stringEncodedData,
      //     headers: {
      //       'Content-Type': 'application/x-www-form-urlencoded'
      //     },
      //     agent: httpsAgent // Use httpAgent if your endpoint is HTTP
      //   });
        
      //   const result = await response.json();
      
      //   if (response.ok) {
      //     console.log('Token exchange successful:', result);
      //     // Handle success
      //   } else {
      //     console.error('Token exchange failed:', result);
      //     // Handle error
      //   }
      // } catch (error) {
      //   console.error('Fetch error:', error);
      // }
      
      // okay, we have a code, let's try to exchange it for an access token
      await HTTP.post(get(wellKnownSmartConfig, 'token_endpoint'), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        content: stringEncodedData
        // content: new URLSearchParams(payload).toString()
      }, function(error, result){
        if(error){
          console.error('HTTP.post /token error', error)
        }
        if(result){
          console.log('HTTP.post /token result', result)
          setSmartAccessToken(get(result, 'data'));
  
          fetchPatient(get(result, 'data.patient'), get(result, 'data.access_token'));
        }
      });
    }
  }
  async function fetchPatient(patientId, accessToken){
    console.log('fetchPatient')
    console.log('fetchPatient.url', get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Patient")
    console.log('fetchPatient.url', accessToken)

    await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Patient/" + patientId + "?_format=json", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }
    }).then(response => response.json())
    .then(async function(result){
      console.log('fetch.get /Patient result', result)
      if(result){
        if(typeof result === "object"){
          setFhirPatient(result);
  
          fetchPatientData(result, accessToken)
  
          Session.set('selectedPatientId', get(result, 'id'));
          Session.set('selectedPatient', result);
  
          if(!Patients.findOne({id: get(result, 'id')})){
            await Patients._collection.insertAsync(result);     
          }
        } else if (typeof result === "string") {
          setFhirPatient(JSON.parse(result));
  
          fetchPatientData(JSON.parse(result), accessToken)
  
          Session.set('selectedPatientId', get(JSON.parse(result), 'id'));
          Session.set('selectedPatient', JSON.parse(result));
  
          if(!Patients.findOne({id: get(JSON.parse(result), 'id')})){
            await Patients._collection.insertAsync(JSON.parse(result));     
            setLastUpdated(new Date());
          }
        }
      } else {
        console.log('no result return')
      }
      
    }).catch((error) => {
      console.error('fetch.get /Patient error', error)
    });

  }
  async function fetchPatientData(fhirPatient, accessToken) {
    console.log("---------------------------------------------------------------------")
    console.log("SMART ON FHIR");
    console.log("fhirPatient", fhirPatient);
  
    if(fhirPatient){
      //try {
  
      var httpHeaders = { headers: {
        'Accept': "application/json,application/fhir+json",
        "Authorization": "Bearer " + accessToken
      }}

      console.log('----------------------------  Condition  -------------------------------')

      const conditionQuery = new URLSearchParams();
      conditionQuery.set("patient", get(fhirPatient, 'id'));
      console.debug('Condition Query', conditionQuery);
  
      // without leading slash seems to work with Cerner, but not with Epic (?)
      let conditionUrl = '/Condition?' + conditionQuery.toString()
      console.debug('conditionUrl', conditionUrl);
  
      let conditionUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Condition?patient=" + get(fhirPatient, 'id');
      console.info('FaaPage.conditionUrlAssembled:    ', conditionUrlAssembled);
  
      if(conditionUrlAssembled){        

        console.debug('FaaPage.conditionUrlAssembled.httpHeaders:    ', httpHeaders);
        
        await fetch(conditionUrlAssembled, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': "application/json,application/fhir+json",
            "Authorization": "Bearer " + accessToken    
          }
        }).then(response => response.json())
        .then(async function(result){
          let parsedConditionBundle;
          
          if(typeof result === "string"){
            parsedConditionBundle = JSON.parse(result);
          } else if (typeof result === "object"){
            parsedConditionBundle = result;

            console.info('CmsPage.parsedConditionBundle', parsedConditionBundle);       
          
            if(parsedConditionBundle.resourceType === "Bundle"){
              parsedConditionBundle.entry.forEach(async function(entry){
                if(!Conditions.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'Condition'){
                  await Conditions._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                  setLastUpdated(new Date());
                }
              });
            }  
          }
        }).catch((error) => {
          console.error('fetch.get().conditionUrlAssembled.error', error);
        });
      }
        
  
      console.log('----------------------------  Encounter  -------------------------------')

      const encounterQuery = new URLSearchParams();
      encounterQuery.set("patient", get(fhirPatient, 'id'));
      // console.log('Encounter Query', encounterQuery);

      // without leading slash seems to work with Cerner, but not with Epic (?)
      // let encounterUrl = '/Encounter?' + encounterQuery.toString();
      // console.log('encounterUrl', encounterUrl);
  
      let encounterUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Encounter?patient=" + get(fhirPatient, 'id');
      console.info('FaaPage.encounterUrlAssembled:    ', encounterUrlAssembled);
  
      if(encounterUrlAssembled){        

        console.debug('FaaPage.encounterUrlAssembled.httpHeaders:    ', httpHeaders);
        
        await fetch(encounterUrlAssembled, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': "application/json,application/fhir+json",
            "Authorization": "Bearer " + accessToken    
          }
        }).then(response => response.json())
        .then(async function(result){
          let parsedEncounterBundle;
          if(typeof result === "string"){
            parsedEncounterBundle = JSON.parse(result);
          } else if (typeof result === "object"){
            parsedEncounterBundle = result;

            console.info('CmsPage.parsedEncounterBundle', parsedEncounterBundle);       
          
            if(parsedEncounterBundle.resourceType === "Bundle"){
              parsedEncounterBundle.entry.forEach(async function(entry){
                if(!Encounters.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'Encounter'){
                  await Encounters._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                  setLastUpdated(new Date());
                }
              });
            }  
          }          
        }).catch((error) => {
          console.error('fetch.get().encounterUrlAssembled.error', error)
        });
      }

        
  
  
      console.log('----------------------------  Immunization  -------------------------------')
        
      const immunizationQuery = new URLSearchParams();
      immunizationQuery.set("patient", get(fhirPatient, 'id'));
      // console.log('Immunization Query', immunizationQuery);
  
      // without leading slash seems to work with Cerner, but not with Epic (?)
      let immunizationUrl = '/Immunization?' + immunizationQuery
      // console.log('immunizationUrl', immunizationUrl);
  
      let immunizationUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Immunization?patient=" + get(fhirPatient, 'id');
      console.info('FaaPage.immunizationUrlAssembled:    ', immunizationUrlAssembled);
  
      if(immunizationUrlAssembled){        

        console.debug('FaaPage.immunizationUrlAssembled.httpHeaders:    ', httpHeaders);
        
        await fetch(immunizationUrlAssembled, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': "application/json,application/fhir+json",
            "Authorization": "Bearer " + accessToken    
          }
        }).then(response => response.json())
        .then(async function(result){

          let parsedImmunizationBundle;
          if(typeof result === "string"){
            parsedImmunizationBundle = JSON.parse(result);
          } else if (typeof result === "object"){
            parsedImmunizationBundle = result;

            console.info('FaaPage.parsedImmunizationBundle', parsedImmunizationBundle);       
          
            if(parsedImmunizationBundle.resourceType === "Bundle"){
              parsedImmunizationBundle.entry.forEach(async function(entry){
                if(!Immunizations.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'Immunization'){
                  await Immunizations._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                  setLastUpdated(new Date());
                }
              });
            }
          }          
        }).catch((error) => {
          console.error('fetch.get().encounterUrlAssembled.error', error)
        });
      }


          
      console.log('----------------------------  MedicationRequest  -------------------------------')

      const medicationRequestQuery = new URLSearchParams();
      medicationRequestQuery.set("patient", get(fhirPatient, 'id'));
      // console.log('MedicationRequest Query', medicationRequestQuery);

      // without leading slash seems to work with Cerner, but not with Epic (?)
      let medicationRequestUrl = '/MedicationRequest?' + medicationRequestQuery
      // console.log('medicationRequestUrl', medicationRequestUrl);
  

      let medicationRequestUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/MedicationRequest?patient=" + get(fhirPatient, 'id');
      console.info('FaaPage.medicationRequestUrlAssembled:    ', medicationRequestUrlAssembled);
  
      if(medicationRequestUrlAssembled){        

        console.debug('FaaPage.medicationRequestUrlAssembled.httpHeaders:    ', httpHeaders); 
        
        await fetch(medicationRequestUrlAssembled, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': "application/json,application/fhir+json",
            "Authorization": "Bearer " + accessToken    
          }
        }).then(response => response.json())
        .then(async function(result){
          let parsedMedicationRequestBundle;
          if(typeof result === "string"){
            parsedMedicationRequestBundle = JSON.parse(result);
          } else if (typeof result === "object"){
            parsedMedicationRequestBundle = result;

            console.info('FaaPage.parsedMedicationRequestBundle', parsedMedicationRequestBundle);       
          
            if(parsedMedicationRequestBundle.resourceType === "Bundle"){
              parsedMedicationRequestBundle.entry.forEach(async function(entry){
                if(!MedicationRequests.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'MedicationRequest'){
                  await MedicationRequests._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                  setLastUpdated(new Date());
                }
              });
            }
          }          
        }).catch((error) => {
          console.error('fetch.get().medicationRequestUrlAssembled.error', error)
        });

      }

          
        console.log('----------------------------  Observation  -------------------------------')

  
          const observationQuery = new URLSearchParams();
  
          observationQuery.set("patient", get(fhirPatient, 'id'));
          observationQuery.set("category", "vital-signs");    
  
          // console.log('Vital Signs Query', observationQuery);
      
          // without leading slash seems to work with Cerner, but not with Epic (?)
          let vitalSignsUrl = '/Observation?' + observationQuery.toString();
          // console.log('vitalSignsUrl', vitalSignsUrl);
  
          // client.request(vitalSignsUrl, { pageLimit: 0, flat: true }).then(observations => {
          //   if(observations){
          //     // console.log('PatientAutoDashboard.observations.vital-signs', observations)
          //     observations.forEach(observation => {
          //       Observations._collection.upsert({id: observation.id}, {$set: observation}, {validate: false, filter: false});
          //     });
          //   }
          // });
  
          observationQuery.delete("category");    
          observationQuery.set("category", "laboratory");    
  
          // console.log('Vital Signs Query', observationQuery);
      
          // without leading slash seems to work with Cerner, but not with Epic (?)
          let laboratoryUrl = '/Observation?' + observationQuery.toString();
          // console.log('laboratoryUrl', laboratoryUrl);
  
          // client.request(laboratoryUrl, { pageLimit: 0, flat: true }).then(observations => {
          //   if(observations){
          //     // console.log('PatientAutoDashboard.observations.laboratory', observations)
          //     observations.forEach(observation => {
          //       Observations._collection.upsert({id: observation.id}, {$set: observation}, {validate: false, filter: false});
          //     });
          //   }
          // });
        
  
          console.log('----------------------------  Procedure  -------------------------------')

        
          const procedureQuery = new URLSearchParams();
          procedureQuery.set("patient", get(fhirPatient, 'id'));
          // console.log('Procedure Query', procedureQuery);
  
          // without leading slash seems to work with Cerner, but not with Epic (?)
          let procedureUrl = '/Procedure?' + procedureQuery
          // console.log('procedureUrl', procedureUrl);
  

          let procedureUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Procedure?patient=" + get(fhirPatient, 'id');
          console.info('FaaPage.procedureUrlAssembled:    ', procedureUrlAssembled);
      
          if(procedureUrlAssembled){        
    
            console.debug('FaaPage.procedureUrlAssembled.httpHeaders:    ', httpHeaders);
            
            await fetch(procedureUrlAssembled, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': "application/json,application/fhir+json",
                "Authorization": "Bearer " + accessToken    
              }
            }).then(response => response.json())
            .then(async function(result){
              let parsedProcedureBundle;
              if(typeof result === "string"){
                parsedProcedureBundle = JSON.parse(result);
              } else if (typeof result === "object"){
                parsedProcedureBundle = result;

                console.info('FaaPage.parsedProcedureBundle', parsedProcedureBundle);       
              
                if(parsedProcedureBundle.resourceType === "Bundle"){
                  parsedProcedureBundle.entry.forEach(async function(entry){
                    if(!Procedures.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'Procedure'){
                      await Procedures._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                      setLastUpdated(new Date());
                    }
                  });
                }  
              }              
            }).catch((error) => {
              console.error('fetch.get().procedureUrlAssembled.error', error)
            });
          }

      // } catch (error) {
      //     alert("We had an error fetching data.", error)
      // }
    }
  }

  function loadSamplePatient(){
    console.log(Daniel);

    MedicalRecordImporter.importBundle(Daniel, function(){
      Session.set('selectedPatientId', get(Patients.findOne(), 'id'));
      Session.set('selectedPatient', Patients.findOne());
    });

  }

  //----------------------------------------------------------------------
  // Cards

  let patientDemographicsContent = [];
  if(typeof data.selectedPatient === "object"){
    patientDemographicsContent.push(<PatientCard patient={data.selectedPatient} />)
    patientDemographicsContent.push(<DynamicSpacer />);
  }

  let allergyIntoleranceContent = [];
  if(data.allergyIntolerances.length > 0){
      allergyIntoleranceContent.push(<CardContent>
          <AllergyIntolerancesTable
              careTeams={data.allergyIntolerances}
              hideCategory={true}
              hideIdentifier={true}
              hideTextIcon={true}
              count={data.allergyIntolerances.length}
              page={allergyIntolerancesPage}   
              rowsPerPage={5}    
              onSetPage={function(newPage){
                  setAllergyIntolerancesPage(newPage);
              }}         
          />
      </CardContent>)
      allergyIntoleranceContent.push(<CardActions>
          <Button size="small" color={includeAllergyIntolerances ? "primary" : "inherit"} onClick={function(){
          setIncludeAllergyIntolerances(!includeAllergyIntolerances);
          // gatherTextNormalForm();
        }}>View Allergy Intolerances</Button>
      </CardActions>)
      
  }
    let careTeamContent = [];
  if(data.careTeams.length > 0){
      careTeamContent.push(<CardContent>
          <CareTeamsTable
              careTeams={data.careTeams}
              hideCategory={true}
              hideIdentifier={true}
              hideTextIcon={true}
              count={data.careTeams.length}
              page={careTeamsPage}   
              rowsPerPage={5}    
              onSetPage={function(newPage){
                  setCareTeamsPage(newPage);
              }}         
          />
      </CardContent>)
      careTeamContent.push(<CardActions>
        <Button size="small" color={includeCareTeams ? "primary" : "inherit"} onClick={function(){
          setIncludeCareTeams(!includeCareTeams);
          // gatherTextNormalForm();
        }}>Include: {includeCareTeams ? "YES" : "NO"} </Button> 
      </CardActions>)  
  }
  let carePlansContent = [];
  if(data.carePlans.length > 0){
      carePlansContent.push(<CardContent>
          <CarePlansTable
              locations={data.locations}
              count={data.locations.length}
              page={carePlansPage}
              rowsPerPage={5}
              hideTextIcon={true}
              onSetPage={function(newPage){
                  setCarePlansPage(newPage);
              }}
          />
      </CardContent>)  
      carePlansContent.push(<CardActions>
        <Button size="small" color={includeCarePlans ? "primary" : "inherit"} onClick={function(){
          setIncludeCarePlans(!includeCarePlans);
          // gatherTextNormalForm();
        }}>Include: {includeCarePlans ? "YES" : "NO"} </Button>
      </CardActions>)                 
  }

  let problemsListContent = [];
  if(data.conditions.length > 0){
      problemsListContent.push(<Card>
        <CardHeader title={"Problems List"} />
        <CardContent>
          <ConditionsTable
              conditions={data.conditions}
              hideCheckbox={true}
              hideActionIcons={true}
              hidePatientName={true}
              hidePatientReference={true}
              hideAsserterName={true}
              hideEvidence={true}
              hideBarcode={true}
              hideDates={false}
              hideTextIcon={true}
              count={data.conditions.length}
              page={conditionsPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setConditionsPage(newPage);
              }}
          />                                        
        </CardContent>
        <CardActions>
          <Button size="small" color={includeConditions ? "primary" : "inherit"} onClick={function(){
            setIncludeConditions(!includeConditions);
            // gatherTextNormalForm();
          }}>Include: {includeConditions ? "YES" : "NO"} </Button>
          {/* <Button size="small" color="primary" onClick={function(){
            handleParseCollectionOfResources(Conditions.find().fetch())
          }}>Create text</Button> */}
        </CardActions>
      </Card>)   
      problemsListContent.push(<DynamicSpacer />);                
  }



  let pastIllnessHistoryContent = [];
  if(data.conditions.length > 0){
      pastIllnessHistoryContent.push(<Card>
        <CardHeader title={"Past Illness History"} />
        <CardContent>
          <ConditionsTable
              conditions={data.conditions}
              hideCheckbox={true}
              hideActionIcons={true}
              hidePatientName={true}
              hidePatientReference={true}
              hideAsserterName={true}
              hideEvidence={true}
              hideBarcode={true}
              hideDates={false}
              hideTextIcon={true}
              count={data.conditions.length}
              page={conditionsPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setConditionsPage(newPage);
              }}
          />                                        
        </CardContent>
        <CardActions>
          <Button size="small" color={includePastIllnessHistory ? "primary" : "inherit"} onClick={function(){
            setIncludePastIllnessHistory(!includePastIllnessHistory);
          }}>Include: {includePastIllnessHistory ? "YES" : "NO"} </Button>
          {/* <Button size="small" color="primary" onClick={function(){
            handleParseCollectionOfResources(Conditions.find().fetch())
          }}>Create text</Button> */}
        </CardActions>
      </Card>)   
      pastIllnessHistoryContent.push(<DynamicSpacer />)              
  }


  let consentContent = [];
  if(data.consents.length > 0){
      consentContent.push(<Card>
        <CardHeader title={"Consents"} />
        <CardContent>
          <ConsentsTable
              hideDates={true}
              hidePeriodStart={true}
              hidePeriodEnd={true}
              hideOrganization={true}
              hideCategory={true}
              hidePatientName={isMobile}
              hideTextIcon={true}
              consents={data.consents}
              count={data.consents.length}
              page={consentsPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setConsentsPage(newPage);
              }}
          />
        </CardContent>
        <CardActions>
          <Button size="small" color="primary" onClick={function(){
            setIncludeConsents(!includeConsents);
            // gatherTextNormalForm();
        }}>Include: {includeConsents ? "YES" : "NO"} </Button> 
        </CardActions>
      </Card>) 
      consentContent.push(<DynamicSpacer />)              
  }


  let deviceContent = [];
  if(data.devices.length > 0){
      deviceContent.push(<Card>
        <CardHeader title={"Devices"} />
        <CardContent>
          <DevicesTable
              hideDates={true}
              hidePeriodStart={true}
              hidePeriodEnd={true}
              hideOrganization={true}
              hideCategory={true}
              hidePatientName={isMobile}
              hideTextIcon={true}
              consents={data.devices}
              count={data.devices.length}
              page={devicesPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setDevicesPage(newPage);
              }}
          />
        </CardContent>
        <CardActions>
          <Button size="small" color={includeDevices ? "primary" : "inherit"} onClick={function(){
            setIncludeDevices(!includeDevices);
            // gatherTextNormalForm();
          }}>Include: {includeDevices ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>)
      deviceContent.push(<DynamicSpacer />)              
  }

  let encountersContent = [];
  if(data.encounters.length > 0){
      encountersContent.push(<Card>
        <CardHeader title={"Encounters"} />
        <CardContent>
          <EncountersTable
              encounters={data.encounters}
              hideCheckboxes={true}
              hideActionIcons={true}
              hideSubjects={true}
              hideType={false}
              hideTypeCode={false}
              hideReason={isMobile}
              hideReasonCode={isMobile}
              hideHistory={true}
              hideEndDateTime={true}
              hideTextIcon={true}
              count={data.encounters.length}
              page={encountersPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setEncountersPage(newPage);
              }}
          />
        </CardContent>
        <CardActions>
          <Button size="small" color={includeEncounters ? "primary" : "inherit"} onClick={function(){
            setIncludeEncounters(!includeEncounters);
            // gatherTextNormalForm();
          }}>Include: {includeEncounters ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>)
      encountersContent.push(<DynamicSpacer />) 
  }



  let locationsContent = [];
  if(data.locations.length > 0){
      locationsContent.push(<Card>
        <CardHeader title={"Locations"} />
        <CardContent>
          <LocationsTable
              locations={data.locations}
              count={data.locations.length}
              page={locationsPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setLocationsPage(newPage);
              }}
          />
        </CardContent>
        <CardActions>
          <Button size="small" color={includeLocations ? "primary" : "inherit"} onClick={function(){
            setIncludeLocations(!includeLocations);
          }}>Include: {includeLocations ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>)   
      locationsContent.push(<DynamicSpacer />)                  
  }
  let immunizationsContent = [];
  if(data.immunizations.length > 0){
      immunizationsContent.push(<Card>
        <CardHeader title={"Immunizations"} disabled={true} />
        <CardContent disabled={true}>
          <ImmunizationsTable
              immunizations={data.immunizations}
              hideCheckbox={true}
              hideIdentifier={true}
              hideActionIcons={true}
              hidePatient={true}
              hidePerformer={true}
              hideVaccineCode={false}
              hideVaccineCodeText={false}
              hideTextIcon={true}
              count={data.immunizations.length}
              page={immunizationsPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setImmunizationsPage(newPage);
              }}
          />                                        
        </CardContent>
        <CardActions>
          <Button size="small" color={includeImmunizations ? "primary" : "inherit"} onClick={function(){
            setIncludeImmunizations(!includeImmunizations);
          }}>Include: {includeImmunizations ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>)
      immunizationsContent.push(<DynamicSpacer />)
  }

  let medicationContent = [];
  if(data.medications.length > 0){
      medicationContent.push(<Card>
        <CardHeader title={"Medications"} disabled={true} />
        <CardContent>
          <MedicationsTable
              hideDates={true}
              hidePeriodStart={true}
              hidePeriodEnd={true}
              hideOrganization={true}
              hideCategory={true}
              hidePatientName={isMobile}
              hideTextIcon={true}
              consents={data.medications}
              count={data.medications.length}
              page={medicationsPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setMedicationsPage(newPage);
              }}
          />
        </CardContent>
        <CardActions>
          <Button size="small" color={includeMedications ? "primary" : "inherit"} onClick={function(){
            setIncludeMedications(!includeMedications);
          }}>Include: {includeMedications ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>) 
      medicationContent.push(<DynamicSpacer />)  
  }
  let examResultsContent = [];
  if(data.observations.length > 0){
      examResultsContent.push(<CardHeader title={"Exam & Lab Result"} />);
      examResultsContent.push(<Card>
        <CardContent>
          <ObservationsTable 
              observations={data.observations}
              hideCheckbox={true}
              hideActionIcons={true}
              hideSubject={true}
              hideDevices={true}
              hideValue={false}
              hideBarcode={true}
              hideDenominator={true}
              hideNumerator={true}
              hideTextIcon={true}
              multiline={true}
              multiComponentValues={true}
              hideSubjectReference={true}
              count={data.observations.length}
              page={observationsPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setObservationsPage(newPage);
              }}
          />                                                                                                           
        </CardContent>
        <CardActions>
          <Button size="small" color={includeObservations ? "primary" : "inherit"} onClick={function(){
            setIncludeObservations(!includeObservations);
          }}>Include: {includeExamResults ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>) 
      examResultsContent.push(<DynamicSpacer />)                                   
  }

  let vitalSignsContent = [];
  if(data.observations.length > 0){
      vitalSignsContent.push(<Card>
        <CardHeader title={"Vital Signs"} />
        <CardContent>
          <ObservationsTable 
              observations={data.observations}
              hideCheckbox={true}
              hideActionIcons={true}
              hideSubject={true}
              hideDevices={true}
              hideValue={false}
              hideBarcode={true}
              hideDenominator={true}
              hideNumerator={true}
              hideTextIcon={true}
              multiline={true}
              multiComponentValues={true}
              hideSubjectReference={true}
              count={data.observations.length}
              page={observationsPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setObservationsPage(newPage);
              }}
          />                                                                                                           
        </CardContent>
        <CardActions>
          <Button size="small" color={includeObservations ? "primary" : "inherit"} onClick={function(){
            setIncludeObservations(!includeObservations);
          }}>Include: {includeVitalSigns ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>) 
      vitalSignsContent.push(<DynamicSpacer />)                                     
  }



  let proceduresContent = [];
  if(data.procedures.length > 0){
      proceduresContent.push(<Card>
        <CardHeader title={"Procedures History"} />
        <CardContent>
          <ProceduresTable 
              procedures={data.procedures}
              hideCheckbox={true}
              hideActionIcons={true}
              hideIdentifier={true}
              hideCategory={true}
              hideSubject={true}
              hideBodySite={true}
              hideCode={isMobile}
              hidePerformer={isMobile}
              hideNotes={isMobile}
              hidePerformedDateEnd={true}
              hideSubjectReference={true}
              hideTextIcon={true}
              hideBarcode={true}
              count={data.procedures.length}
              page={proceduresPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setProceduresPage(newPage);
              }}
          />                                                                                                           
        </CardContent>
        <CardActions>
          <Button size="small" color={includeProcedures ? "primary" : "inherit"} onClick={function(){
            setIncludeProcedures(!includeProcedures);
          }}>Include: {includeProcedures ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>)  
      proceduresContent.push(<DynamicSpacer />);               
  }


  let questionnairesContent = [];
  if(data.questionnaires.length > 0){
      questionnairesContent.push(<Card>
        <CardHeader title={"Questionnaires"} />
        <CardContent>
          <QuestionnairesTable
              questionnaires={data.questionnaires}
              count={data.questionnaires.length}
              hideSubject={isMobile}
              hideSubjectReference={isMobile}
              hideIdentifier={true}
              page={questionnairesPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setQuestionnairesPage(newPage);
              }}
          />
        </CardContent>
        <CardActions>
          <Button size="small" color={includeQuestionnaires ? "primary" : "inherit"} onClick={function(){
            setIncludeQuestionnaires(!includeQuestionnaires);
          }}>Include: {includeQuestionnaires ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>)                    
      questionnairesContent.push(<DynamicSpacer />)  
  }

  let questionnaireResponsesContent = [];
  if(data.questionnaireResponses.length > 0){
      questionnaireResponsesContent.push(<Card>
        <CardHeader title={"Questionnaire Responses"} />
        <CardContent>
          <QuestionnaireResponsesTable
              questionnaireResponses={data.questionnaireResponses}
              count={data.questionnaireResponses.length}
              hideCheckbox={true}
              hideActionIcons={true}
              hideIdentifier={true}
              hideSourceReference={isMobile}
              page={questionnaireResponsesPage}
              rowsPerPage={5}
              onSetPage={function(newPage){
                  setQuestionnaireResponsesPage(newPage);
              }}
          />
        </CardContent>
        <CardActions>
          <Button size="small" color="primary" style={{top: '-15px', left: '20px'}} onClick={function(){
            setIncludeQuestionnaireResponses(!includeQuestionnaireResponses);
          }}>Include: {includeQuestionnaireResponses ? "YES" : "NO"} </Button>
        </CardActions>
      </Card>)
      questionnaireResponsesContent.push(<DynamicSpacer />)
  }

  //----------------------------------------------------------------------
  // Helper Functions







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

  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let tokensUsed = 0;

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

  let patientChartContent;
    
  if(data.selectedPatient == undefined || data.selectedPatient == null || data.selectedPatient == ""){
    if(Package["mitre:data-importer"]){
      patientChartContent = <Card style={{marginBottom: '120px', width: '100%'}}>
        <CardHeader title="No Patient Data Found" />         
        <CardContent>
          <Button fullWidth variant="contained" color="primary" onClick={openLink.bind(this, '/import-data?next=patient-chart-starter')}>Select Patient File</Button>
        </CardContent>     
      </Card> 
    } else {
      patientChartContent = <Card style={{marginBottom: '120px', width: '100%'}}>
        <CardHeader title="No Patient Data Found" />         
        <CardContent>
          <Button fullWidth variant="contained" color="primary" onClick={loadSamplePatient.bind(this)}>Load Sample Patient</Button>
        </CardContent>     
      </Card> 
    }  
  } else if(typeof data.selectedPatient == "object"){

    patientChartContent = <div style={{marginBottom: '120px'}}>    
      {patientDemographicsContent}  
      {problemsListContent}                
      {proceduresContent}                              
      {immunizationsContent}                   
      {examResultsContent}                        
      {vitalSignsContent}                        
      {pastIllnessHistoryContent}                
    </div>                
  }

  let missingTextWarning = [];


  let nextPageElements;

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
    <div id='PatientChart' style={{overflow: 'scroll', height: window.innerHeight, padding: '20px'}}>
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

export default PatientChart;