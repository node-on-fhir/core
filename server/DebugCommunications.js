// /Volumes/SonicMagic/Code/honeycomb-public-release/server/DebugCommunications.js

import { Meteor } from 'meteor/meteor';
import { Communications } from '../imports/lib/schemas/SimpleSchemas/Communications';

Meteor.methods({
  'debug.listApprovalCommunications': async function() {
    console.log('[Server Debug] Listing approval communications...');
    
    const approvalComms = await Communications.find({
      'category.0.coding.0.code': 'intervention-approval'
    }).fetchAsync();
    
    console.log(`[Server Debug] Found ${approvalComms.length} approval communications`);
    
    const result = approvalComms.map(comm => ({
      _id: comm._id,
      id: comm.id,
      status: comm.status,
      sent: comm.sent,
      recipient: comm.recipient?.[0]?.reference,
      payload: comm.payload?.[0]?.contentString?.substring(0, 50) + '...'
    }));
    
    console.log('[Server Debug] Approval communications:', result);
    
    return result;
  },
  
  'debug.deleteCommunicationDirect': async function(commId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in');
    }
    
    console.log('[Server Debug] Direct deletion attempt for:', commId);
    
    // Try to find it first
    const existing = await Communications.findOneAsync({
      $or: [
        { _id: commId },
        { id: commId }
      ]
    });
    
    if (!existing) {
      console.error('[Server Debug] Communication not found:', commId);
      return { success: false, error: 'not-found' };
    }
    
    console.log('[Server Debug] Found communication:', {
      _id: existing._id,
      id: existing.id,
      status: existing.status
    });
    
    try {
      // Try direct removal
      const result = await Communications.removeAsync({ _id: existing._id });
      console.log('[Server Debug] Remove result:', result);
      
      // Verify it's gone
      const stillExists = await Communications.findOneAsync({ _id: existing._id });
      
      if (stillExists) {
        console.error('[Server Debug] Communication still exists after removal!');
        return { success: false, error: 'still-exists' };
      }
      
      console.log('[Server Debug] Communication successfully deleted');
      return { success: true, deletedId: existing._id };
      
    } catch (error) {
      console.error('[Server Debug] Error during deletion:', error);
      return { success: false, error: error.message };
    }
  },
  
  'debug.cleanupApprovalCommunications': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in');
    }
    
    console.log('[Server Debug] Cleaning up completed/orphaned approval communications...');
    
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
    
    console.log(`[Server Debug] Found ${allApprovalComms.length} total approval communications`);
    
    for (const comm of allApprovalComms) {
      // Check if there's a ServiceRequest that references this Communication
      const matchingServiceRequest = await ServiceRequests.findOneAsync({
        $or: [
          { 'supportingInfo.reference': `Communication/${comm._id}` },
          { 'replaces.reference': `Communication/${comm._id}` }
        ]
      });
      
      if (!matchingServiceRequest) {
        console.log(`[Server Debug] Communication ${comm._id} is orphaned (no ServiceRequest references it)`);
        toCleanup.push(comm);
      } else if (matchingServiceRequest.status === 'completed') {
        console.log(`[Server Debug] Communication ${comm._id} belongs to completed ServiceRequest`);
        toCleanup.push(comm);
      }
    }
    
    // Remove duplicates
    const uniqueToCleanup = Array.from(new Map(toCleanup.map(c => [c._id, c])).values());
    
    console.log(`[Server Debug] Total communications to clean up: ${uniqueToCleanup.length}`);
    
    let deleted = 0;
    let failed = 0;
    
    for (const comm of uniqueToCleanup) {
      try {
        await Communications.removeAsync({ _id: comm._id });
        deleted++;
        console.log(`[Server Debug] Deleted: ${comm._id}`);
      } catch (error) {
        failed++;
        console.error(`[Server Debug] Failed to delete ${comm._id}:`, error.message);
      }
    }
    
    return {
      total: uniqueToCleanup.length,
      deleted: deleted,
      failed: failed
    };
  }
});