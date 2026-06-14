// npmPackages/hipaa-compliance/server/index.js
//
// Server entry — assembled from the Atmosphere package's api.addFiles('server')
// list. Each server file imports its own lib deps relatively (Collections,
// Constants, EncryptionManager, SecurityValidators, HipaaLoggerAccess,
// PolicyRoutes/PolicyGenerator), so no separate lib import is needed here.
// startup.js runs Meteor.startup + setupAuditHooks — imported last.

import './methods.js';
import './publications.js';
import './hooks.js';
import './encryption.js';
import './policyMethods.js';
import './startup.js';
