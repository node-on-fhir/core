// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/consent-generator/package.js

Package.describe({
  name: 'clinical:consent-generator',
  version: '0.1.0',
  summary: 'Consent and Access Control List generator utility for development',
  git: 'https://github.com/clinical-meteor/consent-generator',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'mongo',
    'check',
    'random',
    'react-meteor-data@2.6.3',
    'session',
    'aldeed:collection2@2.5.0'
  ]);
  
  // We need access to the Consents collection
  api.use([
    'clinical:hl7-fhir-resources',
    'clinical:hl7-resource-datatypes'
  ], {weak: true});
  
  // Server-side files
  api.addFiles([
    'server/methods.js',
    'server/routes.js'
  ], 'server');
  
  // Client-side files
  api.addFiles([
    'client/ConsentGeneratorPage.jsx'
  ], 'client');
  
  // Shared files
  api.addFiles([
    'lib/ConsentTemplates.js'
  ], ['client', 'server']);
  
  // Main module
  api.mainModule('index.jsx', 'client');
  
  // Export components
  api.export('ConsentGeneratorPage', 'client');
  api.export('ConsentTemplates', ['client', 'server']);
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('clinical:consent-generator');
  
  api.mainModule('tests/consent-generator-tests.js');
});