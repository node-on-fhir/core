// packages/vital-signs/lib/extensions/MeasurementSetting.js
import SimpleSchema from 'simpl-schema';

// Measurement Setting Extension Schema
// Profile: http://hl7.org/fhir/us/vitals/StructureDefinition/MeasurementSettingExt
// Location/setting where measurement was taken
export const MeasurementSettingExtension = new SimpleSchema({
  url: {
    type: String,
    defaultValue: 'http://hl7.org/fhir/us/vitals/StructureDefinition/MeasurementSettingExt'
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

// Common measurement setting codes from SNOMED CT
export const MeasurementSettingCodes = {
  // Clinical settings
  hospital: {
    system: 'http://snomed.info/sct',
    code: '22232009',
    display: 'Hospital'
  },
  emergencyDepartment: {
    system: 'http://snomed.info/sct',
    code: '225728007',
    display: 'Emergency department'
  },
  intensiveCareUnit: {
    system: 'http://snomed.info/sct',
    code: '309904001',
    display: 'Intensive care unit'
  },
  outpatientClinic: {
    system: 'http://snomed.info/sct',
    code: '39350007',
    display: 'Outpatient clinic'
  },
  physicianOffice: {
    system: 'http://snomed.info/sct',
    code: '91154008',
    display: 'Physician office'
  },
  
  // Non-clinical settings
  home: {
    system: 'http://snomed.info/sct',
    code: '264362003',
    display: 'Home'
  },
  school: {
    system: 'http://snomed.info/sct',
    code: '257698009',
    display: 'School'
  },
  workplace: {
    system: 'http://snomed.info/sct',
    code: '257710009',
    display: 'Workplace'
  },
  
  // Specific hospital areas
  operatingRoom: {
    system: 'http://snomed.info/sct',
    code: '225738002',
    display: 'Operating room'
  },
  recoveryRoom: {
    system: 'http://snomed.info/sct',
    code: '448421000124105',
    display: 'Recovery room'
  },
  nursingStation: {
    system: 'http://snomed.info/sct',
    code: '225746001',
    display: 'Nursing station'
  },
  
  // Ambulatory settings
  ambulance: {
    system: 'http://snomed.info/sct',
    code: '11424001',
    display: 'Ambulance'
  },
  pharmacy: {
    system: 'http://snomed.info/sct',
    code: '257692005',
    display: 'Pharmacy'
  },
  
  // Long-term care
  nursingHome: {
    system: 'http://snomed.info/sct',
    code: '42665001',
    display: 'Nursing home'
  },
  assistedLiving: {
    system: 'http://snomed.info/sct',
    code: '224929001',
    display: 'Assisted living facility'
  }
};