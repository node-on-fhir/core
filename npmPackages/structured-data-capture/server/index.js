// npmPackages/structured-data-capture/server/index.js
//
// Server entry — the shared lib utilities (api.addFiles ['client','server']) plus
// the SDC server methods (the Atmosphere server mainModule was server/methods.js).
// The utils are ES `export const`; methods.js imports what it needs, but we import
// them here too so the shared surface initializes consistently with the client.

import '../lib/QuestionnaireUtils.js';
import '../lib/ResponseUtils.js';
import '../lib/ValidationUtils.js';
import './methods.js';
