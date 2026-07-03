// npmPackages/provider-directory/server/index.js
//
// Server entry — loads the provider-directory methods, REST endpoints, and
// collection hooks as side-effect imports (were api.addFiles in the Atmosphere
// package.js). Re-exported through ../server.js so the generated
// imports/workflows/server-loader.js can namespace-import it (Package registry).

import { registerDirectoryCollections } from '../lib/DirectoryCollections.js';

import './methods.js';
import './methods.directory.js';
import './https.js';
import './hooks.js';

// Register the Directory.* collections into global.Collections / Meteor.Collections.
registerDirectoryCollections();

console.log('[provider-directory] Server methods + REST endpoints + hooks registered');
