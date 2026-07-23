// packages/request-for-corrections/server/methods/correctionWorkflow.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// ServerMethods registry (rpc migration). Placeholder workflow-transition stub
// (unimplemented). Had NO auth guard historically; requireAuth now applies
// (default true) — it will transition patient correction Tasks. Canonical name
// already dotted (no rename → no aliases). positionalParams preserve the legacy
// (taskId, newStatus) order. phi:true — operates on patient-linked Tasks. Uses
// the global Meteor.ServerMethods per the npmPackages exemplar.
Meteor.ServerMethods.define('correctionWorkflow.transition', {
  description: 'Transition a correction Task to a new workflow status (not yet implemented)',
  phi: true,
  positionalParams: ['taskId', 'newStatus'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' }, newStatus: { type: 'string' } },
    required: ['taskId', 'newStatus']
  }
}, async function(params, context){
    const taskId = get(params, 'taskId');
    const newStatus = get(params, 'newStatus');
    // To be implemented
});