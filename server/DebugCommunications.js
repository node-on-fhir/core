// server/DebugCommunications.js
// NOTE: currently NOT imported by server/main.js (commented out) — dead code
// kept for debugging. Converted to the ServerMethods registry so it is safe
// to re-enable.

import { Meteor } from 'meteor/meteor';
import { Communications } from '../imports/lib/schemas/SimpleSchemas/Communications';

// Imported directly (not via the Meteor.ServerMethods global) because, when
// enabled, this module loads from server/main.js BEFORE server/rpc/rpcSetup.js.
import ServerMethods from '/imports/lib/ServerMethods.js';

// requireAuth note: 'debug.listApprovalCommunications' historically had NO
// auth guard (the other two checked this.userId). It reads patient
// Communication records, so requireAuth now applies (the default) — behavior
// change from the pre-migration guard-less state.

ServerMethods.define('debug.listApprovalCommunications', {
  description: 'List all intervention-approval Communication records (debug)',
  phi: true    // patient Communication content
}, async function(params, context) {
  context.log.info('[Server Debug] Listing approval communications...');

  const approvalComms = await Communications.find({
    'category.0.coding.0.code': 'intervention-approval'
  }).fetchAsync();

  context.log.info(`[Server Debug] Found ${approvalComms.length} approval communications`);

  const result = approvalComms.map(comm => ({
    _id: comm._id,
    id: comm.id,
    status: comm.status,
    sent: comm.sent,
    recipient: comm.recipient?.[0]?.reference,
    payload: comm.payload?.[0]?.contentString?.substring(0, 50) + '...'
  }));

  context.log.debug('[Server Debug] Approval communications', { data: result });

  return result;
});

ServerMethods.define('debug.deleteCommunicationDirect', {
  description: 'Delete a single Communication record by _id or FHIR id (debug)',
  phi: true,   // patient Communication records
  positionalParams: ['commId'],
  schemaObject: {
    type: 'object',
    properties: { commId: { type: 'string' } },
    required: ['commId']
  }
}, async function(params, context) {
  const commId = params.commId;

  context.log.info('[Server Debug] Direct deletion attempt', { data: { commId: commId } });

  // Try to find it first
  const existing = await Communications.findOneAsync({
    $or: [
      { _id: commId },
      { id: commId }
    ]
  });

  if (!existing) {
    context.log.error('[Server Debug] Communication not found', { data: { commId: commId } });
    return { success: false, error: 'not-found' };
  }

  context.log.info('[Server Debug] Found communication', { data: {
    _id: existing._id,
    id: existing.id,
    status: existing.status
  }});

  try {
    // Try direct removal
    const result = await Communications.removeAsync({ _id: existing._id });
    context.log.info('[Server Debug] Remove result', { data: { result: result } });

    // Verify it's gone
    const stillExists = await Communications.findOneAsync({ _id: existing._id });

    if (stillExists) {
      context.log.error('[Server Debug] Communication still exists after removal!');
      return { success: false, error: 'still-exists' };
    }

    context.log.info('[Server Debug] Communication successfully deleted');
    return { success: true, deletedId: existing._id };

  } catch (error) {
    context.log.error('[Server Debug] Error during deletion', { message: error.message });
    return { success: false, error: error.message };
  }
});

ServerMethods.define('debug.cleanupApprovalCommunications', {
  description: 'Delete completed, stale, or orphaned intervention-approval Communications (debug)',
  phi: true    // patient Communication records
}, async function(params, context) {
  context.log.info('[Server Debug] Cleaning up completed/orphaned approval communications...');

  // Import ServiceRequests collection
  const ServiceRequests = await import('../imports/lib/schemas/SimpleSchemas/ServiceRequests').then(m => m.ServiceRequests);

  // Find approval communications that should be cleaned up
  const toCleanup = await Communications.find({
    $and: [
      { 'category.0.coding.0.code': 'intervention-approval' },
      {
        $or: [
          { status: 'completed' },
          { status: 'stopped' },
          // Communications older than 24 hours
          { sent: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      }
    ]
  }).fetchAsync();

  // Also find orphaned communications - those without a matching ServiceRequest
  const allApprovalComms = await Communications.find({
    'category.0.coding.0.code': 'intervention-approval'
  }).fetchAsync();

  context.log.info(`[Server Debug] Found ${allApprovalComms.length} total approval communications`);

  for (const comm of allApprovalComms) {
    // Check if there's a ServiceRequest that references this Communication
    const matchingServiceRequest = await ServiceRequests.findOneAsync({
      $or: [
        { 'supportingInfo.reference': `Communication/${comm._id}` },
        { 'replaces.reference': `Communication/${comm._id}` }
      ]
    });

    if (!matchingServiceRequest) {
      context.log.info(`[Server Debug] Communication ${comm._id} is orphaned (no ServiceRequest references it)`);
      toCleanup.push(comm);
    } else if (matchingServiceRequest.status === 'completed') {
      context.log.info(`[Server Debug] Communication ${comm._id} belongs to completed ServiceRequest`);
      toCleanup.push(comm);
    }
  }

  // Remove duplicates
  const uniqueToCleanup = Array.from(new Map(toCleanup.map(c => [c._id, c])).values());

  context.log.info(`[Server Debug] Total communications to clean up: ${uniqueToCleanup.length}`);

  let deleted = 0;
  let failed = 0;

  for (const comm of uniqueToCleanup) {
    try {
      await Communications.removeAsync({ _id: comm._id });
      deleted++;
      context.log.info(`[Server Debug] Deleted: ${comm._id}`);
    } catch (error) {
      failed++;
      context.log.error(`[Server Debug] Failed to delete ${comm._id}`, { message: error.message });
    }
  }

  return {
    total: uniqueToCleanup.length,
    deleted: deleted,
    failed: failed
  };
});
