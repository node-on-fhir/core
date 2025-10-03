// packages/reference-app/package.js

Package.describe({
  name: 'clinical:reference-app',
  version: '0.1.0',
  summary: 'Gold standard reference template for Honeycomb packages - ONC HealthIT Certification',
  git: 'https://github.com/clinical-meteor/reference-app',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');
  
  // Core Meteor dependencies - REQUIRED
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'react-meteor-data@3.0.1',
    'session',
    'mongo',
    'check',
    'random'
  ]);
  
  // Clinical/FHIR dependencies - RECOMMENDED
  api.use([
    'clinical:extended-api@3.0.0',
    'clinical:hl7-resource-datatypes@4.0.8'
  ]);
  
  // Optional dependencies with weak flag
  api.use('matb33:collection-hooks', {weak: true});
  
  // Server files
  api.addFiles('server/index.js', 'server');
  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/publications.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
  
  // Export collections and utilities
  api.export('ReferenceAppCollections');
  api.export('ReferenceAppUtilities', 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('clinical:reference-app');
  api.mainModule('tests/reference-app-tests.js');
});