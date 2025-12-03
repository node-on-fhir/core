// imports/lib/schemas/SimpleSchemas/MedicationDispenses.js

import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema, MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


export let MedicationDispenses = new Mongo.Collection('MedicationDispenses');

// create the object using our BaseModel
let MedicationDispense = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
MedicationDispense.prototype._collection = MedicationDispenses;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
MedicationDispenses._transform = function (document) {
  return new MedicationDispense(document);
};

let MedicationDispenseSchema = DomainResourceSchema.extend({
  "resourceType" : {
    type: String,
    defaultValue: "MedicationDispense"
  },
  "identifier" : {
    type: Array,
    optional: true
  },
  "identifier.$" : {
    type: IdentifierSchema,
    optional: true
  },
  "partOf" : {
    type: Array,
    optional: true
  },
  "partOf.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "status" : {
    type: String,
    optional: true,
    allowedValues: ['preparation', 'in-progress', 'cancelled', 'on-hold', 'completed', 'entered-in-error', 'stopped', 'declined', 'unknown']
  },
  "statusReasonCodeableConcept" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "statusReasonReference" : {
    type: ReferenceSchema,
    optional: true
  },
  "category" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "medicationCodeableConcept" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "medicationReference" : {
    type: ReferenceSchema,
    optional: true
  },
  "subject" : {
    type: ReferenceSchema,
    optional: true
  },
  "context" : {
    type: ReferenceSchema,
    optional: true
  },
  "supportingInformation" : {
    type: Array,
    optional: true
  },
  "supportingInformation.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "performer" : {
    type: Array,
    optional: true
  },
  "performer.$" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "location" : {
    type: ReferenceSchema,
    optional: true
  },
  "authorizingPrescription" : {
    type: Array,
    optional: true
  },
  "authorizingPrescription.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "type" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "quantity" : {
    type: QuantitySchema,
    optional: true
  },
  "daysSupply" : {
    type: QuantitySchema,
    optional: true
  },
  "whenPrepared" : {
    type: Date,
    optional: true
  },
  "whenHandedOver" : {
    type: Date,
    optional: true
  },
  "destination" : {
    type: ReferenceSchema,
    optional: true
  },
  "receiver" : {
    type: Array,
    optional: true
  },
  "receiver.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "note" : {
    type: Array,
    optional: true
  },
  "note.$" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "dosageInstruction" : {
    type: Array,
    optional: true
  },
  "dosageInstruction.$" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "substitution" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "detectedIssue" : {
    type: Array,
    optional: true
  },
  "detectedIssue.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "eventHistory" : {
    type: Array,
    optional: true
  },
  "eventHistory.$" : {
    type: ReferenceSchema,
    optional: true
  }
});

// MedicationDispenses.attachSchema(MedicationDispenseSchema);

export default { MedicationDispense, MedicationDispenses, MedicationDispenseSchema };
