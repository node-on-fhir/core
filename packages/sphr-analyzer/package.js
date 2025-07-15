Package.describe({
    name: 'mitre:sphr-analyzer',
    version: '0.5.1',
    summary: 'Example Node on FHIR plugin, with dynamic routes and UI elements.',
    documentation: 'README.md'
});
  
Package.onUse(function(api) {
    api.versionsFrom('3.0.1');
    
    api.use('meteor@2.0.1');
    api.use('webapp@2.0.0');
    api.use('ecmascript@0.16.9');
    api.use('react-meteor-data@3.0.1');

    api.use('session');
    api.use('mongo');    
    api.use('http');    
     
    api.mainModule('index.jsx', 'client');
});

