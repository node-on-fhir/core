// /packages/pacio-core/client/startup.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

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
  
  // Subscribe to patients if we have a selected patient
  Tracker.autorun(function() {
    const selectedPatientId = Session.get('selectedPatientId');
    if (selectedPatientId) {
      console.log('Subscribing to patient data:', selectedPatientId);
      const handle = Meteor.subscribe('pacio.patients', selectedPatientId);
      
      // Log subscription status
      Tracker.autorun(function() {
        if (handle.ready()) {
          console.log('Patient subscription ready for:', selectedPatientId);
          if (window.Patients) {
            const count = window.Patients.find().count();
            console.log('Patients in local collection:', count);
          }
        }
      });
    }
  });
  
  // Also subscribe to all patients for the patient directory/search
  // This can be controlled by a setting if needed
  const enablePatientDirectory = Meteor.settings?.public?.pacio?.enablePatientDirectory ?? true;
  if (enablePatientDirectory) {
    console.log('Subscribing to patient directory...');
    const directoryHandle = Meteor.subscribe('pacio.patients');
    
    // Log directory subscription status
    Tracker.autorun(function() {
      if (directoryHandle.ready()) {
        console.log('Patient directory subscription ready');
        if (window.Patients) {
          const count = window.Patients.find().count();
          console.log('Total patients in directory:', count);
        }
      }
    });
  }
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