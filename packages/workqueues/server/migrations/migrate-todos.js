// /packages/workqueues/server/migrations/migrate-todos.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { WorkQueueItems } from '../../lib/collections';
import { Random } from 'meteor/random';

// Migration script to convert old Todos to WorkQueueItems
export async function migrateTodos() {
  if (!Meteor.isServer) return;
  
  console.log('Starting migration of Todos to WorkQueueItems...');
  
  // Check if old Todos collection exists
  const Todos = new Mongo.Collection('todos');
  const todoCount = await Todos.countAsync();
  
  if (todoCount === 0) {
    console.log('No todos to migrate');
    return;
  }
  
  console.log(`Found ${todoCount} todos to migrate`);
  
  let migrated = 0;
  let failed = 0;
  
  const todos = await Todos.find({}).fetchAsync();
  
  for (const todo of todos) {
    try {
      // Map old todo structure to new WorkQueueItem
      const workItem = {
        text: todo.text || 'Untitled task',
        description: todo.description || '',
        done: todo.done || false,
        star: todo.star || false,
        priority: todo.star ? 'urgent' : 'routine',
        status: todo.done ? 'completed' : 'requested',
        tags: todo.tags || [],
        owner: todo.owner,
        creator: todo.creator || todo.owner,
        assignee: todo.owner,
        public: todo.public || false,
        image: todo.image,
        createdAt: todo.timestamp || todo.createdAt || new Date(),
        updatedAt: todo.updatedAt || new Date()
      };
      
      // If task is done, set completion date
      if (todo.done && !todo.completedAt) {
        workItem.completedAt = todo.updatedAt || new Date();
      }
      
      // Create FHIR Task resource
      workItem.fhirTask = {
        resourceType: 'Task',
        id: Random.id(),
        status: workItem.status,
        intent: 'order',
        priority: workItem.priority,
        description: workItem.text,
        authoredOn: workItem.createdAt.toISOString()
      };
      
      if (workItem.creator) {
        workItem.fhirTask.requester = {
          reference: `Practitioner/${workItem.creator}`
        };
      }
      
      if (workItem.assignee) {
        workItem.fhirTask.owner = {
          reference: `Practitioner/${workItem.assignee}`
        };
      }
      
      // Check if already migrated (by text and creator)
      const existing = await WorkQueueItems.findOneAsync({
        text: workItem.text,
        creator: workItem.creator,
        createdAt: workItem.createdAt
      });
      
      if (!existing) {
        await WorkQueueItems.insertAsync(workItem);
        migrated++;
        
        if (migrated % 100 === 0) {
          console.log(`Migrated ${migrated} todos...`);
        }
      }
    } catch (error) {
      console.error(`Failed to migrate todo ${todo._id}:`, error);
      failed++;
    }
  }
  
  console.log(`Migration complete: ${migrated} migrated, ${failed} failed`);
  
  return {
    total: todoCount,
    migrated,
    failed
  };
}

// Run migration on startup if needed
Meteor.startup(async function() {
  // Check if migration flag exists
  const migrationKey = 'todos-to-workqueues-v1';
  const Migrations = new Mongo.Collection('migrations');
  
  const migrationRecord = await Migrations.findOneAsync({ _id: migrationKey });
  
  if (!migrationRecord) {
    console.log('Running Todos migration...');
    
    try {
      const result = await migrateTodos();
      
      // Mark migration as complete
      await Migrations.insertAsync({
        _id: migrationKey,
        completedAt: new Date(),
        result
      });
      
      console.log('Todos migration marked as complete');
    } catch (error) {
      console.error('Todos migration failed:', error);
    }
  } else {
    console.log('Todos migration already completed on', migrationRecord.completedAt);
  }
});