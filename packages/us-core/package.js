// packages/us-core/package.js

Package.describe({
  name: 'clinical:us-core',
  version: '7.0.0',
  summary: 'US Core 7.0.0 FHIR Profile definitions for CapabilityStatement',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  api.use(['meteor', 'ecmascript']);

  // Server-side profile definitions
  api.addFiles('server/ProfileSet.js', 'server');

  // Client entry point (minimal)
  api.mainModule('index.jsx', 'client');

  // Export ProfileSet for server-side discovery
  api.export('ProfileSet', 'server');
});
