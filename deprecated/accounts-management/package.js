// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/accounts/package.js

Package.describe({
  name: 'clinical:accounts-management',
  version: '1.0.0',
  summary: 'Authentication, access control, and authorization management for ONC §170.315(d)(1) compliance',
  git: 'https://github.com/clinical-meteor/accounts',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');
  
  // Core Meteor dependencies
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'react-meteor-data',
    'session',
    'mongo',
    'check',
    'accounts-base',
    'accounts-password',
    'clinical:extended-api@3.0.0',
    'clinical:hl7-resource-datatypes'
  ]);
  
  // Server files
  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/publications.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:accounts');
  api.use('ecmascript');
  
  api.addFiles('tests/unit/userManagement.tests.js', 'server');
  api.addFiles('tests/integration/accessControl.tests.js', 'server');
});