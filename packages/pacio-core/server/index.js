// /packages/pacio-core/server/index.js

// Import server methods
import './methods/syncPatientRecord';
import './methods/revokeAdvanceDirective';
import './methods/generateWatermarkedPdf';
import './methods/fetchPatientEverything';
import './methods/bedManagement';

// Import publications
import './publications/pacioPublications';

// Import PACIO subscriptions for PHI resources
import '../lib/PacioSubscriptions';

// Export server utilities if needed
export * from '../lib/utilities/AdvanceDirectiveUtils';
export * from '../lib/utilities/PdfUtils';
export * from '../lib/collections/PacioCollections';
export * from '../lib/collections/BedsCollection';

// Initialize sample beds on startup
import { Beds } from '../lib/collections/BedsCollection';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { initializeSampleBeds, assignSamplePatientsToBeds } from './sampleData/initializeBeds';

Meteor.startup(async function() {
  // Skip bed initialization in CI environments to reduce memory pressure
  // Can also be disabled via settings.private.pacio.skipBedInitialization
  const skipBedInit = process.env.CI ||
    get(Meteor, 'settings.private.pacio.skipBedInitialization', false);

  if (!skipBedInit) {
    // Initialize sample beds if needed
    await initializeSampleBeds();

    // Try to assign patients to beds if available
    await assignSamplePatientsToBeds();
  } else {
    console.log('PACIO bed initialization skipped (CI environment or disabled in settings)');
  }

  // Make Beds collection available globally on server (always needed for tests/code)
  if (!global.Collections) {
    global.Collections = {};
  }
  global.Collections.Beds = Beds;
});

// ProfileSet for CapabilityStatement discovery
// Metadata.js will automatically discover this and add profiles to CapabilityStatement
// This enables PACIO Inferno test kit validation by declaring supported profiles
export const ProfileSet = {
  name: 'PACIO Core Profiles',
  profiles: {
    'Composition': [
      'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-Composition'
    ]
  }
};

console.log('PACIO Core package server initialized');