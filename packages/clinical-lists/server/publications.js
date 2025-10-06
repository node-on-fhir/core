// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/clinical-lists/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

// Publish conditions for a specific patient
Meteor.publish('conditions.byPatient', function(patientId) {
  check(patientId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  const Conditions = global.Collections?.Conditions;
  if (!Conditions) {
    console.warn('Conditions collection not available');
    return this.ready();
  }
  
  return Conditions.find({
    'subject.reference': `Patient/${patientId}`
  }, {
    sort: { recordedDate: -1 },
    limit: 100
  });
});

// Publish allergy intolerances for a specific patient
Meteor.publish('allergyIntolerances.byPatient', function(patientId) {
  check(patientId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  const AllergyIntolerances = global.Collections?.AllergyIntolerances;
  if (!AllergyIntolerances) {
    console.warn('AllergyIntolerances collection not available');
    return this.ready();
  }
  
  return AllergyIntolerances.find({
    'patient.reference': `Patient/${patientId}`
  }, {
    sort: { recordedDate: -1 },
    limit: 100
  });
});

// Publish medication statements for a specific patient
Meteor.publish('medicationStatements.byPatient', function(patientId) {
  check(patientId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  const MedicationStatements = global.Collections?.MedicationStatements;
  if (!MedicationStatements) {
    console.warn('MedicationStatements collection not available');
    return this.ready();
  }
  
  return MedicationStatements.find({
    'subject.reference': `Patient/${patientId}`
  }, {
    sort: { dateAsserted: -1 },
    limit: 100
  });
});