// /packages/checklist-manifesto/server/methods/lists.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { ChecklistLists, getDefaultListName } from '../../lib/collections/ChecklistLists';
import { ChecklistTasks } from '../../lib/collections/ChecklistTasks';

Meteor.methods({
  /**
   * Create a new list
   * @param {Object} options List properties
   * @returns {String} ID of the new list
   */
  async 'checklist.lists.insert'(options = {}) {
    check(options, {
      title: Match.Maybe(String),
      description: Match.Maybe(String),
      public: Match.Maybe(Boolean),
      mode: Match.Maybe(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a list');
    }

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
        userId: this.userId,
        isDeleted: false,
        isProtocol: false,
        isSystemTemplate: false
      };
      
      const listId = await ChecklistLists.insertAsync(list);
      return listId;
    } catch (error) {
      throw new Meteor.Error('create-list-failed', get(error, 'reason', 'Failed to create list'));
    }
  },

  /**
   * Update an existing list
   * @param {String} listId ID of the list to update
   * @param {Object} updates Fields to update
   * @returns {Number} Number of documents updated
   */
  async 'checklist.lists.update'(listId, updates) {
    check(listId, String);
    check(updates, {
      title: Match.Maybe(String),
      name: Match.Maybe(String), // For backward compatibility
      description: Match.Maybe(String),
      public: Match.Maybe(Boolean),
      status: Match.Maybe(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a list');
    }

    try {
      // Find the list to verify ownership
      const list = await ChecklistLists.findOneAsync(listId);

      if (!list) {
        throw new Meteor.Error('not-found', 'List not found');
      }

      // Verify that the current user owns the list
      if (list.userId !== this.userId) {
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
  },

  /**
   * Remove a list and its tasks
   * @param {String} listId ID of the list to remove
   * @returns {Object} Result with counts of deleted list and tasks
   */
  async 'checklist.lists.remove'(listId) {
    check(listId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to remove a list');
    }

    try {
      // Find the list to verify ownership
      const list = await ChecklistLists.findOneAsync(listId);

      if (!list) {
        throw new Meteor.Error('not-found', 'List not found');
      }

      // Verify that the current user owns the list
      if (list.userId !== this.userId) {
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
  },

  /**
   * Update the incomplete count for a list
   * @param {String} listId ID of the list
   * @returns {Number} Number of documents updated
   */
  async 'checklist.lists.updateIncompleteCount'(listId) {
    check(listId, String);

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
  },

  /**
   * Clone an existing list
   * @param {String} listId ID of the list to clone
   * @param {Object} options Options for the cloned list
   * @returns {String} ID of the cloned list
   */
  async 'checklist.lists.clone'(listId, options = {}) {
    check(listId, String);
    check(options, {
      title: Match.Maybe(String),
      public: Match.Maybe(Boolean)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to clone a list');
    }

    try {
      // Find the source list
      const sourceList = await ChecklistLists.findOneAsync(listId);

      if (!sourceList) {
        throw new Meteor.Error('not-found', 'Source list not found');
      }

      // For a private list, verify that the current user owns it or it's public
      if (!sourceList.public && sourceList.userId !== this.userId) {
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
        userId: this.userId,
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
          requester: this.userId,
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
  }
});