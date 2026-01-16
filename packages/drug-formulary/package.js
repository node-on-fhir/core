// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/drug-formulary/package.js

Package.describe({
  name: 'clinical:drug-formulary',
  version: '0.1.0',
  summary: 'ONC 170.315(a)(10) Drug-formulary and preferred drug list checks',
  git: 'https://github.com/clinical-meteor/drug-formulary',
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