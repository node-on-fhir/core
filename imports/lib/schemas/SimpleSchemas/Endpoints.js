import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


// if(Package['clinical:autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
//   console.log("Any protected health information (PHI) stored in this app should be audited."); 
//   console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
//   console.log("");  
//   console.log("meteor remove clinical:autopublish");  
//   console.log("");  
// }
// if(Package['autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
//   console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
//   console.log("");  
//   console.log("meteor remove autopublish");  
//   console.log("meteor add clinical:autopublish");  
//   console.log("");  
// }




// create the object using our BaseModel
let Endpoint = BaseModel.extend();


// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.Endpoints = new Mongo.Collection('HL7.Resources.Endpoints');
export let Endpoints = new Mongo.Collection('Endpoints');

//Assign a collection so the object knows how to perform CRUD operations
Endpoint.prototype._collection = Endpoints;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Endpoints._transform = function (document) {
  return new Endpoint(document);
};

let EndpointSchema = DomainResourceSchema.extend({
  "resourceType" : {
    type: String,
    defaultValue: "Endpoint"
  },
  "extension" : {
    optional: true,
    type:  Array
    },
  "extension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },    
  "status" : {
    optional: true,
    allowedValues: ["active", "suspended", "error", "off", "entered-in-error"],
    type: String
  }, 
  "connectionType" : {
    optional: true,
    type: Array 
  }, 
  "connectionType.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "environmentType" : {
    optional: true,
    type: Array 
  }, 
  "environmentType.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "name" : {
    optional: true,
    type: String
  }, 
  "managingOrganization" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "contact" : {
    optional: true,
    type: Array
  }, 
  "contact.$" : {
    optional: true,
    type: ContactPointSchema 
  }, 
  "period" : {
    optional: true,
    type: PeriodSchema 
  }, 
  "payloadType" : {
    optional: true,
    type: Array
  }, 
  "payloadType.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "payloadMimeType" : {
    optional: true,
    type: Array
  }, 
  "payloadMimeType.$" : {
    optional: true,
    type: String 
  }, 
  "address" : {
    optional: true,
    type: String
  }, 
  "header" : {
    optional: true,
    type: Array
  },
  "header.$" : {
    optional: true,
    type: String 
  }

});

BaseSchema.extend(EndpointSchema);
DomainResourceSchema.extend(EndpointSchema);  

// Endpoints.attachSchema(EndpointSchema);


export default { Endpoint, Endpoints, EndpointSchema };