// npmPackages/vital-signs/server.js
//
// Server entry — re-exports the package's server mainModule (lib/index.js: the
// VitalSigns collection handle bound to the host 'Observations' collection, plus
// the FHIR Vital Signs schemas / value sets / extensions / utilities).
//
// NOTE: the package's server/ tree (CRUD methods + publications) was never wired
// into package.js (the Atmosphere server mainModule was lib/index.js, which does
// not import server/) — it is kept for reference but, faithfully, NOT loaded.

export * from './lib/index.js';
