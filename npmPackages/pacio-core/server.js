// npmPackages/pacio-core/server.js
//
// Server entry — re-exports the pacio-core server mainModule (methods +
// publications + subscriptions + Meteor.startup bed init). Critically, this
// re-exports server/index.js's `ProfileSet` (PACIO TOC/ADI/PFE profiles), which
// the generated imports/workflows/server-loader.js captures into
// Package['@node-on-fhir/pacio-core'] so server/Metadata.js discovers it and
// adds the profiles to the CapabilityStatement (PACIO Inferno validation).
// See .claude/rules/fhir/package-registry.md.

export * from './server/index.js';
