// packages/admin-tools/package.js

Package.describe({
  name: 'clinical:admin-tools',
  version: '0.1.0',
  summary: 'Administrative tools for session management and database administration',
  git: 'https://github.com/symptomatic/admin-tools',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');

  // Required dependencies
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'react-meteor-data@3.0.1',
    'session',
    'mongo',
    'check',
    'random'
  ]);

  // Recommended dependencies
  api.use([
    'clinical:extended-api@3.0.0',
    'clinical:hl7-resource-datatypes@4.0.8'
  ], {weak: true});

  // Server files
  api.addFiles('server/index.js', 'server');
  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/deletePatientMethods.js', 'server');
  api.addFiles('server/archivePatientMethods.js', 'server');

  // Client entry point
  api.mainModule('index.jsx', 'client');

  // Exports
  api.export('AdminToolsCollections', 'client');
});
