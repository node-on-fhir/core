// packages/smart-web-messaging/package.js

Package.describe({
  name: 'clinical:smart-web-messaging',
  version: '0.0.1',
  summary: 'SMART Web Messaging implementation for FHIR-based web applications',
  git: 'https://github.com/clinical-meteor/smart-web-messaging',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0');
  
  api.use('ecmascript');
  api.use('meteor');
  api.use('mongo');
  api.use('check');
  api.use('reactive-var');
  api.use('tracker');
  
  // Clinical packages
  api.use('clinical:hl7-fhir-resources@7.0.0');
  api.use('clinical:hl7-resource-datatypes@7.0.0');
  api.use('aldeed:collection2@2.5.0');
  api.use('matb33:collection-hooks@0.7.13');
  
  // React dependencies for UI components
  api.use('react-meteor-data', 'client');
  
  // SimpleSchema for validation
  api.addFiles('lib/schemas/MessageSchema.js', ['client', 'server']);
  api.addFiles('lib/schemas/ActivitySchema.js', ['client', 'server']);
  
  // Constants
  api.addFiles('lib/constants/MessageTypes.js', ['client', 'server']);
  api.addFiles('lib/constants/Activities.js', ['client', 'server']);
  api.addFiles('lib/constants/LaunchStatusCodes.js', ['client', 'server']);
  
  // Utilities
  api.addFiles('lib/utilities/MessageValidator.js', ['client', 'server']);
  api.addFiles('lib/utilities/OriginChecker.js', ['client', 'server']);
  
  // Main namespace
  api.addFiles('lib/SmartWebMessaging.js', ['client', 'server']);
  
  // Client files
  api.addFiles('client/MessageHandler.js', 'client');
  api.addFiles('client/SmartMessagingClient.js', 'client');
  
  // Client handlers
  api.addFiles('client/handlers/StatusHandlers.js', 'client');
  api.addFiles('client/handlers/UIHandlers.js', 'client');
  api.addFiles('client/handlers/ScratchpadHandlers.js', 'client');
  api.addFiles('client/handlers/FhirHandlers.js', 'client');
  
  // Client services
  api.addFiles('client/services/ScratchpadService.js', 'client');
  api.addFiles('client/services/ActivityLauncher.js', 'client');
  api.addFiles('client/services/MessageDispatcher.js', 'client');
  
  // React components
  api.addFiles('client/components/SmartMessagingProvider.jsx', 'client');
  api.addFiles('client/components/ActivityLaunchModal.jsx', 'client');
  api.addFiles('client/components/MessagingDebugPanel.jsx', 'client');
  
  // Server files
  api.addFiles('server/SmartMessagingServer.js', 'server');
  api.addFiles('server/authorization/MessagingScopes.js', 'server');
  api.addFiles('server/methods/scratchpadMethods.js', 'server');
  api.addFiles('server/methods/activityMethods.js', 'server');
  api.addFiles('server/publications/scratchpadPublications.js', 'server');
  
  // Export
  api.export('SmartWebMessaging');
  api.export('MessageTypes');
  api.export('Activities');
  api.export('LaunchStatusCodes');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('clinical:smart-web-messaging');
  api.use('ecmascript');
  
  // Add test files
  api.addFiles('tests/client/MessageHandler.tests.js', 'client');
  api.addFiles('tests/client/ScratchpadHandlers.tests.js', 'client');
  api.addFiles('tests/client/ActivityLauncher.tests.js', 'client');
  
  api.addFiles('tests/server/authorization.tests.js', 'server');
  api.addFiles('tests/server/scratchpadMethods.tests.js', 'server');
});