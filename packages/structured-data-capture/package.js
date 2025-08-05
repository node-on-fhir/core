// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/package.js

Package.describe({
  name: 'clinical:structured-data-capture',
  version: '0.1.0',
  summary: 'FHIR Structured Data Capture implementation for Questionnaire and QuestionnaireResponse resources',
  git: 'https://github.com/clinical-meteor/structured-data-capture',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  
  api.use('meteor');
  api.use('webapp');
  api.use('ecmascript');
  api.use('react-meteor-data');
  api.use('session');
  api.use('random');
  api.use('mongo');
  api.use('check');
  
  api.use('clinical:hl7-resource-datatypes');
  api.use('matb33:collection-hooks');
  
  api.mainModule('index.jsx', 'client');
  api.mainModule('server/methods.js', 'server');
  
  api.addFiles('lib/QuestionnaireUtils.js', ['client', 'server']);
  api.addFiles('lib/ResponseUtils.js', ['client', 'server']);
  api.addFiles('lib/ValidationUtils.js', ['client', 'server']);
  
  api.export('QuestionnaireUtils');
  api.export('ResponseUtils');
  api.export('ValidationUtils');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('clinical:structured-data-capture');
  api.mainModule('tests/structured-data-capture-tests.js');
});