// packages/request-for-corrections/server/methods/correctionOperations.js

import { Meteor } from 'meteor/meteor';

// ServerMethods registry (rpc migration). Stub for the $correction-request FHIR
// operation (unimplemented). Had NO auth guard historically; requireAuth now
// applies (default true) — it will eventually process patient correction
// bundles. Canonical name is already dotted (no rename → no aliases). phi:true —
// the bundle carries patient data. Uses the global Meteor.ServerMethods per the
// npmPackages exemplar.
Meteor.ServerMethods.define('correctionRequest.submit', {
  description: 'Process a $correction-request FHIR operation bundle (not yet implemented)',
  phi: true,
  positionalParams: ['bundle'],
  schemaObject: { type: 'object' }
}, async function(params, context){
    const bundle = params;
    // To be implemented - will process the correction request bundle
});