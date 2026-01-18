// imports/lib/schemas/SimpleSchemas/ClinicalImpressions.js
// ClinicalImpression FHIR R4 Schema - A record of a clinical assessment performed to determine what problem(s) may affect the patient and before planning the treatments or management strategies that are best to manage a patient's condition.

import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import { AddressSchema, BaseSchema, ContactPointSchema, CodeableConceptSchema, DomainResourceSchema, IdentifierSchema, MoneySchema, PeriodSchema, QuantitySchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';

// create the object using our BaseModel
let ClinicalImpression = BaseModel.extend();

export let ClinicalImpressions = new Mongo.Collection('ClinicalImpressions');

// Assign a collection so the object knows how to perform CRUD operations
ClinicalImpression.prototype._collection = ClinicalImpressions;

// Add the transform to the collection
ClinicalImpressions._transform = function (document) {
  return new ClinicalImpression(document);
};

let ClinicalImpressionSchema = DomainResourceSchema.extend({
  "resourceType": {
    type: String,
    defaultValue: "ClinicalImpression"
  },
  "identifier": {
    optional: true,
    type: Array
  },
  "identifier.$": {
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
  "status": {
    optional: true,
    type: String,
    allowedValues: ['in-progress', 'completed', 'entered-in-error']
  },
  "statusReason": {
    optional: true,
    type: CodeableConceptSchema
  },
  "code": {
    optional: true,
    type: CodeableConceptSchema
  },
  "description": {
    optional: true,
    type: String
  },
  "subject": {
    optional: true,
    type: ReferenceSchema
  },
  "encounter": {
    optional: true,
    type: ReferenceSchema
  },
  "effectiveDateTime": {
    optional: true,
    type: String
  },
  "effectivePeriod": {
    optional: true,
    type: PeriodSchema
  },
  "date": {
    optional: true,
    type: String
  },
  "assessor": {
    optional: true,
    type: ReferenceSchema
  },
  "previous": {
    optional: true,
    type: ReferenceSchema
  },
  "problem": {
    optional: true,
    type: Array
  },
  "problem.$": {
    optional: true,
    type: ReferenceSchema
  },
  "investigation": {
    optional: true,
    type: Array
  },
  "investigation.$": {
    optional: true,
    type: Object
  },
  "investigation.$.code": {
    optional: true,
    type: CodeableConceptSchema
  },
  "investigation.$.item": {
    optional: true,
    type: Array
  },
  "investigation.$.item.$": {
    optional: true,
    type: ReferenceSchema
  },
  "protocol": {
    optional: true,
    type: Array
  },
  "protocol.$": {
    optional: true,
    type: String
  },
  "summary": {
    optional: true,
    type: String
  },
  "finding": {
    optional: true,
    type: Array
  },
  "finding.$": {
    optional: true,
    type: Object
  },
  "finding.$.itemCodeableConcept": {
    optional: true,
    type: CodeableConceptSchema
  },
  "finding.$.itemReference": {
    optional: true,
    type: ReferenceSchema
  },
  "finding.$.basis": {
    optional: true,
    type: String
  },
  "prognosisCodeableConcept": {
    optional: true,
    type: Array
  },
  "prognosisCodeableConcept.$": {
    optional: true,
    type: CodeableConceptSchema
  },
  "prognosisReference": {
    optional: true,
    type: Array
  },
  "prognosisReference.$": {
    optional: true,
    type: ReferenceSchema
  },
  "supportingInfo": {
    optional: true,
    type: Array
  },
  "supportingInfo.$": {
    optional: true,
    type: ReferenceSchema
  },
  "note": {
    optional: true,
    type: Array
  },
  "note.$": {
    optional: true,
    type: Object,
    blackbox: true
  }
});

// ClinicalImpressions.attachSchema(ClinicalImpressionSchema);

export default { ClinicalImpression, ClinicalImpressions, ClinicalImpressionSchema };
