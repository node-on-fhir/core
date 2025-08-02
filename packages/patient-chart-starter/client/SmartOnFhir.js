
import { get } from 'lodash';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

// import http from 'http';
// import https from 'https';


//----------------------------------------------------------------------
// SMART on FHIR State Variables

import jwt from 'jsonwebtoken';
import moment from 'moment';

// TODO:  need to add these somewhere

// let [serverCapabilityStatement, setServerCapabilityStatement] = useState("");
// let [wellKnownSmartConfig, setWellKnownSmartConfig] = useState("");
// let [smartAccessToken, setSmartAccessToken] = useState("");
// let [fhirPatient, setFhirPatient] = useState("");

// // Generate the code_verifier (for PKCE)
// const codeVerifier = generateCodeVerifier(); // Your function to generate code_verifier
// console.log('codeVerifier', codeVerifier);

// // Save to Local Storage (persistent across tabs and sessions)
// localStorage.setItem('pkce_code_verifier', codeVerifier);


//====================================================================================
// SMART on FHIR - PKCE

let firstSmartConfig = get(Meteor, 'settings.public.smartOnFhir[0]', []);

export function uint8ToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}
export function generateCodeVerifier() {
  const array = new Uint8Array(32); // 32 random bytes
  window.crypto.getRandomValues(array);

  // Convert the Uint8Array to a URL-safe base64 string without using btoa
  return Array.from(array, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}
export async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return uint8ToBase64(new Uint8Array(hash))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}
export async function verifyCodeChallenge(codeVerifier, expectedCodeChallenge) {

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
// SMART on FHIR - PKCE


export async function fetchCapabilityStatement(searchParams){
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
export async function fetchWellKnownSmartConfig(callback){
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
export async function exchangeCodeForAccessToken(wellKnownSmartConfig){
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
export async function fetchPatient(patientId, accessToken){
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
export async function fetchPatientData(fhirPatient, accessToken) {
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

const SmartOnFhir = {
    uint8ToBase64: uint8ToBase64,
    generateCodeVerifier: generateCodeVerifier,
    generateCodeChallenge: generateCodeChallenge,
    verifyCodeChallenge: verifyCodeChallenge,
    fetchCapabilityStatement: fetchCapabilityStatement,
    fetchWellKnownSmartConfig: fetchWellKnownSmartConfig,
    exchangeCodeForAccessToken: exchangeCodeForAccessToken,
    fetchPatient: fetchPatient,
    fetchPatientData: fetchPatientData
}

export default SmartOnFhir;
