// https://forum.freecodecamp.org/t/how-to-create-class-methods-that-allow-function-chaining/559141
// https://stackoverflow.com/questions/1099628/how-does-basic-object-function-chaining-work-in-javascript
// https://www.calibraint.com/blog/builder-design-pattern-in-javascript

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';

import { get, concat } from 'lodash';


//====================================================================================
// Data Cursors

let Conditions;
let Patients;
Meteor.startup(async function(){
  Conditions = window.Collections.Conditions;
  Patients = window.Collections.Patients;
})

//====================================================================================



class SmartOnFhir{

  constructor(smartOnFhirConfig) {
    this.options = smartOnFhirConfig;
    this.foo = 'bar';    
  }

  fetchCapabilityStatement(){
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


  fetchWellKnownSmartConfig(callback){
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


  exchangeCodeForAccessToken(wellKnownSmartConfig){
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


  fetchPatient(patientId, accessToken){
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

          if(!Patients.findOne({id: get(JSON.parse(get(result, 'content')), 'id')})){
            Patients._collection.insert(JSON.parse(get(result, 'content')));     
          }
        }
      }
    });

    return this;
  }

  getResourceFrom(url, accessToken, fhirPatient) {
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


} 


export default SmartOnFhir;

// // example usage
// var test = new SmartOnFhir();
// test.add().del();