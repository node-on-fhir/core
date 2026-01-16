import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// Create the FHIR Claims collection
export const Claims = new Mongo.Collection('Claims');

// Define the FHIR Claims schema
const ClaimSchema = new SimpleSchema({
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
    defaultValue: "Claim"
  },
  "identifier": {
    type: Array,
    optional: true
  },
  "identifier.$": {
    type: Object,
    blackbox: true
  },
  "status": {
    type: String,
    optional: true,
    allowedValues: ["active", "cancelled", "draft", "entered-in-error"]
  },
  "type": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "subType": {
    type: Array,
    optional: true
  },
  "subType.$": {
    type: Object,
    blackbox: true
  },
  "use": {
    type: String,
    optional: true,
    allowedValues: ["claim", "preauthorization", "predetermination"]
  },
  "patient": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "billablePeriod": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "created": {
    type: Date,
    optional: true
  },
  "enterer": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "insurer": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "provider": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "priority": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "fundsReserve": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "related": {
    type: Array,
    optional: true
  },
  "related.$": {
    type: Object,
    blackbox: true
  },
  "prescription": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "payee": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "careTeam": {
    type: Array,
    optional: true
  },
  "careTeam.$": {
    type: Object,
    blackbox: true
  },
  "supportingInfo": {
    type: Array,
    optional: true
  },
  "supportingInfo.$": {
    type: Object,
    blackbox: true
  },
  "diagnosis": {
    type: Array,
    optional: true
  },
  "diagnosis.$": {
    type: Object,
    blackbox: true
  },
  "procedure": {
    type: Array,
    optional: true
  },
  "procedure.$": {
    type: Object,
    blackbox: true
  },
  "insurance": {
    type: Array,
    optional: true
  },
  "insurance.$": {
    type: Object,
    blackbox: true
  },
  "accident": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "item": {
    type: Array,
    optional: true
  },
  "item.$": {
    type: Object,
    blackbox: true
  },
  "total": {
    type: Object,
    optional: true,
    blackbox: true
  }
});

// Attach the schema to the collection
// Claims.attachSchema(ClaimSchema);

export default { Claims, ClaimSchema };
