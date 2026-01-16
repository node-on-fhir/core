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


export let Evidences = new Mongo.Collection('Evidences');

// create the object using our BaseModel
let Evidence = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
Evidence.prototype._collection = Evidences;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Evidences._transform = function (document) {
  return new Evidence(document);
};

let EvidenceR4Schema = new SimpleSchema({
  "_id": {
    type: String,
    optional: true
  },
  "id": {
    type: String,
    optional: true
  },
  "meta": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "resourceType": {
    type: String,
    defaultValue: "Evidence"
  },
  "url": {
    type: String,
    optional: true
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
    optional: true,
    type: IdentifierSchema
  },
  "version": {
    type: String,
    optional: true
  },
  "name": {
    type: String,
    optional: true
  },
  "title": {
    type: String,
    optional: true
  },
  "shortTitle": {
    type: String,
    optional: true
  },
  "subtitle": {
    type: String,
    optional: true
  },
  "status": {
    type: Code,
    allowedValues: ['draft', 'active', 'retired', 'unknown']
  },
  "date": {
    type: Date,
    optional: true
  },
  "publisher": {
    type: String,
    optional: true
  },
  "contact": {
    type: Array,
    optional: true
  },
  "contact.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "description": {
    type: String,
    optional: true
  },
  "note": {
    type: Array,
    optional: true
  },
  "note.$": {
    // type: AnnotationSchema
    type: Object,
    blackbox: true
  },
  "useContext": {
    type: Array,
    optional: true
  },
  "useContext.$": {
    // type: UsageContextSchema
    type: Object,
    blackbox: true
  },
  "jurisdiction": {
    type: Array,
    optional: true
  },
  "jurisdiction.$": {
    type: CodeableConceptSchema
  },
  "copyright": {
    type: String,
    optional: true
  },
  "approvalDate": {
    type: Date,
    optional: true
  },
  "lastReviewDate": {
    type: Date,
    optional: true
  },
  "effectivePeriod": {
    type: PeriodSchema,
    optional: true
  },
  "topic": {
    type: Array,
    optional: true
  },
  "topic.$": {
    type: CodeableConceptSchema
  },
  "author": {
    type: Array,
    optional: true
  },
  "author.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "editor": {
    type: Array,
    optional: true
  },
  "editor.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "reviewer": {
    type: Array,
    optional: true
  },
  "reviewer.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "endorser": {
    type: Array,
    optional: true
  },
  "endorser.$": {
    // type: ContactDetailSchema
    type: Object,
    blackbox: true
  },
  "relatedArtifact": {
    type: Array,
    optional: true
  },
  "relatedArtifact.$": {
    // type: RelatedArtifactSchema
    type: Object,
    blackbox: true
  },
  "extension": {
    optional: true,
    type: Array
  },
  "extension.$": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "modifierExtension": {
    optional: true,
    type: Array
  },
  "modifierExtension.$": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "exposureBackground": {
    type: ReferenceSchema
  },
  "exposureVariant": {
    type: Array,
    optional: true
  },
  "exposureVariant.$": {
    type: ReferenceSchema
  },
  "outcome": {
    type: Array,
    optional: true
  },
  "outcome.$": {
    type: ReferenceSchema
  }
});

// Evidences.attachSchema(EvidenceR4Schema);

export default { Evidence, Evidences, EvidenceR4Schema };