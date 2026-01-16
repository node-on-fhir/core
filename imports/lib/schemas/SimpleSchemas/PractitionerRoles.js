import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import {  AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


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
let PractitionerRole = BaseModel.extend();

export let PractitionerRoles = new Mongo.Collection('PractitionerRoles');

//Assign a collection so the object knows how to perform CRUD operations
PractitionerRole.prototype._collection = PractitionerRoles;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
PractitionerRoles._transform = function (document) {
  return new PractitionerRole(document);
};

let PractitionerRoleSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "PractitionerRole"
  },
  "identifier": {
    type: Array,
    optional: true
  },
  "identifier.$": {
    type: IdentifierSchema,
    optional: true
  },
  "active": {
    type: Boolean,
    optional: true
  },
  "period": {
    type: PeriodSchema,
    optional: true
  },
  "practitioner": {
    type: ReferenceSchema,
    optional: true
  },
  "organization": {
    type: ReferenceSchema,
    optional: true
  },
  "code": {
    type: Array,
    optional: true
  },
  "code.$": {
    type: CodeableConceptSchema,
    optional: true
  },
  "specialty": {
    type: Array,
    optional: true
  },
  "specialty.$": {
    type: CodeableConceptSchema,
    optional: true
  },
  "location": {
    type: Array,
    optional: true
  },
  "location.$": {
    type: ReferenceSchema,
    optional: true
  },
  "healthcareService": {
    type: Array,
    optional: true
  },
  "healthcareService.$": {
    type: ReferenceSchema,
    optional: true
  },
  "telecom": {
    type: Array,
    optional: true
  },
  "telecom.$": {
    type: ContactPointSchema,
    optional: true
  },
  "availableTime": {
    type: Array,
    optional: true
  },
  "availableTime.$": {
    type: Object,
    blackbox: true,
    optional: true
  },
  "availableTime.$.daysOfWeek": {
    type: Array,
    optional: true
  },
  "availableTime.$.daysOfWeek.$": {
    optional: true,
    type: String
  },
  "availableTime.$.allDay": {
    type: Boolean,
    optional: true
  },
  "availableTime.$.availableStartTime": {
    type: Date,
    optional: true
  },
  "availableTime.$.availableEndTime": {
    type: Date,
    optional: true
  },

  "notAvailable": {
    type: Array,
    optional: true
  },
  "notAvailable.$": {
    type: Object,
    blackbox: true,
    optional: true
  },
  "notAvailable.$.description": {
    type: String,
    optional: true
  },
  "notAvailable.$.during": {
    optional: true,
    type: PeriodSchema
  },
  "availabilityExceptions": {
    type: String,
    optional: true
  },
  "endpoint": {
    type: Array,
    optional: true
  },
  "endpoint.$": {
    type: ReferenceSchema,
    optional: true
  }
});

BaseSchema.extend(PractitionerRoleSchema);
DomainResourceSchema.extend(PractitionerRoleSchema);

export default { PractitionerRole, PractitionerRoles, PractitionerRoleSchema };