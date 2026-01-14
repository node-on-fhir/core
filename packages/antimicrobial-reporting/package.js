// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/antimicrobial-reporting/package.js

Package.describe({
  name: 'clinical:antimicrobial-reporting',
  version: '1.0.0',
  summary: 'Antimicrobial use and resistance surveillance reporting for public health agencies and CDC NHSN',
  git: 'https://github.com/clinical-meteor/antimicrobial-reporting',
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
  api.use('clinical:antimicrobial-reporting');
  api.use('ecmascript');
  
  api.addFiles('tests/unit/antimicrobialReporting.tests.js', 'server');
  api.addFiles('tests/integration/surveillanceTransmission.tests.js', 'server');
});