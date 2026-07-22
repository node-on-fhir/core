// /packages/checklist-manifesto/server/methods/tasks.js
//
// rpc-migration (Loop 1): checklist-task methods converted to
// Meteor.ServerMethods.define (global registry). Canonical names keep the
// pre-existing `checklist.tasks.*` namespace (collision-free vs core tasks.*
// and vs the sibling checklist.lists.*/checklist.protocols.* files). Guards
// deleted in favor of requireAuth; check() -> schemaObject; positional args ->
// positionalParams; this.userId -> context.userId. The internal
// Meteor.callAsync('checklist.tasks.updateStatus', ...) site is left unchanged
// (Loop 2); updateStatus's positionalParams cover it. phi:true — Task
// descriptions are patient-facing clinical workflow content.

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';
import { ChecklistTasks } from '../../lib/collections/ChecklistTasks';
import { ChecklistLists } from '../../lib/collections/ChecklistLists';

Meteor.ServerMethods.define('checklist.tasks.insert', {
  description: 'Create a new checklist task, optionally attached to a list',
  phi: true,
  positionalParams: ['description', 'options'],
  schemaObject: {
    type: 'object',
    properties: {
      description: { type: 'string' },
      options: {
        type: 'object',
        properties: {
          priority: { type: 'string' },
          status: { type: 'string' },
          dueDate: {},
          assignedTo: { type: 'string' },
          focusOn: { type: 'string' },
          listId: { type: 'string' }
        }
      }
    },
    required: ['description']
  }
}, async function(params, context){
  const description = get(params, 'description');
  const options = get(params, 'options', {}) || {};

  try {
    // Create a new FHIR Task resource
    const task = {
      resourceType: 'Task',
      status: get(options, 'status', 'requested'),
      description: description,
      authoredOn: new Date(),
      lastModified: new Date(),
      requester: context.userId,
      isDeleted: false
    };

    // Add optional fields if provided
    if (options.priority) {
      set(task, 'priority', options.priority);
    }

    if (options.dueDate) {
      set(task, 'executionPeriod', {
        end: options.dueDate
      });
    }

    if (options.listId) {
      task.listId = options.listId;

      // Update the list's incomplete count
      await ChecklistLists.updateAsync(
        { _id: options.listId },
        {
          $inc: { incompleteCount: 1, taskCount: 1 },
          $set: { lastModified: new Date() }
        }
      );
    }

    // Add optional owner field (task assignee) if provided
    if (options.assignedTo) {
      // Verify the assigned user exists
      const assignedUser = await Meteor.users.findOneAsync({ _id: options.assignedTo });
      if (!assignedUser) {
        throw new Meteor.Error('Invalid user', 'The assigned user does not exist.');
      }
      set(task, 'owner', options.assignedTo);
    }

    const taskId = await ChecklistTasks.insertAsync(task);
    return taskId;
  } catch (error) {
    throw new Meteor.Error('Error inserting task', error.message);
  }
});

Meteor.ServerMethods.define('checklist.tasks.updateStatus', {
  description: 'Set a checklist task status and reconcile its list counts',
  phi: true,
  positionalParams: ['taskId', 'status'],
  schemaObject: {
    type: 'object',
    properties: {
      taskId: { type: 'string' },
      status: { type: 'string' }
    },
    required: ['taskId', 'status']
  }
}, async function(params, context){
  const taskId = get(params, 'taskId');
  const status = get(params, 'status');

  try {
    const task = await ChecklistTasks.findOneAsync(taskId);

    if (!task) {
      throw new Meteor.Error('Task not found.', 'The task you are trying to update does not exist.');
    }

    // Only allow the task requester or owner to update it
    if (task.requester !== context.userId && get(task, 'owner') !== context.userId) {
      throw new Meteor.Error('Access denied.', 'You are not authorized to update this task.');
    }

    // Update list counts if status is changing
    if (task.listId && task.status !== status) {
      const wasCompleted = task.status === 'completed';
      const isCompleted = status === 'completed';

      if (wasCompleted && !isCompleted) {
        // Task uncompleted
        await ChecklistLists.updateAsync(
          { _id: task.listId },
          {
            $inc: { incompleteCount: 1 },
            $set: { lastModified: new Date() }
          }
        );
      } else if (!wasCompleted && isCompleted) {
        // Task completed
        await ChecklistLists.updateAsync(
          { _id: task.listId },
          {
            $inc: { incompleteCount: -1 },
            $set: { lastModified: new Date() }
          }
        );
      }
    }

    const result = await ChecklistTasks.updateAsync(
      { _id: taskId },
      {
        $set: {
          status: status,
          lastModified: new Date()
        }
      }
    );

    return result;
  } catch (error) {
    throw new Meteor.Error('Error updating task status', error.message);
  }
});

Meteor.ServerMethods.define('checklist.tasks.toggleComplete', {
  description: 'Toggle a checklist task between completed and requested',
  phi: true,
  positionalParams: ['taskId'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' } },
    required: ['taskId']
  }
}, async function(params, context){
  const taskId = get(params, 'taskId');

  try {
    const task = await ChecklistTasks.findOneAsync(taskId);

    if (!task) {
      throw new Meteor.Error('Task not found.', 'The task you are trying to update does not exist.');
    }

    // Only allow the task requester or owner to update it
    if (task.requester !== context.userId && get(task, 'owner') !== context.userId) {
      throw new Meteor.Error('Access denied.', 'You are not authorized to update this task.');
    }

    const newStatus = task.status === 'completed' ? 'requested' : 'completed';

    return await Meteor.callAsync('checklist.tasks.updateStatus', taskId, newStatus);
  } catch (error) {
    throw new Meteor.Error('Error toggling task status', error.message);
  }
});

Meteor.ServerMethods.define('checklist.tasks.remove', {
  description: 'Soft-delete a checklist task and reconcile its list counts',
  phi: true,
  positionalParams: ['taskId'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' } },
    required: ['taskId']
  }
}, async function(params, context){
  const taskId = get(params, 'taskId');

  try {
    const task = await ChecklistTasks.findOneAsync(taskId);

    if (!task) {
      throw new Meteor.Error('Task not found.', 'The task you are trying to delete does not exist.');
    }

    // Only the task requester can delete it
    if (task.requester !== context.userId) {
      throw new Meteor.Error('Access denied.', 'You are not authorized to delete this task.');
    }

    // Update list counts if task had a list
    if (task.listId && task.status !== 'completed') {
      await ChecklistLists.updateAsync(
        { _id: task.listId },
        {
          $inc: { incompleteCount: -1, taskCount: -1 },
          $set: { lastModified: new Date() }
        }
      );
    } else if (task.listId) {
      await ChecklistLists.updateAsync(
        { _id: task.listId },
        {
          $inc: { taskCount: -1 },
          $set: { lastModified: new Date() }
        }
      );
    }

    // Soft delete by marking as deleted and setting status to 'entered-in-error'
    const result = await ChecklistTasks.updateAsync(
      { _id: taskId },
      {
        $set: {
          isDeleted: true,
          status: 'entered-in-error',
          lastModified: new Date()
        }
      }
    );

    return result;
  } catch (error) {
    throw new Meteor.Error('Error removing task', error.message);
  }
});

Meteor.ServerMethods.define('checklist.tasks.update', {
  description: 'Update mutable fields of a checklist task',
  phi: true,
  positionalParams: ['taskId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: {
      taskId: { type: 'string' },
      updates: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          priority: { type: 'string' },
          status: { type: 'string' },
          dueDate: {},
          assignedTo: { type: 'string' },
          focusOn: { type: 'string' }
        }
      }
    },
    required: ['taskId']
  }
}, async function(params, context){
  const taskId = get(params, 'taskId');
  const updates = get(params, 'updates', {}) || {};

  try {
    const task = await ChecklistTasks.findOneAsync(taskId);

    if (!task) {
      throw new Meteor.Error('Task not found.', 'The task you are trying to update does not exist.');
    }

    // Only allow the task requester or owner to update it
    if (task.requester !== context.userId && get(task, 'owner') !== context.userId) {
      throw new Meteor.Error('Access denied.', 'You are not authorized to update this task.');
    }

    const updateObj = { lastModified: new Date() };

    if (updates.description) {
      updateObj.description = updates.description;
    }

    if (updates.priority) {
      updateObj.priority = updates.priority;
    }

    if (updates.status) {
      updateObj.status = updates.status;
    }

    if (updates.assignedTo) {
      updateObj.owner = updates.assignedTo;
    }

    if (updates.focusOn) {
      updateObj.focus = updates.focusOn;
    }

    if (updates.dueDate) {
      updateObj['executionPeriod.end'] = updates.dueDate;
    }

    const result = await ChecklistTasks.updateAsync(
      { _id: taskId },
      { $set: updateObj }
    );

    return result;
  } catch (error) {
    throw new Meteor.Error('Error updating task', error.message);
  }
});

Meteor.ServerMethods.define('checklist.tasks.import', {
  description: 'Import a FHIR Task resource into the checklist store (upsert by id)',
  phi: true,
  positionalParams: ['taskResource'],
  schemaObject: {
    type: 'object',
    properties: { taskResource: { type: 'object' } },
    required: ['taskResource']
  }
}, async function(params, context){
  const taskResource = get(params, 'taskResource');

  // Verify it's a Task resource
  if (get(taskResource, 'resourceType') !== 'Task') {
    throw new Meteor.Error('Invalid resource', 'Only Task resources can be imported.');
  }

  try {
    // Prepare the task object for insertion
    const task = {
      // Required FHIR Task properties
      resourceType: 'Task',
      status: taskResource.status || 'requested',

      // Common Task properties
      description: taskResource.description || 'Imported task',
      priority: taskResource.priority || 'routine',

      // Metadata
      authoredOn: taskResource.authoredOn ? new Date(taskResource.authoredOn) : new Date(),
      lastModified: new Date(),

      // Ownership
      requester: context.userId,
      owner: taskResource.owner || context.userId,

      // Additional properties from the imported task
      executionPeriod: {},
      note: taskResource.note || []
    };

    // Handle dates in execution period
    if (taskResource.executionPeriod) {
      if (taskResource.executionPeriod.start) {
        task.executionPeriod.start = new Date(taskResource.executionPeriod.start);
      }

      if (taskResource.executionPeriod.end) {
        task.executionPeriod.end = new Date(taskResource.executionPeriod.end);
      }
    }

    // Use the provided ID if it exists, otherwise MongoDB will generate one
    if (taskResource.id) {
      task.id = taskResource.id;
    }

    // Handle existing task with same ID
    const existingTask = taskResource.id ?
      await ChecklistTasks.findOneAsync({ id: taskResource.id }) : null;

    if (existingTask) {
      // Update existing task
      const taskId = existingTask._id;
      await ChecklistTasks.updateAsync({ _id: taskId }, { $set: task });
      return taskId;
    } else {
      // Insert new task
      return await ChecklistTasks.insertAsync(task);
    }
  } catch (error) {
    console.error('Error importing task:', error);
    throw new Meteor.Error('import-failed', 'Failed to import task: ' + error.message);
  }
});
