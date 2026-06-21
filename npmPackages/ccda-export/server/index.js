// npmPackages/ccda-export/server/index.js
//
// Server entry — registers the ccda-export publications + methods as
// side-effect imports (was api.addFiles in the Atmosphere package.js). The
// collections they reference are defined in ../lib/collections/*. Re-exported
// through ../server.js so the generated imports/workflows/server-loader.js can
// namespace-import it (Package registry).

import './publications/clinicalDocuments.js';
import './publications/documentRevisions.js';
import './methods.js';

console.log('[ccda-export] Server publications + methods registered');
