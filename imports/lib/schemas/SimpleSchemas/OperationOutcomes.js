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


export let OperationOutcomes = new Mongo.Collection('OperationOutcomes');

// create the object using our BaseModel
let OperationOutcome = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
OperationOutcome.prototype._collection = OperationOutcomes;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
OperationOutcomes._transform = function (document) {
  return new OperationOutcome(document);
};

let OperationOutcomeR4Schema = new SimpleSchema({
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
    defaultValue: "OperationOutcome"
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
  "issue": {
    type: Array,
    minCount: 1
  },
  "issue.$": {
    type: Object
  },
  "issue.$.severity": {
    type: Code,
    allowedValues: ['fatal', 'error', 'warning', 'information']
  },
  "issue.$.code": {
    type: Code,
    allowedValues: [
      'invalid', 'structure', 'required', 'value', 'invariant', 'security', 
      'login', 'unknown', 'expired', 'forbidden', 'suppressed', 'processing',
      'not-supported', 'duplicate', 'multiple-matches', 'not-found', 'deleted',
      'too-long', 'code-invalid', 'extension', 'too-costly', 'business-rule',
      'conflict', 'transient', 'lock-error', 'no-store', 'exception',
      'timeout', 'incomplete', 'throttled', 'informational'
    ]
  },
  "issue.$.details": {
    optional: true,
    type: CodeableConceptSchema
  },
  "issue.$.diagnostics": {
    optional: true,
    type: String
  },
  "issue.$.location": {
    optional: true,
    type: Array
  },
  "issue.$.location.$": {
    type: String
  },
  "issue.$.expression": {
    optional: true,
    type: Array
  },
  "issue.$.expression.$": {
    type: String
  }
});

// OperationOutcomes.attachSchema(OperationOutcomeR4Schema);

export default { OperationOutcome, OperationOutcomes, OperationOutcomeR4Schema };