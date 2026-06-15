// packages/request-for-corrections/package.js

Package.describe({
  name: 'clinical:request-for-corrections',
  version: '0.1.0',
  summary: 'FHIR Patient Correction Request Implementation',
  documentation: 'README.md',
  git: 'https://github.com/clinical-meteor/request-for-corrections'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'mongo',
    'check',
    'session',
    'react-meteor-data',
    'random'
    // 'clinical:extended-api@2.5.0', // Package doesn't exist
    // 'clinical:hl7-fhir-resources@4.0.0', // Package doesn't exist
    // 'clinical:hl7-resource-datatypes@4.0.0', // Package doesn't exist
    // 'aldeed:collection2', // Version conflict, not needed since we're not using schemas
    // 'matb33:collection-hooks' // Not needed
  ]);

  // Add shared files
  api.addFiles([
    'lib/constants/businessStatuses.js',
    'lib/constants/workflowStates.js',
    'lib/collections/CorrectionRequests.js',
    'lib/collections/CorrectionTasks.js', 
    'lib/collections/CorrectionCommunications.js',
    'lib/CorrectionWorkflow.js'
  ], ['client', 'server']);

  // Client entry point
  api.mainModule('index.jsx', 'client');
  
  // Server entry point  
  api.mainModule('server/index.js', 'server');
  
  // Export client-side routes and workflows
  api.export('DynamicRoutes', 'client');
  api.export('SidebarWorkflows', 'client');
  
  // Export collections and utilities
  api.export('CorrectionRequests');
  api.export('CorrectionCommunications');
  api.export('CorrectionTasks');
  api.export('CorrectionWorkflow');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:request-for-corrections');
  api.addFiles('tests/correctionRequests.tests.js');
});