// packages/vital-signs/lib/schemas/Height.js
import SimpleSchema from 'simpl-schema';
import { get } from 'lodash';

// Body Height Schema
// Profile: http://hl7.org/fhir/us/vitals/StructureDefinition/body-height
export const HeightSchema = new SimpleSchema({
  resourceType: {
    type: String,
    defaultValue: 'Observation'
  },
  id: {
    type: String,
    optional: true
  },
  meta: {
    type: Object,
    optional: true,
    blackbox: true,
    defaultValue: {
      profile: ['http://hl7.org/fhir/us/vitals/StructureDefinition/body-height']
    }
  },
  identifier: {
    type: Array,
    optional: true
  },
  'identifier.$': {
    type: Object,
    blackbox: true
  },
  status: {
    type: String,
    allowedValues: ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'],
    defaultValue: 'final'
  },
  category: {
    type: Array,
    minCount: 1,
    defaultValue: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }],
      text: 'Vital Signs'
    }]
  },
  'category.$': {
    type: Object,
    blackbox: true
  },
  code: {
    type: Object,
    blackbox: true,
    defaultValue: {
      coding: [{
        system: 'http://loinc.org',
        code: '8302-2',
        display: 'Body height'
      }],
      text: 'Body height'
    }
  },
  subject: {
    type: Object,
    blackbox: true,
    optional: false
  },
  encounter: {
    type: Object,
    blackbox: true,
    optional: true
  },
  effectiveDateTime: {
    type: Date,
    optional: true,
    defaultValue: new Date()
  },
  effectivePeriod: {
    type: Object,
    blackbox: true,
    optional: true
  },
  issued: {
    type: Date,
    optional: true
  },
  performer: {
    type: Array,
    optional: true
  },
  'performer.$': {
    type: Object,
    blackbox: true
  },
  valueQuantity: {
    type: Object,
    optional: true,
    blackbox: true
  },
  dataAbsentReason: {
    type: Object,
    blackbox: true,
    optional: true
  },
  interpretation: {
    type: Array,
    optional: true
  },
  'interpretation.$': {
    type: Object,
    blackbox: true
  },
  note: {
    type: Array,
    optional: true
  },
  'note.$': {
    type: Object,
    blackbox: true
  },
  method: {
    type: Object,
    blackbox: true,
    optional: true
  },
  device: {
    type: Object,
    blackbox: true,
    optional: true
  },
  referenceRange: {
    type: Array,
    optional: true
  },
  'referenceRange.$': {
    type: Object,
    blackbox: true
  },
  hasMember: {
    type: Array,
    optional: true
  },
  'hasMember.$': {
    type: Object,
    blackbox: true
  },
  derivedFrom: {
    type: Array,
    optional: true
  },
  'derivedFrom.$': {
    type: Object,
    blackbox: true
  },
  // Extensions
  extension: {
    type: Array,
    optional: true
  },
  'extension.$': {
    type: Object,
    blackbox: true
  }
});
