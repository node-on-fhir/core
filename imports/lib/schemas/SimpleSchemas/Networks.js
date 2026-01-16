import { get, isNull } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


import OrganizationSchema from './Organizations';

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
let Network = BaseModel.extend();


export let Networks = new Mongo.Collection('Networks');


//Assign a collection so the object knows how to perform CRUD operations
Network.prototype._collection = Networks;





//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Networks._transform = function (document) {
  return new Network(document);
};

let NetworkSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Network"
  },
  "organization-period": {
    type: PeriodSchema,
    optional: true
  },
  "location-reference": {
    type: ReferenceSchema,
    optional: true
  },
  "usage-restriction": {
    type: ReferenceSchema,
    optional: true
  },
  "identifier": {
    type: Array,
    optional: true
  },
  "identifier.$": {
    type: Object,
    optional: true
  },
  "identifier.$.identifier-status": {
    type: String,
    optional: true
  },
  "telecom": {
    type: Array,
    optional: true
  },
  "telecom.$": {
    type: Object,
    optional: true
  },
  "telecom.$.contactpoint-availabletime": {
    type: Object,
    optional: true
  },
  "telecom.$.contactpoint-viaintermediary": {
    type: ReferenceSchema,
    optional: true
  }  
});

NetworkSchema.extend(OrganizationSchema)


// Attach the schema to a collection
// Networks.attachSchema(NetworkSchema);

export default { Network, Networks, NetworkSchema };