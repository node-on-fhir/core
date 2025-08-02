import React, { useState, useEffect } from 'react';

import { oauth2 as SMART } from "fhirclient";
import { FhirClientContext } from "./FhirClientContext";

import { useLocation, useNavigate } from "react-router-dom";


import { get, has } from 'lodash';

import { Session } from 'meteor/session';
import { FhirUtilities } from './FhirUtilities';


import { CarePlans } from './lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from './lib/schemas/SimpleSchemas/CareTeams';
import { Consents } from './lib/schemas/SimpleSchemas/Consents';
import { Conditions } from './lib/schemas/SimpleSchemas/Conditions';
import { Encounters } from './lib/schemas/SimpleSchemas/Encounters';
import { Immunizations } from './lib/schemas/SimpleSchemas/Immunizations';
import { Locations } from './lib/schemas/SimpleSchemas/Locations';
import { MedicationOrders } from './lib/schemas/SimpleSchemas/MedicationOrders';
import { Observations } from './lib/schemas/SimpleSchemas/Observations';
import { Patients } from './lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from './lib/schemas/SimpleSchemas/Practitioners';
import { Procedures } from './lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from './lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from './lib/schemas/SimpleSchemas/QuestionnaireResponses';


// import { HipaaLogger } from 'meteor/clinical:hipaa-logger';

// EHR
// https://code.cerner.com/developer/smart-on-fhir/apps/5ce489fc-fec1-46be-856a-8d7ed58e6b5b

// Launch Page
// http://localhost:3000/launcher?iss=https%3A%2F%2Ffhir-ehr-code.cerner.com%2Fr4%2Fec2458f2-1e24-41c8-b71b-0e701af7583d&launch=1b00ff1d-6861-4634-9786-bd6f74154fc4

// QuickChart
// http://localhost:3000/patient-quickchart?code=dd0035ef-ff08-485d-8346-34b1f223df3e&state=pvuBDItbfFVZm2u3

// Umable To Connect
// http://localhost:3000/patient-quickchart



// Epic Provider R4 Launch Page
// http://localhost:3000/launcher?iss=https%3A%2F%2Ffhir.epic.com%2Finterconnect-fhir-oauth%2Fapi%2FFHIR%2FR4&launch= QWERTY JSON web token goes here
// http://localhost:3000/launcher?iss=https%3A%2F%2Ffhir.epic.com%2Finterconnect-fhir-oauth%2Fapi%2FFHIR%2FR4&launch= QWERTY JSON web token goes here
// dob=%DOB%&user=%SYSLOGIN%


function fetchPatientData(ehrLaunchCapabilities, client, accessToken) {
  console.log("---------------------------------------------------------------------")
  console.log("SMART ON FHIR - FhirClientProvider", ehrLaunchCapabilities);

  if(client){
    try {
      if(ehrLaunchCapabilities.Condition === true){
        const conditionQuery = new URLSearchParams();
        conditionQuery.set("patient", get(client, 'patient.id'));
        // console.log('Condition Query', conditionQuery);

        // without leading slash seems to work with Cerner, but not with Epic (?)
        let conditionUrl = '/Condition?' + conditionQuery.toString()
        // console.log('conditionUrl', conditionUrl);

        console.log('querying the server for Conditions using client.request()')
        client.request(conditionUrl, { pageLimit: 0, flat: true}).then(conditions => {
          if(conditions){
            // console.log('PatientAutoDashboard.conditions', conditions)
            conditions.forEach(condition => {
              Conditions._collection.upsert({id: condition.id}, {$set: condition}, {validate: false, filter: false}, function(){});                    
            });
          }
        });

        console.log('querying the server for Conditions using fetch()')
        let conditionUrlAssembled = get(client.getState(), 'serverUrl') + "/Condition?patient=" + client.getPatientId();
        // console.log('FhirClientProvider.conditionUrlAssembled:    ', conditionUrlAssembled);

        if(conditionUrlAssembled){        
          var httpHeaders = { headers: {
            'Accept': "application/json,application/fhir+json",
            "Authorization": "Bearer " + accessToken
          }}

          // console.log('FhirClientProvider.conditionUrlAssembled.httpHeaders:    ', httpHeaders);

          // need to reconcile with client.request() syntax above    
          fetch(conditionUrlAssembled, httpHeaders)
            .then(response => response.text())
            .then(content => {
              let parsedConditionBundle = JSON.parse(content || "{}");
              console.log('FhirClientProvider.parsedConditionBundle', parsedConditionBundle);       
              
              if(parsedConditionBundle.resourceType === "Condition"){
                if(!Conditions.findOne({id: parsedConditionBundle.id})){
                  Conditions._collection.upsert({id: parsedConditionBundle.id}, {$set: parsedConditionBundle}, {validate: false, filter: false}, function(){});     
                }
              }
            })
            .catch(error => {
              console.error('fetch().conditionUrlAssembled.error', error)
            });   
        }
      }


      if(ehrLaunchCapabilities.Encounter === true){
        const encounterQuery = new URLSearchParams();
        encounterQuery.set("patient", get(client, 'patient.id'));
        // console.log('Encounter Query', encounterQuery);

        // without leading slash seems to work with Cerner, but not with Epic (?)
        let encounterUrl = '/Encounter?' + encounterQuery.toString();
        // console.log('encounterUrl', encounterUrl);

        client.request(encounterUrl, { pageLimit: 0, flat: true }).then(encounters => {
          if(encounters){
            // console.log('PatientAutoDashboard.encounters', encounters)
            encounters.forEach(encounter => {
              Encounters._collection.upsert({id: encounter.id}, {$set: encounter}, {validate: false, filter: false}, function(){});     
            });    
          }
        });
      }


      if(ehrLaunchCapabilities.Procedure === true){
        const procedureQuery = new URLSearchParams();
        procedureQuery.set("patient", get(client, 'patient.id'));
        // console.log('Procedure Query', procedureQuery);

        // without leading slash seems to work with Cerner, but not with Epic (?)
        let procedureUrl = '/Procedure?' + procedureQuery
        // console.log('procedureUrl', procedureUrl);

        client.request(procedureUrl, { pageLimit: 0, flat: true }).then(procedures => {
          if(procedures){
            // console.log('PatientAutoDashboard.procedures', procedures)
            procedures.forEach(procedure => {
              Procedures._collection.upsert({id: procedure.id}, {$set: procedure}, {validate: false, filter: false}, function(){});                      
            });    
          }
        });
      }

      if(ehrLaunchCapabilities.Immunization === true){
        const immunizationQuery = new URLSearchParams();
        immunizationQuery.set("patient", get(client, 'patient.id'));
        // console.log('Immunization Query', immunizationQuery);

        // without leading slash seems to work with Cerner, but not with Epic (?)
        let immunizationUrl = '/Immunization?' + immunizationQuery
        // console.log('immunizationUrl', immunizationUrl);

        client.request(immunizationUrl, {
          pageLimit: 0,
          flat: true
        }).then(immunizations => {
          if(immunizations){
            // console.log('PatientAutoDashboard.immunizations', immunizations)
            immunizations.forEach(immunization => {
              Immunizations._collection.upsert({id: immunization.id}, {$set: immunization}, {validate: false, filter: false}, function(){});                         
            });    
          }
        });
      }

      if(ehrLaunchCapabilities.MedicationOrder === true){
        const medicationOrderQuery = new URLSearchParams();
        medicationOrderQuery.set("patient", get(client, 'patient.id'));
        // console.log('MedicationOrder Query', medicationOrderQuery);

        // without leading slash seems to work with Cerner, but not with Epic (?)
        let medicationOrderUrl = '/MedicationOrder?' + medicationOrderQuery
        // console.log('medicationOrderUrl', medicationOrderUrl);

        client.request(medicationOrderUrl, {
            pageLimit: 0,
            flat: true
        }).then(medicationOrders => {
          if(medicationOrders){
            // console.log('PatientAutoDashboard.medicationOrders', medicationOrders)
            medicationOrders.forEach(medOrder => {
              MedicationOrders._collection.upsert({id: medOrder.id}, {$set: medOrder}, {validate: false, filter: false}, function(){});                        
            });    
          }
        });
      }

      // if(ehrLaunchCapabilities.MedicationRequest === true){
      //   const medicationRequestQuery = new URLSearchParams();
      //   medicationRequestQuery.set("patient", get(client, 'patient.id'));
      //   console.log('MedicationRequest Query', medicationRequestQuery);

      //   // without leading slash seems to work with Cerner, but not with Epic (?)
      //   let medicationRequestUrl = '/MedicationRequest?' + medicationRequestQuery
      //   console.log('medicationRequestUrl', medicationRequestUrl);

      //   client.request(medicationRequestUrl, {
      //     pageLimit: 0,
      //     flat: true
      //   }).then(medicationRequests => {
      //     if(medicationRequests){
      //       console.log('PatientAutoDashboard.medicationRequests', medicationRequests)
      //       medicationRequests.forEach(procedure => {
      //           MedicationRequests._collection.upsert({id: procedure.id}, {$set: procedure}, {validate: false, filter: false}, function(){});                        
      //       });    
      //     }
      //   });
      // }

      if(ehrLaunchCapabilities.Observation === true){

        const observationQuery = new URLSearchParams();

        observationQuery.set("patient", get(client, 'patient.id'));
        observationQuery.set("category", "vital-signs");    

        // console.log('Vital Signs Query', observationQuery);
    
        // without leading slash seems to work with Cerner, but not with Epic (?)
        let vitalSignsUrl = '/Observation?' + observationQuery.toString();
        // console.log('vitalSignsUrl', vitalSignsUrl);

          client.request(vitalSignsUrl, { pageLimit: 0, flat: true }).then(observations => {
          if(observations){
            // console.log('PatientAutoDashboard.observations.vital-signs', observations)
            observations.forEach(observation => {
              Observations._collection.upsert({id: observation.id}, {$set: observation}, {validate: false, filter: false}, function(){});     
            });
          }
        });

        observationQuery.delete("category");    
        observationQuery.set("category", "laboratory");    

        // console.log('Vital Signs Query', observationQuery);
    
        // without leading slash seems to work with Cerner, but not with Epic (?)
        let laboratoryUrl = '/Observation?' + observationQuery.toString();
        // console.log('laboratoryUrl', laboratoryUrl);

          client.request(laboratoryUrl, { pageLimit: 0, flat: true }).then(observations => {
          if(observations){
            // console.log('PatientAutoDashboard.observations.laboratory', observations)
            observations.forEach(observation => {
              Observations._collection.upsert({id: observation.id}, {$set: observation}, {validate: false, filter: false}, function(){});     
            });
          }
        });
      }

    } catch (error) {
        alert("We had an error fetching data.", error)
    }
  }
}



export function FhirClientProvider(props){

  let { location, children, ...otherProps } = props;

  let [ client, setClient ] = useState(null);
  let [ error, setError ] = useState(null);
  // let [ location, setLocation ] = useState(location);

  let styles = {
    warningIcon: {
      marginTop: '32px',
      width: '48px',
      height: '48px',
      marginBottom: '32px'
    }
  }

  return (
    <FhirClientContext.Provider
      value={{
          client: client,
          setClient: setClient
      }}
    >
        <FhirClientContext.Consumer>
            {({ client }) => {
                if (client) {
                  return children;
                } else {


                  SMART.ready()
                    .then(smartClient => {
                      console.debug("===========================================================================")
                      console.debug("SMART ON FHIR - FhirClientProvider")

                      setError(null);
                      setClient(smartClient);

                      
                      const token = smartClient.getAuthorizationHeader();
                      console.debug('FhirClientProvider.SMART.ready().token: ' + token);

                      const patientId = smartClient.getPatientId();
                      console.debug('FhirClientProvider.SMART.ready().patientId: ' + patientId);

                      const userId = smartClient.getUserId();
                      console.debug('FhirClientProvider.SMART.ready().userId: ' + userId);

                      const userType = smartClient.getUserType();
                      console.debug('FhirClientProvider.SMART.ready().userType: ' + userType);

                      const fhirUser = smartClient.getFhirUser();
                      console.debug('FhirClientProvider.SMART.ready().fhirUser: ' + fhirUser);

                      const state = smartClient.getState();
                      console.debug('FhirClientProvider.SMART.ready().state: ' + JSON.stringify(state));
                      Session.set('fhirclient.state', state);

                      if(state){
                        let metadataUrl = "";
                        let patientUrl = "";
                        let practitionerUrl = "";
                        let accessToken = "";

                        metadataUrl = state.serverUrl + "/metadata?_format=json";
                        console.debug('FhirClientProvider.metadataUrl:   ', metadataUrl);


                        if(state.tokenResponse){
                          accessToken = get(state, 'tokenResponse.access_token');
                          console.debug('FhirClientProvider.accessToken:   ', accessToken);
                        }

                        var httpHeaders = { headers: {
                          'Accept': "application/json,application/fhir+json",
                          "Authorization": "Bearer " + accessToken
                          // the following doesn't work with Epic; but was needed by some other system
                          // 'Access-Control-Allow-Origin': '*'        
                        }}

                        // if(has(smartOnFhirConfig, 'client_secret')){
                        //   httpHeaders.headers["Authorization"] = "Basic " + atob(get(smartOnFhirConfig, 'client_id') + ":" + get(smartOnFhirConfig, 'client_secret'));
                        // } 
                
                        if(has(Meteor, 'settings.private.fhir.fhirServer.auth.bearerToken')){
                          accessToken = get(Meteor, 'settings.private.fhir.fhirServer.auth.bearerToken');
                        }

                        console.debug('FhirClientProvider.patientUrl.httpHeaders', httpHeaders);

                        if(accessToken){
                          if(metadataUrl){            
                            fetch(metadataUrl, httpHeaders)
                              .then(response => response.text())
                              .then(content => {
                                let parsedCapabilityStatement = JSON.parse(content || "{}");
                                console.log('Received a conformance statement for the server received via iss URL parameter.', parsedCapabilityStatement);
                        
                                let ehrLaunchCapabilities = FhirUtilities.parseCapabilityStatement(parsedCapabilityStatement);
                                console.log("Result of parsing through the CapabilityStatement.  These are the ResourceTypes we can search for", ehrLaunchCapabilities);
                                Session.set('FhirClientProvider.ehrLaunchCapabilities', ehrLaunchCapabilities)
                    
                                fetchPatientData(ehrLaunchCapabilities, smartClient, accessToken);

                                if(get(Meteor, 'settings.private.accessControl.enableHipaaLogging')){
                                  let newAuditEvent = { 
                                    "resourceType" : "AuditEvent",
                                    "type" : { 
                                      'code': 'Fetch Patient Data',
                                      'display': 'Fetch Patient Data',
                                      }, 
                                    "action" : 'Fetch Chart',
                                    "recorded" : new Date(), 
                                    "outcome" : "Success",
                                    "outcomeDesc" : 'Medical records fetched from hospital electronic medical record system.',
                                    "agent" : [{ 
                                      "name" : FhirUtilities.pluckName(Session.get('selectedPatient')),
                                      "who": {
                                        "display": FhirUtilities.pluckName(Session.get('selectedPatient')),
                                        "reference": "Patient/" + get(Session.get('selectedPatient'), 'id')
                                      },
                                      "requestor" : false
                                    }],
                                    "source" : { 
                                      "site" : Meteor.absoluteUrl(),
                                      "identifier": {
                                        "value": Meteor.absoluteUrl(),

                                      }
                                    },
                                    "entity": [{
                                      "reference": {
                                        "reference": ''
                                      }
                                    }]
                                  };

                                  console.log('Logging a hipaa event...', newAuditEvent)
                                  let hipaaEventId = Meteor.call("logAuditEvent", newAuditEvent);            
                                }
                              })
                              .catch(error => {
                                console.error('fetch().metadataUrl.error', error);
                              });    
                          }

                          if(patientId){
                            patientUrl = state.serverUrl + "/Patient?_id=" + patientId;
                            // patientUrl = state.serverUrl + "/Patient/" + patientId;
                            console.log('FhirClientProvider.patientUrl:    ', patientUrl);

                            if(patientUrl){        
                              // need to reconcile with client.request() syntax above    
                              fetch(patientUrl, httpHeaders)
                                .then(response => response.text())
                                .then(content => {
                                  let parsedPatientBundle = JSON.parse(content || "{}");
                                  console.log('FhirClientProvider.parsedPatientBundle', parsedPatientBundle);                      
    
                                  if(parsedPatientBundle.resourceType === "Patient"){
                                    if(!Patients.findOne({id: parsedPatientBundle.id})){
                                      Patients._collection.insert(parsedPatientBundle, function(){})
                                      Session.set('selectedPatient', parsedPatientBundle)                                  
                                      Session.set('selectedPatientId', get(parsedPatientBundle, 'id'))
                                    }
                                  } else if (parsedPatientBundle.resourceType === "Bundle"){
                                    parsedPatientBundle.entry.forEach(function(entry){
                                      if(get(entry, 'resource.resourceType') === "Patient"){
                                        if(!Patients.findOne({id: get(entry, 'resource.id')})){
                                          Patients._collection.insert(get(entry, 'resource'), function(){})
                                          Session.set('selectedPatient', get(entry, 'resource'))                                  
                                          Session.set('selectedPatientId', get(entry, 'resource.id'))
                                        }
                                      } 
                                    }) 
                                  }

                                  if(get(Meteor, 'settings.private.accessControl.enableHipaaLogging')){
                                    let newAuditEvent = { 
                                      "resourceType" : "AuditEvent",
                                      "type" : { 
                                        'code': 'Fetch Patient Demographics',
                                        'display': 'Fetch Patient Demographics',
                                        }, 
                                      "action" : 'Fetch Chart',
                                      "recorded" : new Date(), 
                                      "outcome" : "Success",
                                      "outcomeDesc" : 'Medical records fetched from hospital electronic medical record system.',
                                      "agent" : [{ 
                                        "name" : FhirUtilities.pluckName(Session.get('selectedPatient')),
                                        "who": {
                                          "display": FhirUtilities.pluckName(Session.get('selectedPatient')),
                                          "reference": "Patient/" + get(Session.get('selectedPatient'), 'id')
                                        },
                                        "requestor" : false
                                      }],
                                      "source" : { 
                                        "site" : Meteor.absoluteUrl(),
                                        "identifier": {
                                          "value": Meteor.absoluteUrl(),

                                        }
                                      },
                                      "entity": [{
                                        "reference": {
                                          "reference": ''
                                        }
                                      }]
                                    };

                                    console.log('Logging a hipaa event...', newAuditEvent)
                                    let hipaaEventId = Meteor.call("logAuditEvent", newAuditEvent)            
                                  }
                                })
                                .catch(httpError => {
                                  console.error('FhirClientProvider.patientUrl.get().httpError', httpError);
                                });
                            }
                          } else {
                            console.log('FhirClientProvider.SMART.ready().patientId not found.  Please check scopes and permissions.')
                          }

                          if(fhirUser){
                            practitionerUrl = state.serverUrl + "/" + fhirUser;
                            console.log('FhirClientProvider.practitionerUrl:    ', practitionerUrl);

                            if(practitionerUrl){            
                              // need to reconcile with client.request() syntax above
                              fetch(practitionerUrl, httpHeaders)
                                .then(response => response.text())
                                .then(content => {
                                  let parsedPractitionerBundle = JSON.parse(content || "{}");
                                  console.log('FhirClientProvider.parsedPractitionerBundle', parsedPractitionerBundle);     
    
                                  if(parsedPractitionerBundle.resourceType === "Practitioner"){
                                    if(!Practitioners.findOne({id: parsedPractitionerBundle.id})){
                                      Practitioners._collection.insert(parsedPractitionerBundle, function(){})
                                      Session.set('currentUser', parsedPractitionerBundle);
                                    }
                                  }  
                                })
                                .catch(httpError => {
                                  console.error('FhirClientProvider.practitionerUrl.get().error', httpError);
                                });    
                            }
                          } else {
                            console.warn('FhirClientProvider.SMART.ready().fhirUser not found.  Please check scopes and permissions.')
                          }
                        }
                      }
                    })
                    .catch(smartError => {
                      setError(smartError);
                    });

                  return null;
                }
            }}
        </FhirClientContext.Consumer>
    </FhirClientContext.Provider>
  );
}

export default FhirClientProvider;
