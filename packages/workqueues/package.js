// /packages/workqueues/package.js

Package.describe({
  name: 'clinical:workqueues',
  version: '0.1.0',
  summary: 'Clinical workqueues and task management system for healthcare environments',
  git: 'https://github.com/clinical-meteor/clinical-workqueues',
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

  // Just use whatever collection hooks is available
  api.use('matb33:collection-hooks', {weak: true});

  api.mainModule('client/index.js', 'client');
  api.mainModule('server/index.js', 'server');

  api.export('WorkQueues');
  api.export('WorkQueueItems');
  api.export('SidebarWorkflows', 'client');
  api.export('WorkQueuesMenuItem', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:workqueues');
  api.mainModule('tests/WorkQueues.tests.js');
});