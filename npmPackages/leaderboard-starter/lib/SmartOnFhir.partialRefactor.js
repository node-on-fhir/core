// https://forum.freecodecamp.org/t/how-to-create-class-methods-that-allow-function-chaining/559141
// https://stackoverflow.com/questions/1099628/how-does-basic-object-function-chaining-work-in-javascript
// https://www.calibraint.com/blog/builder-design-pattern-in-javascript

import { Meteor } from 'meteor/meteor';

import { get, concat } from 'lodash';

import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';



//====================================================================================
// Data Cursors
// 
// We want to enable all of the following.  Preferable based on the settings in the Meteor.settings.private.fhir object
// so as to enable basic tree shaking and minimize the amount of data that is loaded into the client
//

// let AllergyIntolerances;
// let CarePlans;
// let CareTeams;
// let Consents;
// let Compositions;
let Conditions;
// let Devices;
// let Encounters;
// let Immunizations;
// let Locations;
// let Medications;
// let MedicationOrders;
// let MedicationRequests;
// let MedicationStatements;
// let Observations;
// let Organizations;
// let Procedures;
let Patients;
// let Questionnaires;
// let QuestionnaireResponses;

Meteor.startup(async function(){
  // AllergyIntolerances = window.Collections.AllergyIntolerances;
  // CarePlans = window.Collections.CarePlans;
  // CareTeams = window.Collections.CareTeams;
  // Consents = window.Collections.Consents;
  // Compositions = window.Collections.Compositions;
  // Conditions = window.Collections.Conditions;
  // Devices = window.Collections.Devices;
  // Encounters = window.Collections.Encounters;
  // Immunizations = window.Collections.Immunizations;
  // Locations = window.Collections.Locations;
  // Medications = window.Collections.Medications;
  // MedicationOrders = window.Collections.MedicationOrders;
  // MedicationRequests = window.Collections.MedicationRequests;
  // MedicationStatements = window.Collections.MedicationStatements;
  // Observations = window.Collections.Observations;
  // Organizaitons = window.Collections.Organizations;
  // Procedures = window.Collections.Procedures;
  Patients = window.Collections.Patients;
  // Questionnaires = window.Collections.Questionnaires;
  // QuestionnaireResponses = window.Collections.QuestionnaireResponses;
})


//// Intended Syntax ////
//
// If we can avoid it, we shouldn't request data that we don't need.  This is a basic principle of FHIR and SMART on FHIR.  
// Perhaps we should build this query up, based on the Meteor.settings file, or what is in the /metadata CapabilityStatement.
// 

// SmartOnFhir({
//   fhirServiceUrl: 'http://example.com/R4',
//   redirect_uri: 'http://localhost:3000',
//   client_id: 'my_web_app',
//   client_secret: 'my_web_app
// })
//   .fetchCapabilityStatement()
//   .fetchWellKnownSmartConfig()
//   .exchangeCodeForAccessToken()
//   .selectPatient()
//   .fetchPatient()
//   .fetchAndSelectPatient()
//   .getResourceFrom('http://example.com/R4/Condition')
//   .getResourceFrom('http://example.com/R4/Encounter')
//   .getResourceFrom('http://example.com/R4/Immunization')
//   .getResourceFrom('http://example.com/R4/Procedure');


var SmartOnFhir = function() {
    this.#options = {
        fhirServiceUrl: '',
        redirect_uri: '',
        client_id: '',
        client_secret: '',
    };
    this.#foo = 'bar';

    this.constructor = function(smartOnFhirConfig){
        this.#options = smartOnFhirConfig;

        return this;
    }

    this.fetchCapabilityStatement = function (){
        console.log('fetchCapabilityStatement');
    
        HTTP.get(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/metadata?_format=json", {}, function(error, result){ 
          if(error){
            console.error('HTTP.get /metadata error', error)
          }
          if(result){
            console.log('HTTP.get /metadata result', result)
            let parsedData;
            if(get(result, 'data')){
              setServerCapabilityStatement(result.data);
              fetchWellKnownSmartConfig();
            } else if (get(result, 'content')) {
              setServerCapabilityStatement(JSON.parse(get(result, 'content')));
              fetchWellKnownSmartConfig();
            }
          }
        });

        return this;
    }

    this.fetchWellKnownSmartConfig = function (callback){
        console.log('fetchWellKnownSmartConfig');
    
        HTTP.get(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/.well-known/smart-configuration", {}, function(error, result){
          if(error){
            console.error('HTTP.get /.well-known/smart-configuration error', error)
          }
          if(result){
            console.log('HTTP.get /.well-known/smart-configuration result', result)
            setWellKnownSmartConfig(get(result, 'data'));
            exchangeCodeForAccessToken(get(result, 'data'));
          }
        });

        return this;
    }

    this.exchangeCodeForAccessToken = function(wellKnownSmartConfig){
        console.log('exchangeCodeForAccessToken')
        console.log('exchangeCodeForAccessToken.url', get(wellKnownSmartConfig, 'token_endpoint'))
    
        let stringEncodedData = "grant_type=authorization_code&code=" + searchParams.get('code') + '&redirect_uri=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')) + '&client_id=' + get(Meteor, 'settings.public.smartOnFhir[0].client_id', '')
        console.log('exchangeCodeForAccessToken.stringEncodedData', stringEncodedData);
        let payload = {
          code: searchParams.get('code'),
          grant_type: 'authorization_code',
          redirect_uri: encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')),
          client_id: get(Meteor, 'settings.public.smartOnFhir[0].client_id', '')
        }
        console.log('exchangeCodeForAccessToken.code', searchParams.get('code'))
        console.log('exchangeCodeForAccessToken.code', payload)
        
        // we don't want to generate failed authentication attempts from basic page renders
        if(searchParams.get('code')){
    
          // okay, we have a code, let's try to exchange it for an access token
          HTTP.post(get(wellKnownSmartConfig, 'token_endpoint'), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            content: stringEncodedData
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
        
        return this;
    }
    
    this.fetchPatient = function(patientId, accessToken){
        console.log('fetchPatient')
        console.log('fetchPatient.url', get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Patient")
        console.log('fetchPatient.url', accessToken)
    
        HTTP.get(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Patient/" + patientId + "?_format=json", {
          headers: {
            'Authorization': 'Bearer ' + accessToken
          }
        }, function(error, result){
          if(error){
            console.error('HTTP.get /Patient error', error)
          }
          if(result){
            console.log('HTTP.get /Patient result', result)
            if(get(result, 'data')){
              setFhirPatient(get(result, 'data'));
            } else if (get(result, 'content')) {
              setFhirPatient(JSON.parse(get(result, 'content')));
    
              fetchPatientData(JSON.parse(get(result, 'content')), accessToken)

              Session.set('selectedPatientId', get(JSON.parse(get(result, 'content')), 'id'));
              Session.set('selectedPatient', JSON.parse(get(result, 'content')));
    
              if(!Patients.findOne({id: get(JSON.parse(get(result, 'content')), 'id')})){
                Patients._collection.insert(JSON.parse(get(result, 'content')));     
              }
            }
          }
        });

        return this;
    }

    // shouldn't this iterate through a bunch of resource types?  
    // don't think it's actually being used right now
    this.getResourceFrom = function(url, accessToken, fhirPatient) {
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
    
            // need to reconcile with client.request() syntax above    
            HTTP.get(conditionUrlAssembled, httpHeaders, function(error, result){
              if(result){
                let parsedConditionBundle = JSON.parse(get(result, "content", {}))
                console.info('FaaPage.parsedConditionBundle', parsedConditionBundle);       
                
                if(parsedConditionBundle.resourceType === "Bundle"){
                  parsedConditionBundle.entry.forEach(function(entry){
                    if(!Conditions.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'Condition'){
                      Conditions._collection.upsert({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                    }
                  });
                }
              }
              if(error){
                console.error('HTTP.get().conditionUrlAssembled.error', error);
              }   
            })    
          }
        }

        return this;
    }

    if (this instanceof SmartOnFhir) {
        return this.SmartOnFhir;
    } else {
        return new SmartOnFhir();
    }
}

export default SmartOnFhir;

// // example usage
// var test = new SmartOnFhir();
// test.add().del();