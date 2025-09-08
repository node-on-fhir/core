// packages/clinical-documents/package.js

Package.describe({
  name: 'clinical:clinical-documents',
  version: '1.0.0',
  summary: 'FHIR Clinical Documents based on HL7 FHIR Clinical Document IG',
  git: 'https://github.com/clinical-meteor/clinical-documents',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'mongo',
    'react-meteor-data@3.0.1',
    'clinical:hl7-resource-datatypes@4.0.8'
  ]);

    api.use('matb33:collection-hooks', {weak: true});

  api.imply([
    'clinical:hl7-resource-datatypes'
  ]);
  
  // Main entry point for client
  api.mainModule('index.jsx', 'client');

  // Common files - Collections
  api.addFiles('lib/collections/ClinicalDocuments.js', ['client', 'server']);
  api.addFiles('lib/collections/DocumentRevisions.js', ['client', 'server']);
  
  // Client components
  api.addFiles('client/pages/ClinicalDocumentsList.jsx', 'client');
  api.addFiles('client/pages/ClinicalDocumentDetail.jsx', 'client');
  
  // Server publications
  api.addFiles('server/publications/clinicalDocuments.js', 'server');
  api.addFiles('server/publications/documentRevisions.js', 'server');
  // 
  // api.addFiles('lib/constants/participantTypes.js', ['client', 'server']);
  // api.addFiles('lib/constants/documentTypes.js', ['client', 'server']);
  //
  // // Server files
  // api.addFiles('server/publications/clinicalDocuments.js', 'server');
  // api.addFiles('server/publications/documentRevisions.js', 'server');
  // api.addFiles('server/rest/clinicalDocumentEndpoints.js', 'server');
  // api.addFiles('server/rest/operationEndpoints.js', 'server');
  // api.addFiles('server/security/documentPermissions.js', 'server');
  // api.addFiles('server/security/participantValidation.js', 'server');
  // api.addFiles('server/startup/registerMethods.js', 'server');
  // api.addFiles('server/startup/loadExamples.js', 'server');
  //
  // // Client files
  // api.addFiles('client/components/ClinicalDocumentViewer.jsx', 'client');
  // api.addFiles('client/components/ClinicalDocumentEditor.jsx', 'client');
  // api.addFiles('client/components/DocumentParticipants.jsx', 'client');
  // api.addFiles('client/components/DocumentAttesters.jsx', 'client');
  // api.addFiles('client/components/DocumentVersionHistory.jsx', 'client');
  // api.addFiles('client/hooks/useClinicalDocument.js', 'client');
  // api.addFiles('client/hooks/useDocumentValidation.js', 'client');
  // api.addFiles('client/pages/ClinicalDocumentsList.jsx', 'client');
  // api.addFiles('client/pages/ClinicalDocumentDetail.jsx', 'client');
  //
  // // Methods (available on both client and server)
  // api.addFiles('lib/methods/createClinicalDocument.js', ['client', 'server']);
  // api.addFiles('lib/methods/updateClinicalDocument.js', ['client', 'server']);
  // api.addFiles('lib/methods/convertToTransactionBundle.js', ['client', 'server']);
  // api.addFiles('lib/methods/validateClinicalDocument.js', ['client', 'server']);
  //
  // // Utilities
  // api.addFiles('lib/utilities/cdaMapper.js', ['client', 'server']);
  // api.addFiles('lib/utilities/narrativeGenerator.js', ['client', 'server']);
  // api.addFiles('lib/utilities/documentValidator.js', ['client', 'server']);
  // api.addFiles('lib/utilities/versionManager.js', ['client', 'server']);

  // Exports
  api.export('ClinicalDocuments');
  api.export('DocumentRevisions');
  api.export('DocumentRevisionSchema');
});

Package.onTest(function(api) {
  api.use('clinical:clinical-documents');
  api.use([
    'meteortesting:mocha',
    'practicalmeteor:chai',
    'ecmascript'
  ]);

  // Test files (commented out until implementation exists)
  // api.addFiles('tests/schemas/ClinicalDocumentBundle.tests.js', 'server');
  // api.addFiles('tests/methods/createClinicalDocument.tests.js', 'server');
  // api.addFiles('tests/utilities/cdaMapper.tests.js', 'server');
  // api.addFiles('tests/integration/documentWorkflow.tests.js', 'server');
});