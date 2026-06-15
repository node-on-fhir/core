// npmPackages/quality-measures/server.js
//
// Server entry — re-exports the quality-measures server module (measure
// pipeline + methods + startup). No discoverable Package-registry symbols
// (ProfileSet etc.); registers as Package['@node-on-fhir/quality-measures'] = {}
// — harmless.

export * from './server/index.js';
