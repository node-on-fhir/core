// /packages/pacio-core/package.js

Package.describe({
  name: 'clinical:pacio-core',
  version: '0.1.0',
  summary: 'PACIO-compliant EHR functionality for Honeycomb FHIR platform',
  git: 'https://github.com/clinical-meteor/pacio-core',
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
    'clinical:extended-api@3.0.0'
  ]);
  
  // Client files
  api.mainModule('index.jsx', 'client');
  
  // Server files
  api.mainModule('server/index.js', 'server');
  
  // Export collections and utilities
  api.export([
    'AdvanceDirectiveUtils',
    'PdfUtils'
  ], ['client', 'server']);
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('clinical:pacio-core');
  
  api.mainModule('tests/pacio-core-tests.js');
});

