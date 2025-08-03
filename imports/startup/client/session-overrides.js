// /imports/startup/client/session-overrides.js
// Override Session.set to handle ObjectID serialization

import { Session } from 'meteor/session';

// Store the original Session.set
const originalSet = Session.set.bind(Session);

// Override Session.set to handle ObjectIDs
Session.set = function(key, value) {
  // Handle selectedPatientId specifically
  if (key === 'selectedPatientId' && value && typeof value === 'object' && value._str) {
    console.log('Session.set: Converting ObjectID to string for selectedPatientId');
    return originalSet(key, value._str);
  }
  
  // For other keys, use original behavior
  return originalSet(key, value);
};

console.log('Session.set override installed for ObjectID handling');