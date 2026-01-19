// imports/lib/schemas/SimpleSchemas/SupplyRequests.js

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { BaseSchema, DomainResourceSchema, HumanNameSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, CodeableConceptSchema, PeriodSchema, TimingSchema, QuantitySchema } from 'meteor/clinical:hl7-resource-datatypes';

// Create the collection
export const SupplyRequests = new Mongo.Collection('SupplyRequests');

// Define the schema
const SupplyRequestSchema = new SimpleSchema({
  resourceType: {
    type: String,
    defaultValue: 'SupplyRequest'
  },
  _id: {
    type: String,
    optional: true
  },
  id: {
    type: String,
    optional: true
  },
  meta: {
    type: Object,
    optional: true,
    blackbox: true
  },
  identifier: {
    type: Array,
    optional: true
  },
  'identifier.$': {
    type: Object,
    optional: true,
    blackbox: true
  },
  status: {
    type: String,
    optional: true,
    allowedValues: ['draft', 'active', 'suspended', 'cancelled', 'completed', 'entered-in-error', 'unknown']
  },
  category: {
    type: Object,
    optional: true,
    blackbox: true
  },
  priority: {
    type: String,
    optional: true,
    allowedValues: ['routine', 'urgent', 'asap', 'stat']
  },
  itemCodeableConcept: {
    type: Object,
    optional: true,
    blackbox: true
  },
  itemReference: {
    type: Object,
    optional: true,
    blackbox: true
  },
  quantity: {
    type: Object,
    optional: true,
    blackbox: true
  },
  parameter: {
    type: Array,
    optional: true
  },
  'parameter.$': {
    type: Object,
    optional: true,
    blackbox: true
  },
  occurrenceDateTime: {
    type: String,
    optional: true
  },
  occurrencePeriod: {
    type: Object,
    optional: true,
    blackbox: true
  },
  occurrenceTiming: {
    type: Object,
    optional: true,
    blackbox: true
  },
  authoredOn: {
    type: String,
    optional: true
  },
  requester: {
    type: Object,
    optional: true,
    blackbox: true
  },
  supplier: {
    type: Array,
    optional: true
  },
  'supplier.$': {
    type: Object,
    optional: true,
    blackbox: true
  },
  reasonCode: {
    type: Array,
    optional: true
  },
  'reasonCode.$': {
    type: Object,
    optional: true,
    blackbox: true
  },
  reasonReference: {
    type: Array,
    optional: true
  },
  'reasonReference.$': {
    type: Object,
    optional: true,
    blackbox: true
  },
  deliverFrom: {
    type: Object,
    optional: true,
    blackbox: true
  },
  deliverTo: {
    type: Object,
    optional: true,
    blackbox: true
  }
});

// Meteor v3 Note: Collection2 attachSchema is not used in this codebase
// Manual validation is performed in methods instead
// SupplyRequests.attachSchema(SupplyRequestSchema);

export { SupplyRequestSchema };
export default SupplyRequests;
