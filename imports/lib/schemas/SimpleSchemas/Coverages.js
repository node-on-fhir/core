// imports/lib/schemas/SimpleSchemas/Coverages.js

import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema, MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


export let Coverages = new Mongo.Collection('Coverages');

// create the object using our BaseModel
let Coverage = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
Coverage.prototype._collection = Coverages;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Coverages._transform = function (document) {
  return new Coverage(document);
};

let CoverageSchema = DomainResourceSchema.extend({
  "resourceType" : {
    type: String,
    defaultValue: "Coverage"
  },
  "identifier" : {
    type: Array,
    optional: true
  },
  "identifier.$" : {
    type: IdentifierSchema,
    optional: true
  },
  "status" : {
    type: String,
    optional: true,
    allowedValues: ['active', 'cancelled', 'draft', 'entered-in-error']
  },
  "type" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "policyHolder" : {
    type: ReferenceSchema,
    optional: true
  },
  "subscriber" : {
    type: ReferenceSchema,
    optional: true
  },
  "subscriberId" : {
    type: String,
    optional: true
  },
  "beneficiary" : {
    type: ReferenceSchema,
    optional: true
  },
  "dependent" : {
    type: String,
    optional: true
  },
  "relationship" : {
    type: CodeableConceptSchema,
    optional: true
  },
  "period" : {
    type: PeriodSchema,
    optional: true
  },
  "payor" : {
    type: Array,
    optional: true
  },
  "payor.$" : {
    type: ReferenceSchema,
    optional: true
  },
  "class" : {
    type: Array,
    optional: true
  },
  "class.$" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "order" : {
    type: Number,
    optional: true
  },
  "network" : {
    type: String,
    optional: true
  },
  "costToBeneficiary" : {
    type: Array,
    optional: true
  },
  "costToBeneficiary.$" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "subrogation" : {
    type: Boolean,
    optional: true
  },
  "contract" : {
    type: Array,
    optional: true
  },
  "contract.$" : {
    type: ReferenceSchema,
    optional: true
  }
});

// Coverages.attachSchema(CoverageSchema);

export default { Coverage, Coverages, CoverageSchema };
