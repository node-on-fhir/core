// /packages/checklist-manifesto/server/methods/lists.js
//
// rpc-migration (Loop 1): checklist-list methods converted to
// Meteor.ServerMethods.define (global registry — npmPackages use the global,
// no ServerMethods import). Canonical names keep the pre-existing three-segment
// `checklist.lists.*` namespace (already collision-free vs core lists.*/tasks.*
// and vs the sibling checklist.protocols.*/checklist.tasks.* files). `if
// (!this.userId) throw` guards deleted in favor of requireAuth (default true);
// check() -> schemaObject; positional args -> positionalParams;
// this.userId -> context.userId.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { ChecklistLists, getDefaultListName } from '../../lib/collections/ChecklistLists';
import { ChecklistTasks } from '../../lib/collections/ChecklistTasks';

Meteor.ServerMethods.define('checklist.lists.insert', {
  description: 'Create a new checklist list owned by the current user',
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      options: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          public: { type: 'boolean' },
          mode: { type: 'string' }
        }
      }
    }
  }
}, async function(params, context){
  const options = get(params, 'options', {}) || {};

  try {
    const list = {
      resourceType: 'List',
      status: 'active',
      mode: options.mode || 'working',
      title: options.title || getDefaultListName(),
      name: options.title || getDefaultListName(), // For backward compatibility
      description: options.description || '',
      incompleteCount: 0,
      taskCount: 0,
      public: options.public || false,
      createdAt: new Date(),
      lastModified: new Date(),
      userId: context.userId,
      isDeleted: false,
      isProtocol: false,
      isSystemTemplate: false
    };

    const listId = await ChecklistLists.insertAsync(list);
    return listId;
  } catch (error) {
    throw new Meteor.Error('create-list-failed', get(error, 'reason', 'Failed to create list'));
  }
});

Meteor.ServerMethods.define('checklist.lists.update', {
  description: 'Update an existing checklist list owned by the current user',
  positionalParams: ['listId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: {
      listId: { type: 'string' },
      updates: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          public: { type: 'boolean' },
          status: { type: 'string' }
        }
      }
    },
    required: ['listId']
  }
}, async function(params, context){
  const listId = get(params, 'listId');
  const updates = get(params, 'updates', {}) || {};

  try {
    // Find the list to verify ownership
    const list = await ChecklistLists.findOneAsync(listId);

    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }

    // Verify that the current user owns the list
    if (list.userId !== context.userId) {
      throw new Meteor.Error('not-authorized', 'You can only modify your own lists');
    }

    const updateData = {
      lastModified: new Date()
    };

    // Only set fields that were provided
    if (updates.title) {
      updateData.title = updates.title;
      // Keep name in sync for backward compatibility
      updateData.name = updates.title;
    } else if (updates.name) {
      updateData.name = updates.name;
      updateData.title = updates.name;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.public !== undefined) {
      updateData.public = updates.public;
    }

    if (updates.status) {
      updateData.status = updates.status;
    }

    const result = await ChecklistLists.updateAsync(
      { _id: listId },
      { $set: updateData }
    );

    return result;
  } catch (error) {
    throw new Meteor.Error('update-list-failed', get(error, 'reason', 'Failed to update list'));
  }
});

Meteor.ServerMethods.define('checklist.lists.remove', {
  description: 'Soft-delete a checklist list and mark its tasks entered-in-error',
  positionalParams: ['listId'],
  schemaObject: {
    type: 'object',
    properties: { listId: { type: 'string' } },
    required: ['listId']
  }
}, async function(params, context){
  const listId = get(params, 'listId');

  try {
    // Find the list to verify ownership
    const list = await ChecklistLists.findOneAsync(listId);

    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }

    // Verify that the current user owns the list
    if (list.userId !== context.userId) {
      throw new Meteor.Error('not-authorized', 'You can only remove your own lists');
    }

    // Soft delete the list and all its tasks
    await ChecklistLists.updateAsync(
      { _id: listId },
      {
        $set: {
          isDeleted: true,
          status: 'entered-in-error',
          lastModified: new Date()
        }
      }
    );

    // Mark all tasks in this list as deleted
    const tasksResult = await ChecklistTasks.updateAsync(
      {
        listId: listId,
        isDeleted: { $ne: true }
      },
      {
        $set: {
          isDeleted: true,
          status: 'entered-in-error',
          lastModified: new Date()
        }
      },
      { multi: true }
    );

    return {
      list: 1,
      tasks: tasksResult
    };
  } catch (error) {
    throw new Meteor.Error('remove-list-failed', get(error, 'reason', 'Failed to remove list'));
  }
});

Meteor.ServerMethods.define('checklist.lists.updateIncompleteCount', {
  description: 'Recompute the incomplete/total task counts for a checklist list',
  // Historically had NO auth guard (a bookkeeping recompute callable during
  // reactive UI updates). Kept public to preserve that behavior.
  requireAuth: false,
  positionalParams: ['listId'],
  schemaObject: {
    type: 'object',
    properties: { listId: { type: 'string' } },
    required: ['listId']
  }
}, async function(params, context){
  const listId = get(params, 'listId');

  try {
    // Find the list to verify it exists
    const list = await ChecklistLists.findOneAsync(listId);

    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }

    // Count incomplete tasks
    const incompleteCount = await ChecklistTasks.countAsync({
      listId: listId,
      status: { $ne: 'completed' },
      isDeleted: { $ne: true }
    });

    // Count total tasks
    const taskCount = await ChecklistTasks.countAsync({
      listId: listId,
      isDeleted: { $ne: true }
    });

    // Update the counts
    const result = await ChecklistLists.updateAsync(
      { _id: listId },
      {
        $set: {
          incompleteCount: incompleteCount,
          taskCount: taskCount,
          lastModified: new Date()
        }
      }
    );

    return result;
  } catch (error) {
    throw new Meteor.Error('update-count-failed', get(error, 'reason', 'Failed to update counts'));
  }
});

Meteor.ServerMethods.define('checklist.lists.clone', {
  description: 'Clone an existing (owned or public) checklist list and its tasks',
  positionalParams: ['listId', 'options'],
  schemaObject: {
    type: 'object',
    properties: {
      listId: { type: 'string' },
      options: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          public: { type: 'boolean' }
        }
      }
    },
    required: ['listId']
  }
}, async function(params, context){
  const listId = get(params, 'listId');
  const options = get(params, 'options', {}) || {};

  try {
    // Find the source list
    const sourceList = await ChecklistLists.findOneAsync(listId);

    if (!sourceList) {
      throw new Meteor.Error('not-found', 'Source list not found');
    }

    // For a private list, verify that the current user owns it or it's public
    if (!sourceList.public && sourceList.userId !== context.userId) {
      throw new Meteor.Error('not-authorized', 'You can only clone your own or public lists');
    }

    // Create a new list based on the source
    const newList = {
      resourceType: 'List',
      status: 'active',
      mode: 'working',
      title: options.title || `${sourceList.title || sourceList.name} (Copy)`,
      name: options.title || `${sourceList.title || sourceList.name} (Copy)`,
      description: sourceList.description || '',
      incompleteCount: 0,
      taskCount: 0,
      public: options.public !== undefined ? options.public : false,
      createdAt: new Date(),
      lastModified: new Date(),
      userId: context.userId,
      isDeleted: false,
      isProtocol: false,
      source: listId // Reference to the original list
    };

    const newListId = await ChecklistLists.insertAsync(newList);

    // Copy all tasks from the source list
    const tasks = await ChecklistTasks.find({
      listId: listId,
      isDeleted: { $ne: true }
    }).fetchAsync();

    let incompleteCount = 0;

    // Insert cloned tasks
    for (const task of tasks) {
      const newTask = {
        resourceType: 'Task',
        status: sourceList.isProtocol ? 'requested' : task.status,
        description: task.description,
        priority: task.priority || 'routine',
        authoredOn: new Date(),
        lastModified: new Date(),
        requester: context.userId,
        listId: newListId,
        isDeleted: false,
        ordinal: task.ordinal,
        source: task._id // Reference to the original task
      };

      if (newTask.status !== 'completed') {
        incompleteCount++;
      }

      // Copy execution period if present
      if (get(task, 'executionPeriod')) {
        newTask.executionPeriod = {};

        if (get(task, 'executionPeriod.start')) {
          newTask.executionPeriod.start = new Date();
        }

        if (get(task, 'executionPeriod.end')) {
          // If cloning from a protocol, set due date a week from now
          if (sourceList.isProtocol) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            newTask.executionPeriod.end = dueDate;
          } else {
            newTask.executionPeriod.end = get(task, 'executionPeriod.end');
          }
        }
      }

      await ChecklistTasks.insertAsync(newTask);
    }

    // Update the task counts
    await ChecklistLists.updateAsync(
      { _id: newListId },
      {
        $set: {
          incompleteCount: incompleteCount,
          taskCount: tasks.length
        }
      }
    );

    return newListId;
  } catch (error) {
    throw new Meteor.Error('clone-list-failed', get(error, 'reason', 'Failed to clone list'));
  }
});
