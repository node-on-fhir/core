// packages/vital-signs/lib/extensions/AssociatedSituation.js
import SimpleSchema from 'simpl-schema';

// Associated Situation Extension Schema
// Profile: http://hl7.org/fhir/us/vitals/StructureDefinition/AssociatedSituationExt
// Situation associated with vital sign measurement (e.g., "during exercise", "while sleeping")
export const AssociatedSituationExtension = new SimpleSchema({
  url: {
    type: String,
    defaultValue: 'http://hl7.org/fhir/us/vitals/StructureDefinition/AssociatedSituationExt'
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

// Common associated situation codes from SNOMED CT
export const AssociatedSituationCodes = {
  atRest: {
    system: 'http://snomed.info/sct',
    code: '263678003',
    display: 'At rest'
  },
  duringExercise: {
    system: 'http://snomed.info/sct',
    code: '309604004', 
    display: 'During exercise'
  },
  postExercise: {
    system: 'http://snomed.info/sct',
    code: '255398004',
    display: 'Post-exercise'
  },
  beforeMeal: {
    system: 'http://snomed.info/sct',
    code: '307166007',
    display: 'Before meal'
  },
  afterMeal: {
    system: 'http://snomed.info/sct',
    code: '24863003',
    display: 'After meal'
  },
  duringSleep: {
    system: 'http://snomed.info/sct',
    code: '248218005',
    display: 'During sleep'
  }
};