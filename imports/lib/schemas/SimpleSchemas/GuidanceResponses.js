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


export let GuidanceResponses = new Mongo.Collection('GuidanceResponses');

// create the object using our BaseModel
let GuidanceResponse = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
GuidanceResponse.prototype._collection = GuidanceResponses;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
GuidanceResponses._transform = function (document) {
  return new GuidanceResponse(document);
};

let GuidanceResponseR4Schema = new SimpleSchema({
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
    defaultValue: "GuidanceResponse"
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
    optional: true,
    type: IdentifierSchema
  },
  "requestIdentifier": {
    optional: true,
    type: IdentifierSchema
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
  "moduleUri": {
    optional: true,
    type: String
  },
  "moduleCanonical": {
    optional: true,
    type: String
  },
  "moduleCodeableConcept": {
    optional: true,
    type: CodeableConceptSchema
  },
  "status": {
    type: Code,
    allowedValues: ['success', 'data-requested', 'data-required', 'in-progress', 'failure', 'entered-in-error']
  },
  "subject": {
    optional: true,
    type: ReferenceSchema
  },
  "encounter": {
    optional: true,
    type: ReferenceSchema
  },
  "occurrenceDateTime": {
    optional: true,
    type: Date
  },
  "performer": {
    optional: true,
    type: ReferenceSchema
  },
  "reasonCode": {
    optional: true,
    type: Array
  },
  "reasonCode.$": {
    optional: true,
    type: CodeableConceptSchema
  },
  "reasonReference": {
    optional: true,
    type: Array
  },
  "reasonReference.$": {
    optional: true,
    type: ReferenceSchema
  },
  "note": {
    optional: true,
    type: Array
  },
  "note.$": {
    optional: true,
    type: AnnotationSchema
  },
  "evaluationMessage": {
    optional: true,
    type: Array
  },
  "evaluationMessage.$": {
    optional: true,
    type: ReferenceSchema
  },
  "outputParameters": {
    optional: true,
    type: ReferenceSchema
  },
  "result": {
    optional: true,
    type: ReferenceSchema
  },
  "dataRequirement": {
    optional: true,
    type: Array
  },
  "dataRequirement.$": {
    optional: true,
    // type: DataRequirementSchema
    blackbox: true,
    type: Object
  }
});

// GuidanceResponses.attachSchema(GuidanceResponseR4Schema);

export default { GuidanceResponse, GuidanceResponses, GuidanceResponseR4Schema };