// /packages/pacio-core/client/startup.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

// Import PACIO subscriptions
import '../lib/PacioSubscriptions';

// Initialize client-side collections
Meteor.startup(async function() {
  console.log('Initializing PACIO Core client...');
  
  // Wait for global Collections to be available
  let retries = 0;
  const maxRetries = 10;
  
  const initializeCollections = async function() {
    if (global.Collections && global.Collections.Patients) {
      window.Patients = await global.Collections.Patients;
      console.log('Patients collection initialized for PACIO Core');
      return true;
    }
    return false;
  };
  
  // Try to initialize with retries
  while (retries < maxRetries) {
    if (await initializeCollections()) {
      break;
    }
    retries++;
    console.log(`Waiting for Collections to be available... (attempt ${retries}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (!window.Patients) {
    console.error('Failed to initialize Patients collection after', maxRetries, 'attempts');
  }
  
  // NOTE: Patient subscriptions are now handled by PacioSubscriptions.js
  // which properly manages subscription handles and cleanup.
  // Removed duplicate subscriptions from here to prevent subscription multiplication.

  console.log('PACIO Core client initialization complete');
});

// Export a helper to subscribe to patient data
export const subscribeToPacioPatient = function(patientId) {
  if (!patientId) return;
  
  return Meteor.subscribe('pacio.patients', patientId);
};

// Export a helper to search patients
export const searchPacioPatients = function(searchText) {
  if (!searchText || searchText.length < 2) {
    // Don't search with less than 2 characters
    return Meteor.subscribe('pacio.patients');
  }
  
  return Meteor.subscribe('pacio.patients', null, searchText);
};