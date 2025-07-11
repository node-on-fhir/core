Package.describe({
    name: 'mitre:patient-chart-starter',
    version: '0.7.0',
    summary: 'Patient Chart Starter',
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


