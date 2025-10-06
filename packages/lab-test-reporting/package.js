// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/lab-test-reporting/package.js

Package.describe({
  name: 'clinical:lab-test-reporting',
  version: '1.0.0',
  summary: 'Laboratory test reporting to public health agencies for ONC §170.315(f)(3) compliance - reportable lab tests and values/results',
  git: 'https://github.com/clinical-meteor/lab-test-reporting',
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
  api.use('clinical:lab-test-reporting');
  api.use('ecmascript');
  
  api.addFiles('tests/unit/labReporting.tests.js', 'server');
  api.addFiles('tests/integration/publicHealthTransmission.tests.js', 'server');
});