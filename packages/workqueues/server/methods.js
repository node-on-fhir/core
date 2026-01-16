// /packages/workqueues/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { WorkQueues, WorkQueueItems } from '../lib/collections';
import { Random } from 'meteor/random';
import { get } from 'lodash';

Meteor.methods({
  'workqueues.createTask': async function(taskData) {
    check(taskData, {
      text: String,
      description: Match.Optional(String),
      priority: Match.Optional(String),
      queueId: Match.Optional(String),
      tags: Match.Optional([String]),
      dueDate: Match.Optional(Date),
      patientId: Match.Optional(String),
      patientReference: Match.Optional(String),
      encounterId: Match.Optional(String),
      encounterReference: Match.Optional(String),
      category: Match.Optional(String),
      assignee: Match.Optional(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create tasks');
    }

    const task = {
      text: taskData.text,
      description: taskData.description,
      priority: taskData.priority || 'routine',
      status: 'requested',
      creator: this.userId,
      owner: this.userId,
      assignee: taskData.assignee || this.userId,
      queueId: taskData.queueId,
      tags: taskData.tags || [],
      dueDate: taskData.dueDate,
      patientId: taskData.patientId,
      patientReference: taskData.patientReference,
      encounterId: taskData.encounterId,
      encounterReference: taskData.encounterReference,
      category: taskData.category,
      done: false,
      star: taskData.priority === 'stat' || taskData.priority === 'urgent',
      public: false,
      progress: 0
    };

    // Create FHIR Task resource
    task.fhirTask = {
      resourceType: 'Task',
      id: Random.id(),
      status: 'requested',
      intent: 'order',
      priority: taskData.priority || 'routine',
      description: taskData.text,
      authoredOn: new Date().toISOString(),
      requester: {
        reference: `Practitioner/${this.userId}`
      },
      owner: {
        reference: `Practitioner/${taskData.assignee || this.userId}`
      }
    };

    if (taskData.patientReference) {
      task.fhirTask.for = {
        reference: taskData.patientReference
      };
    }

    if (taskData.encounterReference) {
      task.fhirTask.encounter = {
        reference: taskData.encounterReference
      };
    }

    try {
      const taskId = await WorkQueueItems.insertAsync(task);
      console.log('Task created:', taskId);
      return taskId;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Meteor.Error('task-creation-failed', error.message);
    }
  },

  'workqueues.updateTask': async function(taskId, updates) {
    check(taskId, String);
    check(updates, {
      text: Match.Optional(String),
      description: Match.Optional(String),
      priority: Match.Optional(String),
      status: Match.Optional(String),
      done: Match.Optional(Boolean),
      star: Match.Optional(Boolean),
      tags: Match.Optional([String]),
      dueDate: Match.Optional(Match.OneOf(Date, null)),
      assignee: Match.Optional(String),
      progress: Match.Optional(Number),
      category: Match.Optional(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update tasks');
    }

    const task = await WorkQueueItems.findOneAsync(taskId);
    if (!task) {
      throw new Meteor.Error('task-not-found', 'Task not found');
    }

    // Check permissions
    if (task.creator !== this.userId && task.assignee !== this.userId && task.owner !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to update this task');
    }

    // Update FHIR Task status if needed
    if (updates.status && task.fhirTask) {
      updates.fhirTask = task.fhirTask;
      updates.fhirTask.status = updates.status;
      updates.fhirTask.lastModified = new Date().toISOString();
    }

    // Handle completion
    if (updates.done === true && !task.done) {
      updates.completedAt = new Date();
      updates.status = 'completed';
      updates.progress = 100;
    } else if (updates.done === false && task.done) {
      updates.completedAt = null;
      updates.status = 'in-progress';
      updates.progress = task.progress || 0;
    }

    // Handle status changes
    if (updates.status === 'in-progress' && !task.startedAt) {
      updates.startedAt = new Date();
    }

    try {
      const result = await WorkQueueItems.updateAsync(taskId, { $set: updates });
      console.log('Task updated:', taskId);
      return result;
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Meteor.Error('task-update-failed', error.message);
    }
  },

  'workqueues.completeTask': async function(taskId) {
    check(taskId, String);
    
    return Meteor.call('workqueues.updateTask', taskId, {
      done: true,
      status: 'completed'
    });
  },

  'workqueues.assignTask': async function(taskId, userId) {
    check(taskId, String);
    check(userId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to assign tasks');
    }

    const task = await WorkQueueItems.findOneAsync(taskId);
    if (!task) {
      throw new Meteor.Error('task-not-found', 'Task not found');
    }

    const updates = {
      assignee: userId,
      status: 'accepted'
    };

    if (task.fhirTask) {
      updates.fhirTask = task.fhirTask;
      updates.fhirTask.owner = {
        reference: `Practitioner/${userId}`
      };
      updates.fhirTask.status = 'accepted';
    }

    return Meteor.call('workqueues.updateTask', taskId, updates);
  },

  'workqueues.deleteTask': async function(taskId) {
    check(taskId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete tasks');
    }

    const task = await WorkQueueItems.findOneAsync(taskId);
    if (!task) {
      throw new Meteor.Error('task-not-found', 'Task not found');
    }

    // Check permissions
    if (task.creator !== this.userId && task.owner !== this.userId) {
      throw new Meteor.Error('not-authorized', 'You do not have permission to delete this task');
    }

    try {
      const result = await WorkQueueItems.removeAsync(taskId);
      console.log('Task deleted:', taskId);
      return result;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Meteor.Error('task-deletion-failed', error.message);
    }
  },

  'workqueues.starTask': async function(taskId, starred) {
    check(taskId, String);
    check(starred, Boolean);

    return Meteor.call('workqueues.updateTask', taskId, {
      star: starred,
      priority: starred ? 'urgent' : 'routine'
    });
  },

  'workqueues.addNote': async function(taskId, noteText) {
    check(taskId, String);
    check(noteText, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to add notes');
    }

    const note = {
      text: noteText,
      authorId: this.userId,
      timestamp: new Date()
    };

    try {
      const result = await WorkQueueItems.updateAsync(taskId, {
        $push: { notes: note }
      });
      console.log('Note added to task:', taskId);
      return result;
    } catch (error) {
      console.error('Error adding note:', error);
      throw new Meteor.Error('note-addition-failed', error.message);
    }
  },

  // Queue management methods
  'workqueues.createQueue': async function(queueData) {
    check(queueData, {
      name: String,
      description: Match.Optional(String),
      department: Match.Optional(String),
      settings: Match.Optional(Object)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create queues');
    }

    const queue = {
      name: queueData.name,
      description: queueData.description,
      department: queueData.department,
      active: true,
      settings: queueData.settings || {},
      createdBy: this.userId
    };

    try {
      const queueId = await WorkQueues.insertAsync(queue);
      console.log('Queue created:', queueId);
      return queueId;
    } catch (error) {
      console.error('Error creating queue:', error);
      throw new Meteor.Error('queue-creation-failed', error.message);
    }
  },

  'workqueues.updateQueue': async function(queueId, updates) {
    check(queueId, String);
    check(updates, {
      name: Match.Optional(String),
      description: Match.Optional(String),
      department: Match.Optional(String),
      active: Match.Optional(Boolean),
      settings: Match.Optional(Object)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update queues');
    }

    try {
      const result = await WorkQueues.updateAsync(queueId, { $set: updates });
      console.log('Queue updated:', queueId);
      return result;
    } catch (error) {
      console.error('Error updating queue:', error);
      throw new Meteor.Error('queue-update-failed', error.message);
    }
  }
});