// packages/reference-app/package.js

Package.describe({
  name: 'clinical:reference-app',
  version: '0.1.0',
  summary: 'Gold standard reference template for Honeycomb packages - ONC HealthIT Certification',
  git: 'https://github.com/clinical-meteor/reference-app',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');
  
  // Core Meteor dependencies - REQUIRED
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'react-meteor-data@3.0.1',
    'session',
    'mongo',
    'check',
    'random'
  ]);
  
  // Clinical/FHIR dependencies - RECOMMENDED
  api.use([
    'clinical:extended-api@3.0.0',
    'clinical:hl7-resource-datatypes@4.0.8'
  ]);
  
  // ONC Health IT Certification dependencies - OPTIONAL
  // Add these packages for full certification compliance testing
  api.use([
    'clinical:accounts-management@1.0.0',
    'clinical:antimicrobial-reporting@1.0.0',
    'clinical:cancer-registry-reporting@1.0.0',
    'clinical:case-reporting@1.0.0',
    'clinical:ccda-export@1.0.0',
    'clinical:clinical-lists@0.1.0',    
    'clinical:data-exporter@0.12.2',
    'clinical:drug-formulary@0.1.0',
    'clinical:drug-interactions@0.1.0',
    'clinical:e-prescribing@0.1.0',
    'clinical:family-health-history@1.0.0',
    'clinical:healthcare-surveys@1.0.0',
    'clinical:hipaa-compliance@0.1.0',
    'clinical:immunization-registry@1.0.0',
    'clinical:implantable-devices@0.1.0',
    'clinical:international-patient-summary@0.1.0',
    'clinical:lab-test-reporting@1.0.0',
    'clinical:multi-factor-auth@0.1.0',
    'clinical:order-catalog@0.1.0',     
    'clinical:pacio-core@0.1.0',
    'clinical:patient-matching@0.1.0',
    'clinical:quality-measures@0.1.0',
    'clinical:request-for-corrections@0.1.0',    
    'clinical:secure-messaging@0.1.0',
    'clinical:syndromic-surveillance@1.0.0',
    'clinical:social-determinants@1.0.0',    
    'clinical:structured-data-capture@0.1.0',
    'symptomatic:symptom-tracking@0.1.0'
  ], {weak: true});


    
  

  // Server files
  api.addFiles('server/index.js', 'server');
  api.addFiles('server/methods.js', 'server');
  api.addFiles('server/publications.js', 'server');
  
  // Client entry point
  api.mainModule('index.jsx', 'client');
  
  // Export collections and utilities
  api.export('ReferenceAppCollections');
  api.export('ReferenceAppUtilities', 'client');
  api.export('PatientsDirectoryButtons', 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('clinical:reference-app');
  api.mainModule('tests/reference-app-tests.js');
});