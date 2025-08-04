// /packages/synthea/package.js
Package.describe({
    name: 'clinical:synthea',
    version: '0.1.0',
    summary: 'Synthea Configuration Interface for Honeycomb',
    git: 'https://github.com/clinical-meteor/synthea',
    documentation: 'README.md'
});
  
Package.onUse(function(api) {
    api.versionsFrom('3.0');
    
    api.use('meteor');
    api.use('webapp');
    api.use('ecmascript');
    api.use('react-meteor-data');
    api.use('session');
    api.use('mongo');    
    api.use('http');    
    
    api.mainModule('index.jsx', 'client');
});