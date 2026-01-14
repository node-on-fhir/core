// packages/secure-messaging/package.js

Package.describe({
  name: 'clinical:secure-messaging',
  version: '0.1.0',
  summary: 'Secure Messaging and Direct Project support for ONC §170.315(e)(2) and §170.315(h)(1)',
  git: 'https://github.com/clinical-meteor/secure-messaging',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');
  
  // Core dependencies
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
  
  // Server methods
  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/direct-protocol.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:secure-messaging');
  api.addFiles('tests/secure-messaging-tests.js');
});