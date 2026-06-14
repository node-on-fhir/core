// packages/reference-app/server/index.js

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';

// Import server methods
import './methods.js';
import './publications.js';

// =============================================================================
// SERVER STARTUP
// =============================================================================

Meteor.startup(async function() {
  console.log('===========================================');
  console.log('ReferenceApp: Server Startup');
  console.log('===========================================');
  
  // Check if package is enabled
  const packageEnabled = get(Meteor, 'settings.public.modules.referenceApp.enabled', true);
  if (!packageEnabled) {
    console.log('ReferenceApp: Package disabled in settings');
    return;
  }
  
  // ---------------------------------------------------------------------------
  // Environment Variables Integration
  // ---------------------------------------------------------------------------
  
  // Map environment variables to Meteor.settings
  if (process.env.REFERENCE_APP_API_KEY) {
    set(Meteor, 'settings.private.referenceApp.apiKey', process.env.REFERENCE_APP_API_KEY);
    console.log('ReferenceApp: API key configured from environment');
  }
  
  if (process.env.REFERENCE_APP_ENDPOINT) {
    set(Meteor, 'settings.private.referenceApp.endpoint', process.env.REFERENCE_APP_ENDPOINT);
    console.log('ReferenceApp: Endpoint configured from environment');
  }
  
  // ---------------------------------------------------------------------------
  // Initialize Collections
  // ---------------------------------------------------------------------------
  
  try {
    // Check if global.Collections exists
    if (typeof global.Collections !== 'undefined') {
      // Access collections using Meteor v3 async API
      const Patients = global.Collections?.Patients;
      const Observations = global.Collections?.Observations;
      
      if (Patients && typeof Patients.countAsync === 'function') {
        const patientCount = await Patients.countAsync();
        console.log(`ReferenceApp: Found ${patientCount} patients in database`);
      } else {
        console.log('ReferenceApp: Patients collection not available or not async-ready');
      }
      
      if (Observations && typeof Observations.countAsync === 'function') {
        const observationCount = await Observations.countAsync();
        console.log(`ReferenceApp: Found ${observationCount} observations in database`);
      } else {
        console.log('ReferenceApp: Observations collection not available or not async-ready');
      }
    } else {
      console.log('ReferenceApp: Global collections not initialized yet');
    }
    
  } catch (error) {
    console.error('ReferenceApp: Error accessing collections:', error);
  }
  
  // ---------------------------------------------------------------------------
  // Initialize Sample Data (if needed)
  // ---------------------------------------------------------------------------
  
  const initializeSampleData = get(Meteor, 'settings.private.referenceApp.initializeSampleData', false);
  if (initializeSampleData) {
    console.log('ReferenceApp: Initializing sample data...');
    
    try {
      // (Placeholder) sample-data seeding. The Atmosphere code dynamically
      // imported '../data/sample-data.json' — a file that never existed in the
      // package and whose result was never used. Rspack resolves dynamic-import
      // targets at build time, so that dead import is removed here. Add real
      // seeding logic + a data file if/when needed.
      console.log('ReferenceApp: sample-data seeding is a no-op placeholder');
    } catch (error) {
      console.warn('ReferenceApp: Could not load sample data:', error.message);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Register Hooks (if collection-hooks package is available)
  // ---------------------------------------------------------------------------
  
  if (Package['matb33:collection-hooks']) {
    console.log('ReferenceApp: Registering collection hooks');
    
    // Example: Add audit trail for data modifications
    /*
    Observations.after.insert(function(userId, doc) {
      console.log('ReferenceApp: Observation inserted:', doc.id);
    });
    
    Observations.after.update(function(userId, doc, fieldNames, modifier, options) {
      console.log('ReferenceApp: Observation updated:', doc.id);
    });
    */
  }
  
  // ---------------------------------------------------------------------------
  // Initialize External Services
  // ---------------------------------------------------------------------------
  
  const externalApiKey = get(Meteor, 'settings.private.referenceApp.apiKey');
  if (externalApiKey) {
    console.log('ReferenceApp: External API configured');
    // Initialize external service connections
  }
  
  // ---------------------------------------------------------------------------
  // Schedule Cron Jobs (if enabled)
  // ---------------------------------------------------------------------------
  
  const enableCronJobs = get(Meteor, 'settings.private.referenceApp.enableCronJobs', false);
  if (enableCronJobs && Package['littledata:synced-cron']) {
    const SyncedCron = Package['littledata:synced-cron'].SyncedCron;
    
    SyncedCron.add({
      name: 'ReferenceApp Daily Sync',
      schedule: function(parser) {
        return parser.text('every 24 hours');
      },
      job: async function() {
        console.log('ReferenceApp: Running daily sync job');
        // Add sync logic here
      }
    });
    
    console.log('ReferenceApp: Cron jobs registered');
  }
  
  console.log('ReferenceApp: Server startup complete');
});