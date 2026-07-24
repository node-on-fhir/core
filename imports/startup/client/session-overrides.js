// /imports/startup/client/session-overrides.js
// Override Session.set to handle ObjectID serialization

import { Session } from 'meteor/session';

const log = (typeof Meteor !== 'undefined' && Meteor.Logger) ? Meteor.Logger.for('SessionOverrides') : console;

// Store the original Session.set
const originalSet = Session.set.bind(Session);

// Override Session.set to handle ObjectIDs
Session.set = function(key, value) {
  // Handle selectedPatientId specifically
  if (key === 'selectedPatientId' && value && typeof value === 'object' && value._str) {
    log.debug('Session.set: Converting ObjectID to string for selectedPatientId'); // phi-audit: ok
    return originalSet(key, value._str);
  }
  
  // For other keys, use original behavior
  return originalSet(key, value);
};

log.info('Session.set override installed for ObjectID handling');