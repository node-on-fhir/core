// npmPackages/data-importer/server/index.js
//
// Server entry — the Atmosphere package's three api.addFiles('server') files:
// the XLSX import methods, the proxy methods, and the data-warehouse methods.
// (HTTP from meteor/http resolves — http@1.0.1 is in the app's .meteor/versions.)

import './methods.xlsx.js';
import './methods.proxy.js';
import './methods.warehouse.js';
