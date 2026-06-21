// packages/hipaa-compliance/package.js

Package.describe({
  name: 'clinical:hipaa-compliance',
  version: '0.1.0',
  summary: 'HIPAA-compliant audit logging and compliance management for Honeycomb v3',
  documentation: 'README.md'
});

Npm.depends({
  'marked': '4.3.0',
  'simpl-schema': '3.4.6'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');

  // Core Meteor dependencies
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'mongo',
    'session',
    'tracker',
    'reactive-var'
  ]);

  // React and UI dependencies
  api.use([
    'react-meteor-data',
    'static-html'
  ]);

  // Third party packages - using versions compatible with Meteor 3
  api.use([
    'matb33:collection-hooks@2.0.0',
    'momentjs:moment@2.8.4'
  ]);
  
  // Roles package for access control
  api.use('alanning:roles@4.0.0-alpha.2', {weak: true});

  // Server files
  api.addFiles([
    'server/startup.js',
    'server/methods.js',
    'server/publications.js',
    'server/hooks.js',
    'server/encryption.js',
    'server/policyMethods.js'
  ], 'server');

  // Shared files (lib)
  api.addFiles([
    'lib/Collections.js',
    'lib/Constants.js'
  ], ['client', 'server']);

  api.addFiles([
    // HipaaLogger is now accessed from the global window/Meteor object
    'lib/HipaaLoggerAccess.js',
    'lib/SecurityValidators.js',
    'lib/EncryptionManager.js',
    'lib/PolicyRoutes.js',
    'lib/PolicyGenerator.js'
  ], ['client', 'server']);

  // Client entry point
  api.mainModule('index.jsx', 'client');

  // Export for other packages
  // Note: HipaaLogger is now accessed from the global window/Meteor object
  api.export('HipaaAuditLog');
  api.export('HipaaConstants');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:hipaa-compliance');
  api.use('ecmascript');
  
  api.addFiles('tests/HipaaAuditLog.tests.js');
});