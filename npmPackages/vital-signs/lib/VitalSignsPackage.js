// packages/vital-signs/lib/VitalSignsPackage.js
import { Meteor } from 'meteor/meteor';

export const VitalSignsPackage = {
  name: 'clinical:vital-signs',
  version: '0.1.0',
  summary: 'HL7 FHIR Vital Signs Implementation Guide for Meteor/Honeycomb',
  
  // IG Metadata
  ig: {
    packageId: 'hl7.fhir.us.vitals',
    canonicalUrl: 'http://hl7.org/fhir/us/vitals',
    version: '2.0.0',
    fhirVersion: '4.0.1',
    publisher: 'HL7 International - Clinical Information Modeling Initiative',
    title: 'Vital Signs with Qualifying Elements'
  },
  
  // Supported profiles
  profiles: [
    'VitalSignsPanel',
    'BloodPressurePanel', 
    'AverageBloodPressure',
    'TwentyFourHourBloodPressure',
    'BodyWeight',
    'BodyTemperature',
    'BodyMassIndex',
    'BodyLength',
    'Height',
    'HeartRate',
    'RespiratoryRate',
    'OxygenSaturationArterialBlood',
    'OxygenSaturationArterialBloodPulseOx',
    'HeadOccipitalFrontalCircumference',
    'BloodPressureDevice'
  ],
  
  // Custom extensions
  extensions: [
    'AssociatedSituation',
    'BodyPosition', 
    'ExerciseAssociation',
    'MeasurementDevice',
    'MeasurementSetting',
    'SleepStatus'
  ],
  
  // LOINC codes for vital signs
  loincCodes: {
    vitalSignsPanel: '85353-1',
    bloodPressurePanel: '85354-9',
    systolicBP: '8480-6',
    diastolicBP: '8462-4',
    meanArterialBP: '8478-0',
    bodyWeight: '29463-7',
    bodyHeight: '8302-2',
    bodyLength: '8306-3',
    bodyTemperature: '8310-5',
    heartRate: '8867-4',
    respiratoryRate: '9279-1',
    oxygenSaturation: '2708-6',
    bmi: '39156-5',
    headCircumference: '9843-4'
  },
  
  // Initialize package
  initialize: function() {
    if (Meteor.isServer) {
      console.log('Initializing VitalSigns package v' + this.version);
      // Add any server initialization logic here
    }
    
    if (Meteor.isClient) {
      console.log('VitalSigns package ready on client');
      // Add any client initialization logic here
    }
  }
};

// Auto-initialize on startup
Meteor.startup(function() {
  VitalSignsPackage.initialize();
});