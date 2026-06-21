// npmPackages/provider-directory/server.js
//
// Server entry — re-exports the provider-directory server module (methods +
// REST endpoints + hooks). No discoverable Package-registry symbols (ProfileSet
// etc.); registers as Package['@node-on-fhir/provider-directory'] = {} — harmless.

export * from './server/index.js';
