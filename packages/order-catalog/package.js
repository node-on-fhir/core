// packages/order-catalog/package.js

Package.describe({
  name: 'clinical:order-catalog',
  version: '0.1.0',
  summary: 'FHIR Order Catalog - CPOE for medications and laboratory orders (ONC Certified)',
  git: 'https://github.com/clinical-meteor/order-catalog',
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
  
  // Server files
  api.addFiles('server/index.js', 'server');
  api.addFiles('server/methods.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});