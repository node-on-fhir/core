// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/clinical-lists/package.js

Package.describe({
  name: 'clinical:clinical-lists',
  version: '0.1.0',
  summary: 'ONC 170.315(a)(6-8) Clinical Lists - Problem, Medication Allergy, and Medication Lists',
  git: 'https://github.com/clinical-meteor/clinical-lists',
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

  api.mainModule('index.jsx', 'client');
  
  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/publications.js', 'server');
});

Package.onTest(function(api) {
  api.use([
    'ecmascript',
    'tinytest',
    'clinical:clinical-lists'
  ]);
});