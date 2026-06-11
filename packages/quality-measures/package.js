// packages/quality-measures/package.js

Package.describe({
  name: 'clinical:quality-measures',
  version: '0.1.0',
  summary: 'Clinical Quality Measures for ONC §170.315(c)(1-4) certification',
  git: 'https://github.com/clinical-meteor/quality-measures',
  documentation: 'README.md'
});

// CQL execution (fqm-execution) is an app-level npm dependency declared in
// the root package.json — loaded lazily, server-only, in server/fqm-engine.js.

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

  // Shared libs (measure definitions + section constants used on both sides)
  api.addFiles('lib/pacio-measures.js', ['client', 'server']);
  api.addFiles('lib/toc-sections.js', ['client', 'server']);
  api.addFiles('lib/collections.js', ['client', 'server']);

  // Server files
  api.addFiles('server/evaluators/pacio-data-connector.js', 'server');
  api.addFiles('server/evaluators/icare-evaluator.js', 'server');
  api.addFiles('server/evaluators/adi-acp-evaluator.js', 'server');
  api.addFiles('server/measure-calculator.js', 'server');
  api.addFiles('server/fqm-engine.js', 'server');
  api.addFiles('server/measure-bundle-methods.js', 'server');
  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/startup.js', 'server');

  // Client entry point
  api.mainModule('index.jsx', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:quality-measures');
  api.addFiles('tests/quality-measures-tests.js');
});