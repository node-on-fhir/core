// npmPackages/healthcare-surveys/server/index.js
//
// Server entry — the Atmosphere package's only server file was
// api.addFiles('server/methods.js','server'). methods.js is self-contained
// (Meteor.methods only). The server/{methods,publications,cron,fhir}/ subtrees
// and imports/api/* were present but never wired into package.js (dead code) —
// faithfully NOT loaded here.

import './methods.js';
