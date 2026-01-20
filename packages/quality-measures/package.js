// packages/quality-measures/package.js

Package.describe({
  name: 'clinical:quality-measures',
  version: '0.1.0',
  summary: 'Clinical Quality Measures for ONC §170.315(c)(1-4) certification',
  git: 'https://github.com/clinical-meteor/quality-measures',
  documentation: 'README.md'
});

// NPM dependencies for CQL execution and quality measure calculation
Npm.depends({
  'cql-execution': '3.3.0'  // Latest version without conflicting dependencies
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
  api.addFiles('server/measure-calculator.js', 'server');
  api.addFiles('lib/cql-engine.js', ['client', 'server']);
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:quality-measures');
  api.addFiles('tests/quality-measures-tests.js');
});