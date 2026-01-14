// packages/cancer-registry-reporting/package.js

Package.describe({
  name: 'clinical:cancer-registry-reporting',
  version: '1.0.0',
  summary: 'Cancer registry reporting for ONC §170.315(f)(4) compliance - automated cancer case transmission',
  git: 'https://github.com/clinical-meteor/cancer-registry-reporting',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');
  
  api.use('meteor@2.0.1');
  api.use('webapp@2.0.3');
  api.use('ecmascript');
  api.use('react-meteor-data');
  api.use('session');
  api.use('mongo@2.0.2');
  api.use('check');
  
  api.use('clinical:extended-api@3.0.0');
  api.use('clinical:hl7-resource-datatypes');
  
  // Server files
  api.addFiles('server/methods.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:cancer-registry-reporting');
  api.use('ecmascript');
  
  api.addFiles('tests/unit/cancerReporting.tests.js', 'server');
  api.addFiles('tests/integration/registrySubmission.tests.js', 'server');
});