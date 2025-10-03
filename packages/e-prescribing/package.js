// packages/e-prescribing/package.js

Package.describe({
  name: 'clinical:e-prescribing',
  version: '0.1.0',
  summary: 'Electronic Prescribing for ONC §170.315(b)(3) certification',
  git: 'https://github.com/clinical-meteor/e-prescribing',
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
  api.addFiles('server/ncpdp-script.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:e-prescribing');
  api.addFiles('tests/e-prescribing-tests.js');
});