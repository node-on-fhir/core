// packages/vital-signs/package.js
Package.describe({
  name: 'clinical:vital-signs',
  version: '0.1.0',
  summary: 'HL7 FHIR Vital Signs Implementation Guide for Meteor/Honeycomb',
  git: 'https://github.com/clinical-meteor/clinical-vital-signs',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  
  // Core Meteor packages
  api.use([
    'meteor',
    'webapp',
    'mongo',
    'ecmascript',
    'react-meteor-data@3.0.0',
    'session',
    'tracker'
  ]);

  // NPM dependencies
  Npm.depends({
    'simpl-schema': '3.4.6',
    'lodash': '4.17.21',
    'moment': '2.29.4',
    'recharts': '2.12.7',
    '@nivo/core': '0.87.0',
    '@nivo/line': '0.87.0',
    'prop-types': '15.8.1'
  });

  // Note: Using Meteor.Collections from the main app instead of clinical packages

  // Schema validation - using NPM packages via ecmascript
  // simpl-schema is available via NPM imports
  api.use([
    'matb33:collection-hooks'
  ]);

  // Client packages
  api.use([
    'static-html',
    'reactive-var'
  ], 'client');

  // Import mainModule files
  api.mainModule('lib/index.js', 'server');
  api.mainModule('index.jsx', 'client');
  
  // Export the main APIs
  api.export([
    'VitalSigns',
    'VitalSignsSchemas',
    'VitalSignsValueSets'
  ], ['client', 'server']);
  
  // Export client-only APIs (React components)
  api.export([
    'DynamicRoutes',
    'SidebarElements',
    'SidebarWorkflows'
  ], 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:vital-signs');
  
  api.use([
    'ecmascript',
    'meteortesting:mocha@3.1.0-rc.1',
    'chai',
    // 'clinical:hl7-fhir-resources', // Package doesn't exist
    // 'clinical:hl7-resource-datatypes' // Package doesn't exist
  ]);

  // Test files
  api.addFiles('tests/VitalSignsSchemas.tests.js');
  api.addFiles('tests/VitalSignsValidation.tests.js', 'server');
  api.addFiles('tests/VitalSignsComponents.tests.js', 'client');
  api.addFiles('tests/VitalSignsMethods.tests.js', 'server');
});