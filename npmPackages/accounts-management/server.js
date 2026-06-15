// npmPackages/accounts-management/server.js
//
// Server entry — re-exports the accounts-management server module (methods +
// publications). No discoverable Package-registry symbols (ProfileSet etc.);
// registers as Package['@node-on-fhir/accounts-management'] = {} — harmless.

export * from './server/index.js';
