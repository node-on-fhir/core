// /imports/lib/SessionHelpers.js
// Helper functions for handling Session storage with ObjectID support

import { Session } from 'meteor/session';

// Convert ObjectID to string if needed
function normalizeId(id) {
  if (id && typeof id === 'object' && id._str) {
    return id._str;
  }
  return id;
}

// Wrapper for Session.set that handles ObjectIDs
export function setSelectedPatient(patient, patientId) {
  if (patient) {
    // Ensure the patient object has a normalized _id
    const normalizedPatient = { ...patient };
    if (normalizedPatient._id) {
      normalizedPatient._id = normalizeId(normalizedPatient._id);
    }
    Session.set('selectedPatient', normalizedPatient);
  } else {
    Session.set('selectedPatient', patient);
  }
  
  if (patientId !== undefined) {
    Session.set('selectedPatientId', normalizeId(patientId));
  } else if (patient && patient._id) {
    Session.set('selectedPatientId', normalizeId(patient._id));
  }
}

// Export the normalize function for other uses
export { normalizeId };