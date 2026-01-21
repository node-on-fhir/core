// /Volumes/LangCortex/Code/honeycomb-ehr/imports/lib/schemas/SimpleSchemas/Substances.js

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import { BaseSchema, CodeableConceptSchema, IdentifierSchema, ReferenceSchema, QuantitySchema, RatioSchema } from 'meteor/clinical:hl7-resource-datatypes';

// Create the collection
export const Substances = new Mongo.Collection('Substances');

// R4 Schema for Substance
const SubstanceR4 = new SimpleSchema({
  "resourceType": {
    type: String,
    defaultValue: "Substance"
  },
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
  "text": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "identifier": {
    type: Array,
    optional: true
  },
  "identifier.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "status": {
    type: String,
    optional: true,
    allowedValues: ['active', 'inactive', 'entered-in-error']
  },
  "category": {
    type: Array,
    optional: true
  },
  "category.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "code": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "description": {
    type: String,
    optional: true
  },
  "instance": {
    type: Array,
    optional: true
  },
  "instance.$": {
    type: Object,
    optional: true
  },
  "instance.$.identifier": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "instance.$.expiry": {
    type: String,
    optional: true
  },
  "instance.$.quantity": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "ingredient": {
    type: Array,
    optional: true
  },
  "ingredient.$": {
    type: Object,
    optional: true
  },
  "ingredient.$.quantity": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "ingredient.$.substanceCodeableConcept": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "ingredient.$.substanceReference": {
    type: Object,
    optional: true,
    blackbox: true
  }
});

export const SubstanceSchema = SubstanceR4;

// Attach schema to collection
// Substances.attachSchema(SubstanceSchema);

export default { Substances, SubstanceSchema };
