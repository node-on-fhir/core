// packages/dicom-viewer/package.js

Package.describe({
  name: 'clinical:dicom-viewer',
  version: '0.1.0',
  summary: 'DICOM medical imaging viewer using Cornerstone3D',
  git: 'https://github.com/clinical-meteor/dicom-viewer',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');

  // Core Meteor dependencies
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'react-meteor-data@3.0.1',
    'session',
    'mongo',
    'check'
  ]);

  // Clinical/FHIR dependencies
  api.use([
    'clinical:extended-api@3.0.0',
    'clinical:hl7-resource-datatypes@4.0.8'
  ]);

  // Client entry point
  api.mainModule('index.jsx', 'client');
});
