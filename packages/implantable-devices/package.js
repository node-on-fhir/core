// packages/implantable-devices/package.js

Package.describe({
  name: 'clinical:implantable-devices',
  version: '0.1.0',
  summary: 'Implantable Device Registry for ONC §170.315(g)(7) certification',
  git: 'https://github.com/clinical-meteor/implantable-devices',
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
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:implantable-devices');
  api.addFiles('tests/implantable-devices-tests.js');
});