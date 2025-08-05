// /packages/workqueues/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { WorkQueues, WorkQueueItems } from '../lib/collections';

// Publish user's tasks
Meteor.publish('workqueues.myTasks', function(options = {}) {
  check(options, {
    limit: Match.Optional(Number),
    status: Match.Optional(Match.OneOf(String, [String])),
    priority: Match.Optional(Match.OneOf(String, [String])),
    showCompleted: Match.Optional(Boolean),
    sortBy: Match.Optional(String),
    sortOrder: Match.Optional(String)
  });

  if (!this.userId) {
    return this.ready();
  }

  const selector = {
    $or: [
      { assignee: this.userId },
      { creator: this.userId },
      { owner: this.userId }
    ]
  };

  // Filter by status
  if (options.status) {
    if (Array.isArray(options.status)) {
      selector.status = { $in: options.status };
    } else {
      selector.status = options.status;
    }
  }

  // Filter by priority
  if (options.priority) {
    if (Array.isArray(options.priority)) {
      selector.priority = { $in: options.priority };
    } else {
      selector.priority = options.priority;
    }
  }

  // Filter completed tasks
  if (options.showCompleted === false) {
    selector.done = { $ne: true };
  }

  const queryOptions = {
    sort: { 
      star: -1,
      priority: -1,
      createdAt: -1 
    },
    limit: options.limit || 100
  };

  return WorkQueueItems.find(selector, queryOptions);
});

// Publish tasks for a specific queue
Meteor.publish('workqueues.queueTasks', function(queueId, options = {}) {
  check(queueId, String);
  check(options, {
    limit: Match.Optional(Number),
    status: Match.Optional(Match.OneOf(String, [String])),
    priority: Match.Optional(Match.OneOf(String, [String])),
    showCompleted: Match.Optional(Boolean),
    sortBy: Match.Optional(String),
    sortOrder: Match.Optional(String)
  });

  if (!this.userId) {
    return this.ready();
  }

  const selector = { queueId };

  if (options.status) {
    selector.status = Array.isArray(options.status) 
      ? { $in: options.status }
      : options.status;
  }

  if (options.showCompleted === false) {
    selector.done = { $ne: true };
  }

  const queryOptions = {
    sort: { 
      star: -1,
      priority: -1,
      createdAt: -1 
    },
    limit: options.limit || 100
  };

  return WorkQueueItems.find(selector, queryOptions);
});

// Publish department tasks
Meteor.publish('workqueues.departmentTasks', function(department, options = {}) {
  check(department, String);
  check(options, {
    limit: Match.Optional(Number),
    includeCompleted: Match.Optional(Boolean)
  });

  if (!this.userId) {
    return this.ready();
  }

  // First get all queues for the department
  const queues = WorkQueues.find({ 
    department, 
    active: true 
  }, { 
    fields: { _id: 1 } 
  }).fetch();

  const queueIds = queues.map(q => q._id);

  const selector = {
    queueId: { $in: queueIds }
  };

  if (!options.includeCompleted) {
    selector.done = { $ne: true };
  }

  const queryOptions = {
    sort: { 
      star: -1,
      priority: -1,
      dueDate: 1,
      createdAt: -1 
    },
    limit: options.limit || 200
  };

  return WorkQueueItems.find(selector, queryOptions);
});

// Publish all active queues
Meteor.publish('workqueues.activeQueues', function() {
  if (!this.userId) {
    return this.ready();
  }

  return WorkQueues.find({ active: true });
});

// Publish user's queues
Meteor.publish('workqueues.myQueues', function() {
  if (!this.userId) {
    return this.ready();
  }

  return WorkQueues.find({ 
    $or: [
      { createdBy: this.userId },
      { 'settings.members': this.userId }
    ],
    active: true 
  });
});

// Publish single task with all details
Meteor.publish('workqueues.taskDetails', function(taskId) {
  check(taskId, String);

  if (!this.userId) {
    return this.ready();
  }

  return WorkQueueItems.find({ _id: taskId });
});

// Publish task statistics
Meteor.publish('workqueues.taskStats', function(options = {}) {
  check(options, {
    queueId: Match.Optional(String),
    department: Match.Optional(String),
    userId: Match.Optional(String),
    dateRange: Match.Optional({
      start: Date,
      end: Date
    })
  });

  if (!this.userId) {
    return this.ready();
  }

  const self = this;
  let initializing = true;

  // This is a custom publication that sends statistics
  const computeStats = async function() {
    const selector = {};
    
    if (options.queueId) {
      selector.queueId = options.queueId;
    }
    
    if (options.userId) {
      selector.assignee = options.userId;
    }
    
    if (options.dateRange) {
      selector.createdAt = {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end
      };
    }

    const stats = {
      _id: 'stats',
      total: await WorkQueueItems.countDocumentsAsync(selector),
      completed: await WorkQueueItems.countDocumentsAsync({ ...selector, done: true }),
      pending: await WorkQueueItems.countDocumentsAsync({ ...selector, done: false, status: 'requested' }),
      inProgress: await WorkQueueItems.countDocumentsAsync({ ...selector, status: 'in-progress' }),
      urgent: await WorkQueueItems.countDocumentsAsync({ ...selector, priority: { $in: ['stat', 'urgent'] } }),
      overdue: await WorkQueueItems.countDocumentsAsync({ 
        ...selector, 
        done: false,
        dueDate: { $lt: new Date() }
      })
    };

    self.added('TaskStatistics', 'stats', stats);
  };

  // Compute initial stats
  computeStats();

  // Recompute when tasks change
  const handle = WorkQueueItems.find(options.queueId ? { queueId: options.queueId } : {}).observeChanges({
    added: function() {
      if (!initializing) {
        computeStats();
      }
    },
    changed: function() {
      computeStats();
    },
    removed: function() {
      computeStats();
    }
  });

  initializing = false;
  self.ready();

  self.onStop(function() {
    handle.stop();
  });
});

// Publish recent tasks (for activity feed)
Meteor.publish('workqueues.recentTasks', function(limit = 20) {
  check(limit, Number);

  if (!this.userId) {
    return this.ready();
  }

  return WorkQueueItems.find({
    $or: [
      { assignee: this.userId },
      { creator: this.userId }
    ]
  }, {
    sort: { updatedAt: -1 },
    limit: limit
  });
});

// Publish overdue tasks
Meteor.publish('workqueues.overdueTasks', function() {
  if (!this.userId) {
    return this.ready();
  }

  return WorkQueueItems.find({
    assignee: this.userId,
    done: false,
    dueDate: { $lt: new Date() }
  }, {
    sort: { dueDate: 1 }
  });
});