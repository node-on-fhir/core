// /imports/lib/schemas/SimpleSchemas/ServiceRequests.js

if(Package['clinical:autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
  console.log("Any protected health information (PHI) stored in this app should be audited."); 
  console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
  console.log("");  
  console.log("meteor remove clinical:autopublish");  
  console.log("");  
}
if(Package['autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
  console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
  console.log("");  
  console.log("meteor remove autopublish");  
  console.log("meteor add clinical:autopublish");  
  console.log("");  
}

import { get, uniq, uniqBy } from 'lodash';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { CodeableConceptSchema, BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';

// // create the object using our BaseModel
let ServiceRequest = BaseModel.extend();


export let ServiceRequests = new Mongo.Collection('ServiceRequests');


// //Assign a collection so the object knows how to perform CRUD operations
ServiceRequest.prototype._collection = ServiceRequests;



// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// ServiceRequests._transform = function (document) {
//   return new ServiceRequest(document);
// };

// Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ServiceRequests._transform = function (document) {
  return new ServiceRequest(document);
};


// ===================================================

let ServiceRequestSchemaR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "ServiceRequest"
  },
  "_id" : {
    optional: true,
    type:  String
    },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "text" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
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
  "modifierExtension" : {
    optional: true,
    type:  Array
    },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "status" : {
    optional: true,
    allowedValues: ['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown'],
    type: String
  },
  "intent" : {
    optional: true,
    allowedValues: ['proposal', 'plan', 'directive', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option'],
    type: String
  },
  "category" : {
    optional: true,
    type:  Array
    },
  "category.$" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema 
    },
  "priority" : {
    optional: true,
    type:  String
    },
  "doNotPerform" : {
    optional: true,
    type:  Boolean
    },
  "code" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema 
    },
  "orderDetail" : {
    optional: true,
    type:  Array
    },
  "orderDetail.$" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema 
    },
  "subject" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    },
  "encounter" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    },
  "occurrence" : {
    optional: true,
    blackbox: true,
    type:  Object
    },
  "occurrenceDateTime" : {
    optional: true,
    type:  String
    },
  "occurrencePeriod" : {
    optional: true,
    blackbox: true,
    type:  Object
    },
  "occurrencePeriod.start" : {
    optional: true,
    type:  String
    },
  "occurrencePeriod.end" : {
    optional: true,
    type:  String
    },
  "occurrenceTiming" : {
    optional: true,
    blackbox: true,
    type:  Object
    },
  "asNeeded" : {
    optional: true,
    blackbox: true,
    type:  Object
    },
  "asNeededBoolean" : {
    optional: true,
    type:  Boolean
    },
  "asNeededCodeableConcept" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema
    },
  "authoredOn" : {
    optional: true,
    type:  String
    },
  "requester" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    },
  "performerType" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema 
    },
  "performer" : {
    optional: true,
    type:  Array
    },
  "performer.$" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    },
  "locationCode" : {
    optional: true,
    type:  Array
    },
  "locationCode.$" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema 
    },
  "locationReference" : {
    optional: true,
    type:  Array
    },
  "locationReference.$" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    },
  "reasonCode" : {
    optional: true,
    type:  Array
    },
  "reasonCode.$" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema 
    },
  "reasonReference" : {
    optional: true,
    type:  Array
    },
  "reasonReference.$" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    },
  "insurance" : {
    optional: true,
    type:  Array
    },
  "insurance.$" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    },
  "supportingInfo" : {
    optional: true,
    type:  Array
    },
  "supportingInfo.$" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    },
  "specimen" : {
    optional: true,
    type:  Array
    },
  "specimen.$" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    },
  "bodySite" : {
    optional: true,
    type:  Array
    },
  "bodySite.$" : {
    optional: true,
    blackbox: true,
    type:  CodeableConceptSchema 
    },
  "note" : {
    optional: true,
    type:  Array
    },
  "note.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "note.$.text" : {
    optional: true,
    type:  String 
    },
  "patientInstruction" : {
    optional: true,
    type:  String
    },
  "relevantHistory" : {
    optional: true,
    type:  Array
    },
  "relevantHistory.$" : {
    optional: true,
    blackbox: true,
    type:  ReferenceSchema 
    }
});


let ServiceRequestSchema = ServiceRequestSchemaR4;

BaseSchema.extend(ServiceRequestSchema);
DomainResourceSchema.extend(ServiceRequestSchema);

// ServiceRequests.attachSchema(ServiceRequestSchema);

export { ServiceRequest, ServiceRequestSchema }