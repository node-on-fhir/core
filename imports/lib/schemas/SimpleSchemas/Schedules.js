// /imports/lib/schemas/SimpleSchemas/Schedules.js

import { Mongo } from 'meteor/mongo';
import { BaseSchema, CodeableConceptSchema, IdentifierSchema, PeriodSchema, ReferenceSchema } from 'meteor/clinical:hl7-resource-datatypes'
import BaseModel from '../../BaseModel';
import SimpleSchema from 'simpl-schema';

// create the object using our BaseModel
let Schedule = BaseModel.extend();

export let Schedules = new Mongo.Collection('Schedules');

//Assign a collection so the object knows how to perform CRUD operations
Schedule.prototype._collection = Schedules;

// create the schema
let ScheduleSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Schedule"
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
  "active" : {
    optional: true,
    type: Boolean,
    defaultValue: true
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
  "actor" : {
    optional: true,
    type: Array
  },
  "actor.$" : {
    optional: true,
    blackbox: true,
    type: ReferenceSchema
  },
  "planningHorizon" : {
    optional: true,
    blackbox: true,
    type: PeriodSchema
  },
  "comment" : {
    optional: true,
    type: String
  },
  // Custom field for testing
  "notes" : {
    optional: true,
    type: String
  }
});

// attach the schema for server/client side validation
BaseSchema.extend(ScheduleSchema);

export default { Schedule, Schedules, ScheduleSchema };