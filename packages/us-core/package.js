// packages/us-core/package.js

Package.describe({
  name: 'clinical:us-core',
  version: '7.0.1',
  summary: 'US Core 7.0.0 FHIR Profile definitions with profile decorators',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  api.use(['meteor', 'ecmascript']);

  // Server entry point - uses ES6 imports for proper module resolution
  api.mainModule('server/index.js', 'server');

  // Client entry point (minimal)
  api.mainModule('index.jsx', 'client');

  // Export ProfileSet for server-side discovery (CapabilityStatement)
  api.export('ProfileSet', 'server');

  // Export ProfileDecorators for package discovery pattern
  api.export('ProfileDecorators', 'server');
});
