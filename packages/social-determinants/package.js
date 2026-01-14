// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/social-determinants/package.js

Package.describe({
  name: 'clinical:social-determinants',
  version: '1.0.0',
  summary: 'SDOH screening and assessment for ONC §170.315(a)(15) compliance',
  git: 'https://github.com/clinical-meteor/hl7-fhir-data-infrastructure',
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

  // Server files
  api.addFiles('server/methods.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});