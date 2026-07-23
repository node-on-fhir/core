// /packages/workqueues/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { WorkQueues, WorkQueueItems } from '../lib/collections';
import { Random } from 'meteor/random';
import { get } from 'lodash';

// -----------------------------------------------------------------------------
// ServerMethods registry (rpc-migration). Auth guards deleted -> requireAuth
// defaults to true (delegating methods completeTask/assignTask/starTask inherit
// the guard from updateTask). phi:true — work-queue items carry patient/encounter
// references. Internal callers pass positional args via Meteor.call, so
// positionalParams preserves the legacy order. this.userId -> context.userId.

Meteor.ServerMethods.define('workqueues.createTask', {
  description: 'Create a work-queue task item and its backing FHIR Task',
  phi: true,
  positionalParams: ['taskData'],
  schemaObject: {
    type: 'object',
    properties: {
      taskData: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string' },
          queueId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          dueDate: {},
          patientId: { type: 'string' },
          patientReference: { type: 'string' },
          encounterId: { type: 'string' },
          encounterReference: { type: 'string' },
          category: { type: 'string' },
          assignee: { type: 'string' }
        },
        required: ['text']
      }
    },
    required: ['taskData']
  }
}, async function(params, context) {
    const taskData = params.taskData;

    const task = {
      text: taskData.text,
      description: taskData.description,
      priority: taskData.priority || 'routine',
      status: 'requested',
      creator: context.userId,
      owner: context.userId,
      assignee: taskData.assignee || context.userId,
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
        reference: `Practitioner/${context.userId}`
      },
      owner: {
        reference: `Practitioner/${taskData.assignee || context.userId}`
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
});

Meteor.ServerMethods.define('workqueues.updateTask', {
  description: 'Update a work-queue task item and sync its FHIR Task status',
  phi: true,
  positionalParams: ['taskId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: {
      taskId: { type: 'string' },
      updates: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string' },
          status: { type: 'string' },
          done: { type: 'boolean' },
          star: { type: 'boolean' },
          tags: { type: 'array', items: { type: 'string' } },
          dueDate: {},
          assignee: { type: 'string' },
          progress: { type: 'number' },
          category: { type: 'string' }
        }
      }
    },
    required: ['taskId', 'updates']
  }
}, async function(params, context) {
    const taskId = params.taskId;
    const updates = params.updates;

    const task = await WorkQueueItems.findOneAsync(taskId);
    if (!task) {
      throw new Meteor.Error('task-not-found', 'Task not found');
    }

    // Check permissions
    if (task.creator !== context.userId && task.assignee !== context.userId && task.owner !== context.userId) {
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
});

Meteor.ServerMethods.define('workqueues.completeTask', {
  description: 'Mark a work-queue task complete',
  phi: true,
  positionalParams: ['taskId'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' } },
    required: ['taskId']
  }
}, async function(params, context) {
    const taskId = params.taskId;

    return await Meteor.callAsync('workqueues.updateTask', taskId, {
      done: true,
      status: 'completed'
    });
});

Meteor.ServerMethods.define('workqueues.assignTask', {
  description: 'Assign a work-queue task to a user',
  phi: true,
  positionalParams: ['taskId', 'userId'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' }, userId: { type: 'string' } },
    required: ['taskId', 'userId']
  }
}, async function(params, context) {
    const taskId = params.taskId;
    const userId = params.userId;

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

    return await Meteor.callAsync('workqueues.updateTask', taskId, updates);
});

Meteor.ServerMethods.define('workqueues.deleteTask', {
  description: 'Delete a work-queue task item',
  phi: true,
  positionalParams: ['taskId'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' } },
    required: ['taskId']
  }
}, async function(params, context) {
    const taskId = params.taskId;

    const task = await WorkQueueItems.findOneAsync(taskId);
    if (!task) {
      throw new Meteor.Error('task-not-found', 'Task not found');
    }

    // Check permissions
    if (task.creator !== context.userId && task.owner !== context.userId) {
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
});

Meteor.ServerMethods.define('workqueues.starTask', {
  description: 'Star or unstar a work-queue task and adjust its priority',
  phi: true,
  positionalParams: ['taskId', 'starred'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' }, starred: { type: 'boolean' } },
    required: ['taskId', 'starred']
  }
}, async function(params, context) {
    const taskId = params.taskId;
    const starred = params.starred;

    return await Meteor.callAsync('workqueues.updateTask', taskId, {
      star: starred,
      priority: starred ? 'urgent' : 'routine'
    });
});

Meteor.ServerMethods.define('workqueues.addNote', {
  description: 'Append a note to a work-queue task',
  phi: true,
  positionalParams: ['taskId', 'noteText'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' }, noteText: { type: 'string' } },
    required: ['taskId', 'noteText']
  }
}, async function(params, context) {
    const taskId = params.taskId;
    const noteText = params.noteText;

    const note = {
      text: noteText,
      authorId: context.userId,
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
});

// Queue management methods
Meteor.ServerMethods.define('workqueues.createQueue', {
  description: 'Create a work queue',
  positionalParams: ['queueData'],
  schemaObject: {
    type: 'object',
    properties: {
      queueData: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          department: { type: 'string' },
          settings: { type: 'object' }
        },
        required: ['name']
      }
    },
    required: ['queueData']
  }
}, async function(params, context) {
    const queueData = params.queueData;

    const queue = {
      name: queueData.name,
      description: queueData.description,
      department: queueData.department,
      active: true,
      settings: queueData.settings || {},
      createdBy: context.userId
    };

    try {
      const queueId = await WorkQueues.insertAsync(queue);
      console.log('Queue created:', queueId);
      return queueId;
    } catch (error) {
      console.error('Error creating queue:', error);
      throw new Meteor.Error('queue-creation-failed', error.message);
    }
});

Meteor.ServerMethods.define('workqueues.updateQueue', {
  description: 'Update a work queue',
  positionalParams: ['queueId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: {
      queueId: { type: 'string' },
      updates: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          department: { type: 'string' },
          active: { type: 'boolean' },
          settings: { type: 'object' }
        }
      }
    },
    required: ['queueId', 'updates']
  }
}, async function(params, context) {
    const queueId = params.queueId;
    const updates = params.updates;

    try {
      const result = await WorkQueues.updateAsync(queueId, { $set: updates });
      console.log('Queue updated:', queueId);
      return result;
    } catch (error) {
      console.error('Error updating queue:', error);
      throw new Meteor.Error('queue-update-failed', error.message);
    }
});