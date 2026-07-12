// npmPackages/hipaa-compliance/server.js
//
// Server entry — re-exports the library surface (so the generated
// server-loader registers it on Package['@node-on-fhir/hipaa-compliance'],
// which the core log.phi() audit sink resolves) and assembles the server
// mainModule (methods, publications, collection hooks, encryption, policy
// methods, startup).

export { HipaaLogger } from './lib/HipaaLogger.js';
export { SecurityValidators } from './lib/SecurityValidators.js';
export { EncryptionManager } from './lib/EncryptionManager.js';
export { EventTypes, SecurityLevels, UserRoles, HipaaConstants } from './lib/Constants.js';
export {
  buildFhirAuditEvent,
  flattenAuditEvent,
  buildAuditQuery,
  mapEventTypeToAction,
  EXTENSION_URLS
} from './lib/AuditEventMapping.js';

import './server/index.js';
