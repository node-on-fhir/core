Package.describe({
  name: 'clinical:multi-factor-auth',
  version: '0.1.0',
  summary: 'Multi-Factor Authentication for ONC 170.315(d)(13) compliance',
  git: 'https://github.com/clinical-meteor/multi-factor-auth',
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
    'clinical:extended-api',
    'clinical:hl7-resource-datatypes'
  ]);
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
  
  // Server entry point
  api.mainModule('server/index.js', 'server');
  
  // Export APIs
  api.export([
    'DynamicRoutes',
    'SidebarWorkflows',
    'FooterButtons'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('clinical:multi-factor-auth');
  api.mainModule('tests/multi-factor-auth.bdd.js');
});