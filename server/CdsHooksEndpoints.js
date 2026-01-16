
import { Meteor } from 'meteor/meteor';
import { WebApp } from "meteor/webapp";

import { Organizations } from '../imports/lib/schemas/SimpleSchemas/Organizations';
import { Practitioners } from '../imports/lib/schemas/SimpleSchemas/Practitioners';
import { Endpoints } from '../imports/lib/schemas/SimpleSchemas/Endpoints';
import { Networks } from '../imports/lib/schemas/SimpleSchemas/Networks';
import { InsurancePlans } from '../imports/lib/schemas/SimpleSchemas/InsurancePlans';
import { Locations } from '../imports/lib/schemas/SimpleSchemas/Locations';
import { HealthcareServices } from '../imports/lib/schemas/SimpleSchemas/HealthcareServices';
import { OrganizationAffiliations } from '../imports/lib/schemas/SimpleSchemas/OrganizationAffiliations';
import { PractitionerRoles } from '../imports/lib/schemas/SimpleSchemas/PractitionerRoles';

import { get } from 'lodash';

WebApp.handlers.get("/cds-services", async (req, res) => {

  console.log('GET ' + '/cds-service');

  console.log("Organizations", Organizations)

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let listOfServices = [];

  let returnPayload = {
    code: 200,
    data: listOfServices
  }

  console.log('Publishing CDS Hooks Services...')
 
  res.json(returnPayload);
});



WebApp.handlers.post("/cds-services/{id}", async (req, res) => {

  console.log('POST /cds-services/{id}');

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*"); 

  console.log("");
  console.log(req);
  console.log(req.body);
  console.log(req.content);
  console.log(req.payload);
  console.log("");

  let returnPayload = {
    code: 200,
    data: {}
  }      
  console.log('Signing software statement...')       
  res.json(returnPayload);
});



Meteor.methods({
  proxyDiscoverCdsServices: async function (patientId) {

    // let cdsHooksServiceUrl = get(Meteor, 'settings.public.smartOnFhir[0].cdsHooksServices', "http://localhost:3000") + "/cds-services";
    let cdsHooksServiceUrl = get(Meteor, 'settings.public.smartOnFhir[0].cdsHooksServices', "http://localhost:3000");

    console.log('discovering hooks...', cdsHooksServiceUrl);


    return await fetch(cdsHooksServiceUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(function(response){
      console.log('response')
      return response.json();
    })
    .then(data => {
      console.log('cdsHooksService.data', data)
      return data;
    }).catch((error) => {
      console.log(error);
      console.log(JSON.stringify(error.message));
    });
  },
  proxyFetchCdsHook: async function (hook, patientId, selectedPatient) {

    let cdsHooksServiceUrl = get(Meteor, 'settings.public.smartOnFhir[0].cdsHooksServices', "http://localhost:3000") + "/" + get(hook, 'id');

    console.log('posting to hook...', cdsHooksServiceUrl, hook);

    let payload = {
      hook: get(hook, "hook"),
      hookInstance: get(hook, "id"),
      // fhirServer: get(hook, "fhirServer"),
      // fhirAuthorization: get(hook, "fhirAuthorization"),
      // patientId: get(hook, "patientId"),
      context: {
        patientId: "Patient/" + patientId
      },
      prefetch: {}
    }      


    if(get(hook, 'prefetch')){
      Object.keys(get(hook, 'prefetch')).forEach(function(key) {
        if(hook.prefetch[key] === "Patient/{{context.patientId}}"){
          payload.prefetch.patient = selectedPatient
        }          
      });
    }

    console.log('payload', payload)


    return await fetch(cdsHooksServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(function(response){
      console.log('response')
      return response.json();
    })
    .then(data => {
      console.log('cdsHooksService.data', data)
      return data;
    }).catch((error) => {
      console.log(error);
    });
  }
});
