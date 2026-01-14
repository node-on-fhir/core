// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/syndromic-surveillance/package.js

Package.describe({
  name: 'clinical:syndromic-surveillance',
  version: '1.0.0',
  summary: 'Syndromic surveillance and public health reporting for ONC 170.315(f)(2) compliance',
  git: 'https://github.com/clinical-meteor/syndromic-surveillance',
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
  
  // Server files
  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/publications.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
});