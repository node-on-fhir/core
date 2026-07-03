// packages/patient-matching/server/publications/patients.js
import { Meteor } from 'meteor/meteor';

// Simple publication for patient matching
// Note: In production, this should have proper access controls
Meteor.publish('patients.all', function() {
  if (!this.userId) {
    return this.ready();
  }
  
  const Patients = Meteor.Collections?.Patients;
  if (!Patients) {
    console.warn('PatientMatching: Patients collection not found'); // phi-audit: ok
    return this.ready();
  }
  
  // Return all patients for now - in production this should be limited
  return Patients.find({}, {
    limit: 100,
    fields: {
      name: 1,
      birthDate: 1,
      gender: 1,
      identifier: 1,
      id: 1,
      _id: 1
    }
  });
});