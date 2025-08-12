// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/lib/schemas/SimpleSchemas/SupplyDeliveries.js

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

import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ReferenceSchema, ContactPointSchema, AddressSchema, SignatureSchema, CodeableConceptSchema, QuantitySchema, PeriodSchema, RangeSchema, Code } from 'meteor/clinical:hl7-resource-datatypes';

// create the object using our BaseModel
let SupplyDelivery = BaseModel.extend();

export let SupplyDeliveries = new Mongo.Collection('SupplyDeliveries');

//Assign a collection so the object knows how to perform CRUD operations
SupplyDelivery.prototype._collection = SupplyDeliveries;

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
SupplyDeliveries._transform = function (document) {
  return new SupplyDelivery(document);
};

// SupplyDelivery.Item Schema
let SupplyDeliveryItemSchema = new SimpleSchema({
  "quantity": {
    optional: true,
    type: QuantitySchema
  },
  "itemCodeableConcept": {
    optional: true,
    type: CodeableConceptSchema
  },
  "itemReference": {
    optional: true,
    type: ReferenceSchema
  }
});

// Main SupplyDelivery Schema (FHIR R4)
let SupplyDeliverySchema = new SimpleSchema({
  "_id": {
    type: String,
    optional: true
  },
  "id": {
    type: String,
    optional: true
  },
  "resourceType": {
    type: String,
    defaultValue: "SupplyDelivery"
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
    optional: true,
    type: IdentifierSchema
  },
  "basedOn": {
    optional: true,
    type: Array
  },
  "basedOn.$": {
    optional: true,
    type: ReferenceSchema
  },
  "partOf": {
    optional: true,
    type: Array
  },
  "partOf.$": {
    optional: true,
    type: ReferenceSchema
  },
  "status": {
    optional: true,
    type: String,
    allowedValues: ['in-progress', 'completed', 'abandoned', 'entered-in-error']
  },
  "patient": {
    optional: true,
    type: ReferenceSchema
  },
  "type": {
    optional: true,
    type: CodeableConceptSchema
  },
  "suppliedItem": {
    optional: true,
    type: SupplyDeliveryItemSchema
  },
  "occurrenceDateTime": {
    optional: true,
    type: Date
  },
  "occurrencePeriod": {
    optional: true,
    type: PeriodSchema
  },
  "occurrenceTiming": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "supplier": {
    optional: true,
    type: ReferenceSchema
  },
  "destination": {
    optional: true,
    type: ReferenceSchema
  },
  "receiver": {
    optional: true,
    type: Array
  },
  "receiver.$": {
    optional: true,
    type: ReferenceSchema
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
  "text": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "contained": {
    optional: true,
    type: Array
  },
  "contained.$": {
    optional: true,
    blackbox: true,
    type: Object
  },
  "meta": {
    optional: true,
    blackbox: true,
    type: Object
  }
});

// // Basic validation messages
// if (Meteor.isClient) {
//   SupplyDeliverySchema.messageBox.messages({
//     en: {
//       required: "{{{label}}} is required",
//       minString: "{{{label}}} must be at least {{min}} characters",
//       maxString: "{{{label}}} cannot exceed {{max}} characters",
//       minNumber: "{{{label}}} must be at least {{min}}",
//       maxNumber: "{{{label}}} cannot exceed {{max}}",
//       minDate: "{{{label}}} must be on or after {{min}}",
//       maxDate: "{{{label}}} must be on or before {{max}}",
//       badDate: "{{{label}}} is not a valid date",
//       minCount: "You must specify at least {{minCount}} values",
//       maxCount: "You cannot specify more than {{maxCount}} values",
//       noDecimal: "{{{label}}} must be an integer",
//       notAllowed: "{{{value}}} is not an allowed value",
//       expectedString: "{{{label}}} must be a string",
//       expectedNumber: "{{{label}}} must be a number",
//       expectedBoolean: "{{{label}}} must be a boolean",
//       expectedArray: "{{{label}}} must be an array",
//       expectedObject: "{{{label}}} must be an object",
//       expectedConstructor: "{{{label}}} must be a {{type}}",
//       regEx: [
//         {msg: "{{{label}}} failed regular expression validation"},
//         {exp: SimpleSchema.RegEx.Email, msg: "{{{label}}} must be a valid e-mail address"},
//         {exp: SimpleSchema.RegEx.WeakEmail, msg: "{{{label}}} must be a valid e-mail address"},
//         {exp: SimpleSchema.RegEx.Domain, msg: "{{{label}}} must be a valid domain"},
//         {exp: SimpleSchema.RegEx.WeakDomain, msg: "{{{label}}} must be a valid domain"},
//         {exp: SimpleSchema.RegEx.IP, msg: "{{{label}}} must be a valid IPv4 or IPv6 address"},
//         {exp: SimpleSchema.RegEx.IPv4, msg: "{{{label}}} must be a valid IPv4 address"},
//         {exp: SimpleSchema.RegEx.IPv6, msg: "{{{label}}} must be a valid IPv6 address"},
//         {exp: SimpleSchema.RegEx.Url, msg: "{{{label}}} must be a valid URL"},
//         {exp: SimpleSchema.RegEx.Id, msg: "{{{label}}} must be a valid alphanumeric ID"}
//       ],
//       keyNotInSchema: "{{{name}}} is not allowed by the schema"
//     }
//   });
// }

// Meteor v3 Note: Collection2 attachSchema is not used in this codebase
// Manual validation is performed in methods instead
// SupplyDeliveries.attachSchema(SupplyDeliverySchema);

export { SupplyDeliverySchema, SupplyDelivery };