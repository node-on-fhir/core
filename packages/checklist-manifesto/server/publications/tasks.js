// /packages/checklist-manifesto/server/publications/tasks.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ChecklistTasks } from '../../lib/collections/ChecklistTasks';
import { ChecklistLists } from '../../lib/collections/ChecklistLists';

// Publish tasks that belong to the current user
Meteor.publish('checklist.tasks', function(options = {}) {
  if (!this.userId) {
    return this.ready();
  }

  const selector = {
    $or: [
      { requester: this.userId },
      { owner: this.userId }
    ],
    isDeleted: { $ne: true }
  };

  // Add optional filters
  if (options.status) {
    selector.status = options.status;
  }

  if (options.priority) {
    selector.priority = options.priority;
  }

  if (options.listId) {
    selector.listId = options.listId;
  }

  return ChecklistTasks.find(selector, {
    sort: { lastModified: -1 }
  });
});

// Publish tasks for a specific list
Meteor.publish('checklist.tasksByList', async function(listId) {
  check(listId, String);

  // First check if the list exists and user has access
  const list = await ChecklistLists.findOneAsync({
    _id: listId,
    isDeleted: { $ne: true }
  });

  if (!list) {
    return this.ready();
  }

  // Check permissions - only allow access if list is public or user is the owner
  if (!list.public && (!this.userId || list.userId !== this.userId)) {
    return this.ready();
  }

  // Return tasks for this list
  return ChecklistTasks.find({
    listId: listId,
    isDeleted: { $ne: true }
  }, {
    sort: { ordinal: 1, authoredOn: 1 }
  });
});

// Publish a single task by ID
Meteor.publish('checklist.taskDetails', function(taskId) {
  check(taskId, String);

  if (!this.userId) {
    return this.ready();
  }

  return ChecklistTasks.find({
    _id: taskId,
    $or: [
      { requester: this.userId },
      { owner: this.userId }
    ],
    isDeleted: { $ne: true }
  });
});

// Publish tasks that are due soon
Meteor.publish('checklist.tasksDueSoon', function(daysAhead = 7) {
  if (!this.userId) {
    return this.ready();
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  return ChecklistTasks.find({
    $or: [
      { requester: this.userId },
      { owner: this.userId }
    ],
    'executionPeriod.end': { $lte: cutoffDate, $gte: new Date() },
    status: { $nin: ['completed', 'cancelled', 'entered-in-error'] },
    isDeleted: { $ne: true }
  }, {
    sort: { 'executionPeriod.end': 1 }
  });
});

// Publish tasks from protocols (for the protocol library)
Meteor.publish('checklist.protocolTasks', async function(protocolId) {
  check(protocolId, String);

  // Check if protocol exists and user has access
  const protocol = await ChecklistLists.findOneAsync({
    _id: protocolId,
    $or: [
      { isProtocol: true },
      { isSystemTemplate: true }
    ],
    isDeleted: { $ne: true }
  });

  if (!protocol) {
    return this.ready();
  }

  // Check access - system templates are always public
  if (!protocol.isSystemTemplate && !protocol.public && (!this.userId || protocol.userId !== this.userId)) {
    return this.ready();
  }

  return ChecklistTasks.find({
    listId: protocolId,
    isDeleted: { $ne: true }
  }, {
    sort: { ordinal: 1 }
  });
});