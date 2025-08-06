Package.describe({
  name: 'clinical:data-importer',
  version: '0.17.0',
  summary: 'Data Importer',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');

  api.use('meteor');
  api.use('webapp');
  api.use('ecmascript');
  api.use('session');
  api.use('mongo');     
  api.use('ejson');
  api.use('random');

  api.use('react-meteor-data@3.0.1');
  api.use('http@1.0.1');    

  api.addFiles('server/methods.xlsx.js', ['server']);
  api.addFiles('server/methods.proxy.js', ['server']);

  api.mainModule('index.jsx', 'client');
});


// Npm.depends({
//   "xml2js": "0.4.23",
//   "xlsx": "0.16.0",
//   "papaparse": "5.2.0",
//   "file-dialog": "0.0.8",
//   "promise": "8.3.0"
// });


