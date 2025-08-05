// /packages/workqueues/lib/collections.js

import { Mongo } from 'meteor/mongo';

// Create collections
export const WorkQueues = new Mongo.Collection('WorkQueues');
export const WorkQueueItems = new Mongo.Collection('WorkQueueItems');

// Allow rules for development - should be replaced with methods in production
if (Meteor.isClient) {
  // Client-side allow rules are deprecated in Meteor 3.0
  // All operations should go through methods
}

if (Meteor.isServer) {
  // Create indexes for performance
  Meteor.startup(async function() {
    // WorkQueues indexes
    await WorkQueues.createIndexAsync({ name: 1 });
    await WorkQueues.createIndexAsync({ department: 1 });
    await WorkQueues.createIndexAsync({ active: 1 });
    await WorkQueues.createIndexAsync({ createdBy: 1 });
    
    // WorkQueueItems indexes
    await WorkQueueItems.createIndexAsync({ status: 1 });
    await WorkQueueItems.createIndexAsync({ priority: 1 });
    await WorkQueueItems.createIndexAsync({ assignee: 1 });
    await WorkQueueItems.createIndexAsync({ creator: 1 });
    await WorkQueueItems.createIndexAsync({ queueId: 1 });
    await WorkQueueItems.createIndexAsync({ done: 1 });
    await WorkQueueItems.createIndexAsync({ star: 1 });
    await WorkQueueItems.createIndexAsync({ dueDate: 1 });
    await WorkQueueItems.createIndexAsync({ createdAt: -1 });
    await WorkQueueItems.createIndexAsync({ 'tags': 1 });
    await WorkQueueItems.createIndexAsync({ patientId: 1 });
    await WorkQueueItems.createIndexAsync({ encounterId: 1 });
    
    // Compound indexes
    await WorkQueueItems.createIndexAsync({ assignee: 1, status: 1, priority: 1 });
    await WorkQueueItems.createIndexAsync({ queueId: 1, status: 1, priority: 1 });
  });
}