// npmPackages/accounts-management/server/index.js
//
// Server entry — registers the accounts-management Meteor methods and
// publications as side-effect imports (was api.addFiles in the Atmosphere
// package.js). Re-exported through ../server.js so the generated
// imports/workflows/server-loader.js can namespace-import it (Package registry).

import './methods.js';
import './publications.js';

console.log('[accounts-management] Server methods + publications registered');
