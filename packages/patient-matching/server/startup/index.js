// packages/patient-matching/server/startup/index.js
import { Meteor } from 'meteor/meteor';
import { get, has } from 'lodash';

// Import configurations
import './registerOperations';

// Server startup configuration
Meteor.startup(async function() {
  console.log('PatientMatching: Initializing server components...');
  
  // Configure match service endpoint
  const matchServiceUrl = get(Meteor, 'settings.private.patientMatching.matchServiceUrl');
  if (!matchServiceUrl) {
    console.warn('PatientMatching: No match service URL configured in settings.private.patientMatching.matchServiceUrl');
  }
  
  // Configure authentication
  const apiKey = get(Meteor, 'settings.private.patientMatching.apiKey');
  if (!apiKey) {
    console.warn('PatientMatching: No API key configured in settings.private.patientMatching.apiKey');
  }
  
  // Configure match thresholds
  const thresholds = get(Meteor, 'settings.private.patientMatching.thresholds', {
    certain: 0.95,
    probable: 0.80,
    possible: 0.60
  });
  
  // Store configuration in server runtime
  global.PatientMatchingConfig = {
    matchServiceUrl,
    apiKey,
    thresholds,
    weights: get(Meteor, 'settings.private.patientMatching.weights', {
      identifier: 0.35,
      name: 0.25,
      birthDate: 0.20,
      gender: 0.05,
      address: 0.10,
      telecom: 0.05
    }),
    maxResults: get(Meteor, 'settings.private.patientMatching.maxResults', 10),
    timeout: get(Meteor, 'settings.private.patientMatching.timeout', 30000),
    enableAuditLog: get(Meteor, 'settings.private.patientMatching.enableAuditLog', true),
    enableCache: get(Meteor, 'settings.private.patientMatching.enableCache', true),
    cacheTimeout: get(Meteor, 'settings.private.patientMatching.cacheTimeout', 300000) // 5 minutes
  };
  
  // Initialize match cache if enabled
  if (global.PatientMatchingConfig.enableCache) {
    global.PatientMatchingCache = new Map();
    
    // Clean up expired cache entries periodically
    Meteor.setInterval(function() {
      const now = Date.now();
      for (const [key, entry] of global.PatientMatchingCache.entries()) {
        if (now - entry.timestamp > global.PatientMatchingConfig.cacheTimeout) {
          global.PatientMatchingCache.delete(key);
        }
      }
    }, 60000); // Check every minute
  }
  
  // Log configuration summary
  console.log('PatientMatching: Configuration loaded');
  console.log(`  - Match Service: ${matchServiceUrl ? 'Configured' : 'Not configured'}`);
  console.log(`  - API Key: ${apiKey ? 'Present' : 'Missing'}`);
  console.log(`  - Audit Logging: ${global.PatientMatchingConfig.enableAuditLog ? 'Enabled' : 'Disabled'}`);
  console.log(`  - Caching: ${global.PatientMatchingConfig.enableCache ? 'Enabled' : 'Disabled'}`);
  console.log(`  - Match Thresholds: Certain=${thresholds.certain}, Probable=${thresholds.probable}, Possible=${thresholds.possible}`);
  
  // Environment variable override
  if (process.env.PATIENT_MATCHING_SERVICE_URL) {
    global.PatientMatchingConfig.matchServiceUrl = process.env.PATIENT_MATCHING_SERVICE_URL;
    console.log('PatientMatching: Using environment variable for match service URL');
  }
  
  if (process.env.PATIENT_MATCHING_API_KEY) {
    global.PatientMatchingConfig.apiKey = process.env.PATIENT_MATCHING_API_KEY;
    console.log('PatientMatching: Using environment variable for API key');
  }
  
  console.log('PatientMatching: Server initialization complete');
});