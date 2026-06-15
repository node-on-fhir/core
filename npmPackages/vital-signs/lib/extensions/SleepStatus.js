// packages/vital-signs/lib/extensions/SleepStatus.js
import SimpleSchema from 'simpl-schema';

// Sleep Status Extension Schema
// Profile: http://hl7.org/fhir/us/vitals/StructureDefinition/SleepStatusExt
// Sleep status during vital sign measurement
export const SleepStatusExtension = new SimpleSchema({
  url: {
    type: String,
    defaultValue: 'http://hl7.org/fhir/us/vitals/StructureDefinition/SleepStatusExt'
  },
  valueCodeableConcept: {
    type: Object,
    optional: false
  },
  'valueCodeableConcept.coding': {
    type: Array,
    optional: true
  },
  'valueCodeableConcept.coding.$': {
    type: Object,
    optional: true
  },
  'valueCodeableConcept.coding.$.system': {
    type: String,
    optional: true,
    defaultValue: 'http://snomed.info/sct'
  },
  'valueCodeableConcept.coding.$.code': {
    type: String,
    optional: true
  },
  'valueCodeableConcept.coding.$.display': {
    type: String,
    optional: true
  },
  'valueCodeableConcept.text': {
    type: String,
    optional: true
  }
});

// Common sleep status codes from SNOMED CT
export const SleepStatusCodes = {
  awake: {
    system: 'http://snomed.info/sct',
    code: '248218005',
    display: 'Awake'
  },
  asleep: {
    system: 'http://snomed.info/sct',
    code: '248220008',
    display: 'Asleep'
  },
  deepSleep: {
    system: 'http://snomed.info/sct',
    code: '371026002',
    display: 'Deep sleep'
  },
  lightSleep: {
    system: 'http://snomed.info/sct',
    code: '371027006',
    display: 'Light sleep'
  },
  remSleep: {
    system: 'http://snomed.info/sct',
    code: '431391004',
    display: 'REM sleep'
  },
  drowsy: {
    system: 'http://snomed.info/sct',
    code: '271782001',
    display: 'Drowsy'
  },
  justAwakened: {
    system: 'http://snomed.info/sct',
    code: '307156004',
    display: 'Just awoken'
  },
  fallingAsleep: {
    system: 'http://snomed.info/sct',
    code: '431392006',
    display: 'Falling asleep'
  },
  underAnesthesia: {
    system: 'http://snomed.info/sct',
    code: '398239001',
    display: 'Under general anesthesia'
  },
  sedated: {
    system: 'http://snomed.info/sct',
    code: '431393001',
    display: 'Sedated'
  }
};