// packages/drug-interactions/package.js

Package.describe({
  name: 'clinical:drug-interactions',
  version: '0.1.0',
  summary: 'Drug-Drug and Drug-Allergy Interaction Checking for ONC §170.315(a)(4) certification',
  git: 'https://github.com/clinical-meteor/drug-interactions',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');
  
  // Core dependencies
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'react-meteor-data',
    'session',
    'mongo',
    'check',
    'clinical:extended-api@3.0.0',
    'clinical:hl7-resource-datatypes'
  ]);
  
  // Server methods
  api.addFiles('server/methods.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:drug-interactions');
  api.addFiles('tests/drug-interactions-tests.js');
});