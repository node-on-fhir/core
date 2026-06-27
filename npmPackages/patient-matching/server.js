// npmPackages/patient-matching/server.js
//
// Server entry — re-exports the package's self-contained server mainModule
// (collections/schemas/constants/utils + methods, REST IDI-match endpoint,
// FHIR operations, AAL2 security, audit logging, publications, startup).

import './server/index.js';

// Entity-resolution surface, also reachable server-side via the Package registry
// (Package['@node-on-fhir/patient-matching'].Deduplicator) for server-side import.
export { Deduplicator } from './lib/Deduplicator.js';
export { MatchingAlgorithm } from './lib/utils/matchingAlgorithm.js';
