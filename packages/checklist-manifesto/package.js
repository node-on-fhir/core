// /packages/checklist-manifesto/package.js

Package.describe({
  name: 'clinical:checklist-manifesto',
  version: '0.1.0',
  summary: 'FHIR-compliant checklist and protocol management system for healthcare workflows',
  git: 'https://github.com/clinical-meteor/checklist-manifesto',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  
  api.use([
    'ecmascript',
    'meteor',
    'webapp',
    'tracker',
    'reactive-var',
    'session',
    'mongo',
    'ddp',
    'livedata',
    'ejson',
    'random',
    'check',
    'accounts-base'
  ]);

  // Use collection hooks if available
  api.use('matb33:collection-hooks', {weak: true});

  api.mainModule('client/index.js', 'client');
  api.mainModule('server/index.js', 'server');

  api.export('ChecklistTasks');
  api.export('ChecklistLists');
  api.export('SidebarWorkflows', 'client');
  api.export('ChecklistManifestoPage', 'client');
  api.export('DynamicRoutes', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:checklist-manifesto');
  api.addFiles('tests/checklist-manifesto.tests.js');
});