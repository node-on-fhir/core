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
import { initializeSampleBeds, assignSamplePatientsToBeds } from './sampleData/initializeBeds';

Meteor.startup(async function() {
  // Initialize sample beds if needed
  await initializeSampleBeds();
  
  // Try to assign patients to beds if available
  await assignSamplePatientsToBeds();
  
  // Make Beds collection available globally on server
  if (!global.Collections) {
    global.Collections = {};
  }
  global.Collections.Beds = Beds;
});

console.log('PACIO Core package server initialized');