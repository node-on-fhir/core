import { get, isString } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import {  AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema,  MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema, TimingSchema } from 'meteor/clinical:hl7-resource-datatypes';


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
let VerificationResult = BaseModel.extend();

export let VerificationResults = new Mongo.Collection('VerificationResults');

//Assign a collection so the object knows how to perform CRUD operations
VerificationResult.prototype._collection = VerificationResults;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
VerificationResults._transform = function (document) {
  return new VerificationResult(document);
};

let VerificationResultSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Resource"
  },
  "target": {
    type: ReferenceSchema,
    optional: true
  },
  "targetLocation": {
    type: Array,
    optional: true
  },
  "targetLocation.$": {
    type: String,
    optional: true
  },
  "need": {
    type: CodeableConceptSchema,
    optional: false
  },
  "status": {
    type: String,
    optional: false
  },
  "statusDate": {
    type: Date,
    optional: false
  },
  "validationType": {
    type: CodeableConceptSchema,
    optional: false
  },
  "validationProcess": {
    type: Array,
    optional: false
  },
  "validationProcess": {
    type: CodeableConceptSchema,
    optional: false
  },
  "frequency": {
    type: TimingSchema,
    optional: true
  },
  "lastPerformed": {
    type: Date,
    optional: true
  },
  "nextScheduled": {
    type: Date,
    optional: true
  },
  "failureAction": {
    type: CodeableConceptSchema,
    optional: false
  },
  "primarySource": {
    type: Array,
    optional: false
  },
  "primarySource.$": {
    type: Object,
    blackbox: true,
    optional: false
  },
  "primarySource.$.who": {
    type: ReferenceSchema,
    optional: false
  },
  "primarySource.$.type": {
    type: Array,
    optional: false
  },
  "primarySource.$.type.$": {
    type: CodeableConceptSchema,
    optional: true
  },
  "primarySource.$.communicationMethod": {
    type: Array,
    optional: true
  },
  "primarySource.$.communicationMethod.$": {
    type: CodeableConceptSchema,
    optional: true
  },
  "primarySource.$.validationStatus": {
    type: CodeableConceptSchema,
    optional: true
  },
  "primarySource.$.validationDate": {
    type: Date,
    optional: true
  },
  "primarySource.$.canPushUpdates": {
    type: CodeableConceptSchema,
    optional: true
  },
  "primarySource.$.pushTypeAvailable": {
    type: Array,
    optional: true
  },
  "primarySource.$.pushTypeAvailable.$": {
    type: CodeableConceptSchema,
    optional: true
  },

  "attestation": {
    type: Array,
    optional: false
  },
  "attestation.$": {
    type: Object,
    blackbox: true,
    optional: false
  },
  "attestation.$.who": {
    type: ReferenceSchema,
    optional: false
  },
  "attestation.$.onBehalfOf": {
    type: ReferenceSchema,
    optional: true
  },
  "attestation.$.communicationMethod": {
    type: CodeableConceptSchema,
    optional: false
  },
  "attestation.$.date": {
    type: Date,
    optional: false
  },
  "attestation.$.sourceIdentityCertificate": {
    type: String,
    optional: true
  },
  "attestation.$.proxyIdentityCertificate": {
    type: String,
    optional: true
  },
  "attestation.$.proxySignature": {
    type: SignatureSchema,
    optional: true
  },
  "attestation.$.sourceSignature": {
    type: SignatureSchema,
    optional: true
  },

  "validator": {
    type: Array,
    optional: false
  },
  "validator.$": {
    type: Object,
    blackbox: true,
    optional: false
  },
  "validator.$.organization": {
    type: ReferenceSchema,
    optional: false
  },
  "validator.$.identityCertificate": {
    type: String,
    optional: false
  },
  "validator.$.attestationSignature": {
    type: SignatureSchema,
    optional: false
  }
});

// BaseSchema.extend(VerificationResultSchema);
// DomainResourceSchema.extend(VerificationResultSchema);  
// VerificationResults.attachSchema(VerificationResultSchema);

export default { VerificationResult, VerificationResults, VerificationResultSchema };