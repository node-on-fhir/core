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


export let ResearchStudies = new Mongo.Collection('ResearchStudies');

// create the object using our BaseModel
let ResearchStudy = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
ResearchStudy.prototype._collection = ResearchStudies;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ResearchStudies._transform = function (document) {
  return new ResearchStudy(document);
};

let ResearchStudySchema = DomainResourceSchema.extend({
  "resourceType" : {
    type: String,
    defaultValue: "ResearchStudy"
  },
  "identifier" : {
    optional: true,
    type: Array
  },
  "identifier.$" : {
    optional: true,
    type: IdentifierSchema
  },
  "title" : {
    optional: true,
    type: String
  },
  "protocol" : {
    optional: true,
    type: Array
  },
  "protocol.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "partOf" : {
    optional: true,
    type: Array
  },
  "partOf.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "status" : {
    type: String,
    allowedValues: ['active', 'administratively-completed', 'approved', 'closed-to-accrual', 'closed-to-accrual-and-intervention', 'completed', 'disapproved', 'in-review', 'temporarily-closed-to-accrual', 'temporarily-closed-to-accrual-and-intervention', 'withdrawn'],
    defaultValue: 'active'
  },
  "primaryPurposeType" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "phase" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "category" : {
    optional: true,
    type: Array
  },
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "focus" : {
    optional: true,
    type: Array
  },
  "focus.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "condition" : {
    optional: true,
    type: Array
  },
  "condition.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "contact" : {
    optional: true,
    type: Array
  },
  "contact.$" : {
    optional: true,
    type: ContactPointSchema
  },
  "relatedArtifact" : {
    optional: true,
    type: Array
  },
  "relatedArtifact.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "keyword" : {
    optional: true,
    type: Array
  },
  "keyword.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "location" : {
    optional: true,
    type: Array
  },
  "location.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "description" : {
    optional: true,
    type: String
  },
  "enrollment" : {
    optional: true,
    type: Array
  },
  "enrollment.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "period" : {
    optional: true,
    type: PeriodSchema
  },
  "sponsor" : {
    optional: true,
    type: ReferenceSchema
  },
  "principalInvestigator" : {
    optional: true,
    type: ReferenceSchema
  },
  "site" : {
    optional: true,
    type: Array
  },
  "site.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "reasonStopped" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "arm" : {
    optional: true,
    type: Array
  },
  "arm.$" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "objective" : {
    optional: true,
    type: Array
  },
  "objective.$" : {
    optional: true,
    blackbox: true,
    type: Object
  }
});

// ResearchStudies.attachSchema(ResearchStudySchema);

export default { ResearchStudy, ResearchStudies, ResearchStudySchema };