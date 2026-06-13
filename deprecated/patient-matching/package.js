// packages/patient-matching/package.js

Package.describe({
  name: 'clinical:patient-matching',
  version: '0.1.0',
  summary: 'FHIR Identity Matching and Patient Matching Implementation for Honeycomb',
  git: 'https://github.com/clinical-meteor/patient-matching',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');

  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'react-meteor-data',
    'session',
    'mongo',
    'check',
    'tracker',
    'fetch',
    'mdg:validated-method',
    // 'clinical:extended-api@3.0.0', // Package doesn't exist
    // 'clinical:hl7-resource-datatypes' // Package doesn't exist
  ]);
  
  // Export main APIs
  api.export('PatientMatching');
  api.export('IdiPatientSchema');
  api.export('IdiMatchOperation');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
  
  // Server entry point
  api.mainModule('server/index.js', 'server');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('meteortesting:mocha');
  api.use('clinical:patient-matching');
  
  // Unit tests
  api.addFiles('tests/unit/matchingAlgorithm.tests.js');
  api.addFiles('tests/unit/identityValidation.tests.js');
  api.addFiles('tests/unit/schemas.tests.js');
  
  // Integration tests
  api.addFiles('tests/integration/idiMatchOperation.tests.js');
  api.addFiles('tests/integration/identityWorkflow.tests.js');
});