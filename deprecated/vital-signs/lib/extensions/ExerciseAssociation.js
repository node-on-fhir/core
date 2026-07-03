// packages/vital-signs/lib/extensions/ExerciseAssociation.js
import SimpleSchema from 'simpl-schema';

// Exercise Association Extension Schema
// Profile: http://hl7.org/fhir/us/vitals/StructureDefinition/ExerciseAssociationExt
// Exercise-related context for vital sign measurement
export const ExerciseAssociationExtension = new SimpleSchema({
  url: {
    type: String,
    defaultValue: 'http://hl7.org/fhir/us/vitals/StructureDefinition/ExerciseAssociationExt'
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
    defaultValue: 'http://loinc.org'
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

// Common exercise association codes from LOINC
export const ExerciseAssociationCodes = {
  restingBaseline: {
    system: 'http://loinc.org',
    code: 'LA24917-1',
    display: 'At rest'
  },
  postExercise: {
    system: 'http://loinc.org',
    code: 'LA24919-7',
    display: 'Post exercise'
  },
  duringExercise: {
    system: 'http://loinc.org',
    code: 'LA24918-9',
    display: 'During exercise'
  },
  preExercise: {
    system: 'http://loinc.org',
    code: 'LA24920-5',
    display: 'Pre-exercise'
  },
  maxActivity: {
    system: 'http://loinc.org',
    code: 'LA24921-3',
    display: 'At maximum activity'
  },
  recovery: {
    system: 'http://loinc.org',
    code: 'LA24922-1',
    display: 'During recovery'
  },
  postChallenge: {
    system: 'http://loinc.org',
    code: 'LA15835-6',
    display: 'Post challenge'
  }
};