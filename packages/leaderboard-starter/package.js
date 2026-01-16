Package.describe({
    name: 'mitre:leaderboard-starter',
    version: '0.7.0',
    summary: 'Leaderboard Starter',
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
    

    api.addFiles('lib/Helpers.js', 'client');

    api.addFiles('lib/collections.js');

    api.addFiles('server/methods.js', 'server');
    
    api.mainModule('index.jsx', 'client');
});

