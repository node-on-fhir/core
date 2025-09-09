// packages/international-patient-summary/package.js

Package.describe({
  name: 'clinical:international-patient-summary',
  version: '0.1.0',
  summary: 'International Patient Summary (IPS) viewer and generator for Honeycomb',
  git: 'https://github.com/clinical-meteor/international-patient-summary',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  
  // Core Meteor packages
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'session',
    'mongo',
    'reactive-var'
  ]);
  
  // React dependencies
  api.use('react-meteor-data@3.0.1');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
  
  // Server files
  api.addFiles('server/methods.js', 'server');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('clinical:international-patient-summary');
});