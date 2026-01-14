// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/immunization-registry/package.js

Package.describe({
  name: 'clinical:immunization-registry',
  version: '1.0.0',
  summary: 'Immunization registry reporting for ONC §170.315(f)(1) compliance - transmission to immunization registries',
  git: 'https://github.com/clinical-meteor/immunization-registry',
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
    'clinical:extended-api@3.0.0',
    'clinical:hl7-resource-datatypes'
  ]);
  
  // Server files
  api.addFiles('server/methods.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:immunization-registry');
  api.use('ecmascript');
  
  api.addFiles('tests/unit/immunizationReporting.tests.js', 'server');
  api.addFiles('tests/integration/registryTransmission.tests.js', 'server');
});