
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

import bodyParser from "body-parser";

// WebApp.handlers.use(bodyParser.urlencoded({extended: true}));
// WebApp.handlers.use(bodyParser.json());

WebApp.handlers.get("/stats", async (req, res) => {

  console.log('GET ' + '/stats');

  console.log("Organizations", Organizations)

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  let returnPayload = {
    code: 200,
    data: {
      collections: {
          organizations: Organizations.find().countAsync(),
          practitioners: Practitioners.find().countAsync(),
          endpoints: Endpoints.find().countAsync(),
          networks: Networks.find().countAsync(),
          insurancePlans: InsurancePlans.find().countAsync(),
          healthcareServices: HealthcareServices.find().countAsync(),
          locations: Locations.find().countAsync(),
          organizationAffiliations: OrganizationAffiliations.find().countAsync(),
          practitionerRoles: PractitionerRoles.find().countAsync()
      }
    }
  }

  console.log('Publishing stats...')
 
  res.json(returnPayload);
});



WebApp.handlers.post("/generateAndSignJwt", async (req, res) => {

  console.log('POST /generateAndSignJwt');

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*"); 

  console.log("");
  console.log(req);
  console.log(req.body);
  console.log(req.content);
  console.log(req.payload);
  console.log("");

  Meteor.call('generateAndSignJwt', req.body, function(error, signResult){
    if(error){
      console.error('error', error);
      res.status(501).json();
    }
    if(signResult){
      let returnPayload = {
        code: 200,
        data: signResult
      }      
      console.log('Signing software statement...')       
      res.json(returnPayload);
    }
  }) ;  
});


// WebApp.handlers.post("/newCertificate", async (req, res) => {

//   console.log('POST ' + '/newCertificate');

//   res.setHeader('Content-type', 'application/json');
//   res.setHeader("Access-Control-Allow-Origin", "*"); 

//   console.log("");
//   console.log(req.body);
//   console.log("");

//   if(!UdapCertificates.findOne({certificate: req.body.certificate})){
//     UdapCertificates.insert(req.body)
//   }

//   res.json();
// });


