// /imports/lib/schemas/SimpleSchemas/Slots.js

import { Mongo } from 'meteor/mongo';
import { BaseSchema, CodeableConceptSchema, IdentifierSchema, ReferenceSchema } from 'meteor/clinical:hl7-resource-datatypes'
import BaseModel from '../../BaseModel';
import SimpleSchema from 'simpl-schema';

// create the object using our BaseModel
let Slot = BaseModel.extend();

export let Slots = new Mongo.Collection('Slots');

//Assign a collection so the object knows how to perform CRUD operations
Slot.prototype._collection = Slots;

// create the schema
let SlotSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Slot"
  },
  "_id" : {
    optional: true,
    type: String
  },
  "id" : {
    optional: true,
    type: String
  },
  "identifier" : {
    optional: true,
    type: Array
  },
  "identifier.$" : {
    optional: true,
    blackbox: true,
    type: IdentifierSchema
  },
  "serviceCategory" : {
    optional: true,
    type: Array
  },
  "serviceCategory.$" : {
    optional: true,
    blackbox: true,
    type: CodeableConceptSchema
  },
  "serviceType" : {
    optional: true,
    type: Array
  },
  "serviceType.$" : {
    optional: true,
    blackbox: true,
    type: CodeableConceptSchema
  },
  "specialty" : {
    optional: true,
    type: Array
  },
  "specialty.$" : {
    optional: true,
    blackbox: true,
    type: CodeableConceptSchema
  },
  "appointmentType" : {
    optional: true,
    blackbox: true,
    type: CodeableConceptSchema
  },
  "schedule" : {
    optional: true,
    blackbox: true,
    type: ReferenceSchema
  },
  "status" : {
    optional: true,
    type: String,
    allowedValues: ['busy', 'free', 'busy-unavailable', 'busy-tentative', 'entered-in-error']
  },
  "start" : {
    optional: true,
    type: Date
  },
  "end" : {
    optional: true,
    type: Date
  },
  "overbooked" : {
    optional: true,
    type: Boolean,
    defaultValue: false
  },
  "comment" : {
    optional: true,
    type: String
  }
});

// attach the schema for server/client side validation
BaseSchema.extend(SlotSchema);

export default { Slot, Slots, SlotSchema };
