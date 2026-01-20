// packages/healthcare-surveys/package.js

Package.describe({
  name: 'clinical:healthcare-surveys',
  version: '1.0.0',
  summary: 'Healthcare surveys reporting for ONC §170.315(f)(7) compliance - NAMCS/NHCS',
  git: 'https://github.com/clinical-meteor/healthcare-surveys',
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
  api.use('clinical:structured-data-capture@0.1.0');
  
  // Server files
  api.addFiles('server/methods.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:healthcare-surveys');
  api.use('ecmascript');
  
  api.addFiles('tests/unit/schemas/HcsComposition.tests.js', 'server');
  api.addFiles('tests/integration/surveySubmission.tests.js', 'server');
});