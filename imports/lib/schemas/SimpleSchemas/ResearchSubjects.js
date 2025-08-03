// /imports/lib/schemas/SimpleSchemas/ResearchSubjects.js

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


export let ResearchSubjects = new Mongo.Collection('ResearchSubjects');

// create the object using our BaseModel
let ResearchSubject = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
ResearchSubject.prototype._collection = ResearchSubjects;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ResearchSubjects._transform = function (document) {
  return new ResearchSubject(document);
};

let ResearchSubjectSchema = DomainResourceSchema.extend({
  "resourceType" : {
    type: String,
    defaultValue: "ResearchSubject"
  },
  "identifier" : {
    optional: true,
    type: Array
  },
  "identifier.$" : {
    optional: true,
    type: IdentifierSchema
  },
  "status" : {
    type: String,
    allowedValues: ['candidate', 'eligible', 'follow-up', 'ineligible', 'not-registered', 'off-study', 'on-study', 'on-study-intervention', 'on-study-observation', 'pending-on-study', 'potential-candidate', 'screening', 'withdrawn']
  },
  "period" : {
    optional: true,
    type: PeriodSchema
  },
  "study" : {
    type: ReferenceSchema
  },
  "subject" : {
    type: ReferenceSchema
  },
  "assignedArm" : {
    optional: true,
    type: String
  },
  "actualArm" : {
    optional: true,
    type: String
  },
  "consent" : {
    optional: true,
    type: ReferenceSchema
  }
});

// Note: attachSchema is not available in Meteor v3 without aldeed:collection2 package
// ResearchSubjects.attachSchema(ResearchSubjectSchema);

export { ResearchSubject, ResearchSubjects, ResearchSubjectSchema };
