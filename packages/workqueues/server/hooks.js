// /packages/workqueues/server/hooks.js

import { WorkQueueItems } from '../lib/collections';
import { Random } from 'meteor/random';
import { get } from 'lodash';

// Audit log function
function auditLog(userId, action, collection, docId, details) {
  console.log(`AUDIT: User ${userId} performed ${action} on ${collection}/${docId}`, details);
  // In production, this would write to an audit collection or external service
}

// Only set up hooks if collection-hooks package is available
if (Package['matb33:collection-hooks']) {
  // Before insert hook
  WorkQueueItems.before.insert(function(userId, doc) {
  // Set default values
  doc.createdAt = new Date();
  doc.updatedAt = new Date();
  doc.creator = userId;
  doc.owner = userId;
  
  if (!doc.assignee) {
    doc.assignee = userId;
  }
  
  // Auto-star urgent/stat tasks
  if (doc.priority === 'stat' || doc.priority === 'urgent') {
    doc.star = true;
  }
  
  // Generate FHIR Task ID if not present
  if (!doc.fhirTask || !doc.fhirTask.id) {
    if (!doc.fhirTask) {
      doc.fhirTask = { resourceType: 'Task' };
    }
    doc.fhirTask.id = Random.id();
  }
  
  auditLog(userId, 'insert', 'WorkQueueItems', doc._id, { text: doc.text });
});

// Before update hook
WorkQueueItems.before.update(function(userId, doc, fieldNames, modifier, options) {
  // Update timestamp
  if (!modifier.$set) {
    modifier.$set = {};
  }
  modifier.$set.updatedAt = new Date();
  
  // Track status transitions
  if (modifier.$set && modifier.$set.status) {
    const oldStatus = doc.status;
    const newStatus = modifier.$set.status;
    
    if (oldStatus !== newStatus) {
      auditLog(userId, 'status_change', 'WorkQueueItems', doc._id, {
        from: oldStatus,
        to: newStatus
      });
      
      // Auto-complete when status is completed
      if (newStatus === 'completed' && !doc.done) {
        modifier.$set.done = true;
        modifier.$set.completedAt = new Date();
        modifier.$set.progress = 100;
      }
      
      // Set startedAt when moving to in-progress
      if (newStatus === 'in-progress' && !doc.startedAt) {
        modifier.$set.startedAt = new Date();
      }
    }
  }
  
  // Track completion
  if (modifier.$set && modifier.$set.done !== undefined) {
    if (modifier.$set.done && !doc.done) {
      modifier.$set.completedAt = new Date();
      modifier.$set.status = 'completed';
      modifier.$set.progress = 100;
      
      auditLog(userId, 'complete', 'WorkQueueItems', doc._id, {
        text: doc.text,
        completedBy: userId
      });
    } else if (!modifier.$set.done && doc.done) {
      modifier.$set.completedAt = null;
      modifier.$set.status = 'in-progress';
      
      auditLog(userId, 'uncomplete', 'WorkQueueItems', doc._id, {
        text: doc.text
      });
    }
  }
  
  // Track assignment changes
  if (modifier.$set && modifier.$set.assignee && modifier.$set.assignee !== doc.assignee) {
    auditLog(userId, 'reassign', 'WorkQueueItems', doc._id, {
      from: doc.assignee,
      to: modifier.$set.assignee
    });
  }
  
  // Update FHIR Task lastModified
  if (doc.fhirTask && modifier.$set) {
    if (!modifier.$set.fhirTask) {
      modifier.$set.fhirTask = doc.fhirTask;
    }
    modifier.$set.fhirTask.lastModified = new Date().toISOString();
  }
});

  // After remove hook
  WorkQueueItems.after.remove(function(userId, doc) {
    auditLog(userId, 'remove', 'WorkQueueItems', doc._id, {
      text: doc.text,
      status: doc.status
    });
  });
} else {
  console.log('WorkQueues: matb33:collection-hooks not available, audit logging disabled');
}