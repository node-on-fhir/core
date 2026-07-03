// /packages/pacio-core/client/startup.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { get } from 'lodash';

// Import PACIO subscriptions
import '../lib/PacioSubscriptions';

// Initialize client-side collections
Meteor.startup(async function() {
  console.log('Initializing PACIO Core client...');
  
  // Wait for global Collections to be available
  let retries = 0;
  const maxRetries = 10;
  
  const initializeCollections = async function() {
    if (Meteor.Collections && Meteor.Collections.Patients) {
      window.Patients = Meteor.Collections.Patients;
      console.log('Patients collection initialized for PACIO Core'); // phi-audit: ok
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
    console.error('Failed to initialize Patients collection after', maxRetries, 'attempts'); // phi-audit: ok
  }
  
  // NOTE: Patient subscriptions are now handled by PacioSubscriptions.js
  // which properly manages subscription handles and cleanup.
  // Removed duplicate subscriptions from here to prevent subscription multiplication.

  // Boot-time vehicle hydration: if settings specify a crewedVehicleId and
  // no vehicle is already selected in Session, subscribe and hydrate.
  const crewedVehicleId = get(Meteor, 'settings.public.pacio.crewedVehicleId', '');
  if (crewedVehicleId && !Session.get('selectedCrewedVehicle')) {
    console.log('[PACIO] Boot-time vehicle hydration for:', crewedVehicleId);

    Tracker.autorun(function(computation) {
      const handle = Meteor.subscribe('autopublish.CrewedVehicles', { id: crewedVehicleId }, { limit: 1 });
      if (!handle.ready()) return;

      const CrewedVehicles = window.CrewedVehicles || get(Meteor, 'Collections.CrewedVehicles');
      if (!CrewedVehicles) {
        console.warn('[PACIO] CrewedVehicles collection not available for hydration');
        computation.stop();
        return;
      }

      const vehicle = CrewedVehicles.findOne({ id: crewedVehicleId });
      if (vehicle) {
        console.log('[PACIO] Hydrated dashboard vehicle:', get(vehicle, 'deviceName.0.name', crewedVehicleId));
        Session.set('selectedCrewedVehicle', vehicle);
        Session.set('selectedCrewedVehicleId', vehicle._id);
        Session.set('selectedCrewedVehicleFhirId', vehicle.id);
      } else {
        console.log('[PACIO] Vehicle not found for hydration:', crewedVehicleId);
      }

      computation.stop();
    });
  }

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