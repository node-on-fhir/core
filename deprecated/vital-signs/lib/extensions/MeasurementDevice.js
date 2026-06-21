// packages/vital-signs/lib/extensions/MeasurementDevice.js
import SimpleSchema from 'simpl-schema';

// Measurement Device Extension Schema
// Profile: http://hl7.org/fhir/us/vitals/StructureDefinition/MeasurementDeviceExt
// Type of device used for measurement (beyond device reference)
export const MeasurementDeviceExtension = new SimpleSchema({
  url: {
    type: String,
    defaultValue: 'http://hl7.org/fhir/us/vitals/StructureDefinition/MeasurementDeviceExt'
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

// Common measurement device codes from SNOMED CT
export const MeasurementDeviceCodes = {
  // Blood pressure devices
  mercuryManometer: {
    system: 'http://snomed.info/sct',
    code: '466093008',
    display: 'Automatic-inflation electronic sphygmomanometer'
  },
  aneroidManometer: {
    system: 'http://snomed.info/sct',
    code: '43770009',
    display: 'Doppler device'
  },
  automaticCuff: {
    system: 'http://snomed.info/sct',
    code: '445949006',
    display: 'Electronic sphygmomanometer'
  },
  
  // Temperature devices
  oralThermometer: {
    system: 'http://snomed.info/sct',
    code: '467495008',
    display: 'Oral thermometer'
  },
  tympanicThermometer: {
    system: 'http://snomed.info/sct',
    code: '467178004',
    display: 'Tympanic thermometer'
  },
  temporalThermometer: {
    system: 'http://snomed.info/sct',
    code: '448349000',
    display: 'Temporal artery thermometer'
  },
  rectalThermometer: {
    system: 'http://snomed.info/sct',
    code: '467862000',
    display: 'Rectal thermometer'
  },
  
  // Oxygen saturation devices
  pulseOximeter: {
    system: 'http://snomed.info/sct',
    code: '426851007',
    display: 'Pulse oximeter'
  },
  
  // Weight/scale devices
  standingScale: {
    system: 'http://snomed.info/sct',
    code: '462856008',
    display: 'Body weight scale'
  },
  wheelchairScale: {
    system: 'http://snomed.info/sct',
    code: '466532009',
    display: 'Wheelchair scale'
  },
  
  // Heart rate devices
  ecgMonitor: {
    system: 'http://snomed.info/sct',
    code: '466421006',
    display: 'Electrocardiograph monitor'
  },
  
  // Respiratory rate devices
  respiratoryMonitor: {
    system: 'http://snomed.info/sct',
    code: '336588000',
    display: 'Respiratory monitor'
  }
};