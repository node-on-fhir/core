// packages/vital-signs/lib/extensions/BodyPosition.js
import SimpleSchema from 'simpl-schema';

// Body Position Extension Schema
// Profile: http://hl7.org/fhir/us/vitals/StructureDefinition/BodyPositionExt
// Body position during vital sign measurement
export const BodyPositionExtension = new SimpleSchema({
  url: {
    type: String,
    defaultValue: 'http://hl7.org/fhir/us/vitals/StructureDefinition/BodyPositionExt'
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

// Common body position codes from SNOMED CT
export const BodyPositionCodes = {
  sitting: {
    system: 'http://snomed.info/sct',
    code: '33586001',
    display: 'Sitting position'
  },
  lying: {
    system: 'http://snomed.info/sct',
    code: '102538003',
    display: 'Lying position'
  },
  standing: {
    system: 'http://snomed.info/sct',
    code: '10904000',
    display: 'Standing position'
  },
  supine: {
    system: 'http://snomed.info/sct',
    code: '40199007',
    display: 'Supine position'
  },
  prone: {
    system: 'http://snomed.info/sct',
    code: '1240000',
    display: 'Prone position'
  },
  sittingUpright: {
    system: 'http://snomed.info/sct',
    code: '424571002',
    display: 'Sitting upright'
  },
  leftLateralDecubitus: {
    system: 'http://snomed.info/sct',
    code: '102535001',
    display: 'Left lateral decubitus position'
  },
  rightLateralDecubitus: {
    system: 'http://snomed.info/sct',
    code: '102536000',
    display: 'Right lateral decubitus position'
  },
  semiRecumbent: {
    system: 'http://snomed.info/sct',
    code: '272580008',
    display: 'Semi-recumbent position'
  },
  trendelenburg: {
    system: 'http://snomed.info/sct',
    code: '34106002',
    display: 'Trendelenburg position'
  }
};