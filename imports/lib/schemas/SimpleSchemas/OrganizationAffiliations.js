import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


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
let OrganizationAffiliation = BaseModel.extend();

export let OrganizationAffiliations = new Mongo.Collection('OrganizationAffiliations');

//Assign a collection so the object knows how to perform CRUD operations
OrganizationAffiliation.prototype._collection = OrganizationAffiliations;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
OrganizationAffiliations._transform = function (document) {
  return new OrganizationAffiliation(document);
};

let OrganizationAffiliationSchema = DomainResourceSchema.extend({
  "resourceType" : {
    type: String,
    defaultValue: "OrganizationAffiliation"
  },
  "identifier" : {
    type: Array,
    optional: true
  },
  "identifier.$" : {
    type: IdentifierSchema,
    optional: true
  },
  "active" : {
    type: Boolean,
    optional: true
  },
  "period" : {
    type: PeriodSchema,
    optional: true
  },
  "organization" : {
    type: ReferenceSchema,
    optional: true
  },
  "participatingOrganization" : {
    type: ReferenceSchema,
    optional: true
  },
  "network" : {
    type: Array,
    optional: true
  },
  "network.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "code" : {
    type: Array,
    optional: true
  },
  "code.$" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "specialty" : {
    type: Array,
    optional: true
  },
  "specialty.$" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "location" : {
    type: Array,
    optional: true
  },
  "location.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "healthcareService" : {
    type: Array,
    optional: true
  },
  "healthcareService.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "telecom" : {
    type: Array,
    optional: true
  },
  "telecom.$" : {
    type: ContactPointSchema,
    optional: true
  },
  "endpoint" : {
    type: Array,
    optional: true
  },
  "endpoint.$" : {
    type: ReferenceSchema,
    optional: true
  }
});

// OrganizationAffiliations.attachSchema(OrganizationAffiliationSchema);

export default { OrganizationAffiliation, OrganizationAffiliations, OrganizationAffiliationSchema };