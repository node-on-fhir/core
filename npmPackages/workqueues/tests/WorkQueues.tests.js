// /packages/workqueues/tests/WorkQueues.tests.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Mongo } from 'meteor/mongo';
import { assert } from 'chai';
import { WorkQueues, WorkQueueItems } from '../lib/collections';
import { WorkQueueSchema } from '../lib/schemas/WorkQueueSchema';
import { WorkQueueItemSchema } from '../lib/schemas/WorkQueueItemSchema';
import { PublicationCollector } from 'meteor/johanbrook:publication-collector';

if (Meteor.isServer) {
  describe('WorkQueues', function() {
    beforeEach(async function() {
      // Clear collections
      await WorkQueues.removeAsync({});
      await WorkQueueItems.removeAsync({});
    });

    describe('Collections', function() {
      it('should create WorkQueues collection', function() {
        assert.isDefined(WorkQueues);
        assert.instanceOf(WorkQueues, Mongo.Collection);
      });

      it('should create WorkQueueItems collection', function() {
        assert.isDefined(WorkQueueItems);
        assert.instanceOf(WorkQueueItems, Mongo.Collection);
      });
    });

    describe('Schemas', function() {
      it('should validate WorkQueue schema', async function() {
        const validQueue = {
          name: 'Test Queue',
          department: 'radiology',
          active: true
        };

        const queueId = await WorkQueues.insertAsync(validQueue);
        assert.isString(queueId);
        
        const queue = await WorkQueues.findOneAsync(queueId);
        assert.equal(queue.name, 'Test Queue');
        assert.equal(queue.department, 'radiology');
        assert.isTrue(queue.active);
      });

      it('should validate WorkQueueItem schema', async function() {
        const validTask = {
          text: 'Test task',
          priority: 'routine',
          status: 'requested',
          done: false,
          star: false
        };

        const taskId = await WorkQueueItems.insertAsync(validTask);
        assert.isString(taskId);
        
        const task = await WorkQueueItems.findOneAsync(taskId);
        assert.equal(task.text, 'Test task');
        assert.equal(task.priority, 'routine');
        assert.equal(task.status, 'requested');
        assert.isFalse(task.done);
      });

      it('should reject invalid priority', async function() {
        const invalidTask = {
          text: 'Test task',
          priority: 'invalid-priority'
        };

        try {
          await WorkQueueItems.insertAsync(invalidTask);
          assert.fail('Should have thrown validation error');
        } catch (error) {
          assert.include(error.message, 'priority');
        }
      });
    });

    describe('Methods', function() {
      let userId;

      beforeEach(function() {
        userId = Random.id();
      });

      describe('workqueues.createTask', function() {
        it('should create a new task', async function() {
          const taskData = {
            text: 'New task',
            priority: 'urgent',
            category: 'imaging'
          };

          const taskId = await Meteor.callAsync.call(
            { userId },
            'workqueues.createTask',
            taskData
          );

          assert.isString(taskId);
          
          const task = await WorkQueueItems.findOneAsync(taskId);
          assert.equal(task.text, 'New task');
          assert.equal(task.priority, 'urgent');
          assert.equal(task.category, 'imaging');
          assert.equal(task.creator, userId);
          assert.isTrue(task.star); // Should auto-star urgent tasks
        });

        it('should require authentication', async function() {
          const taskData = {
            text: 'New task'
          };

          try {
            await Meteor.callAsync('workqueues.createTask', taskData);
            assert.fail('Should require authentication');
          } catch (error) {
            assert.equal(error.error, 'not-authorized');
          }
        });

        it('should create FHIR Task resource', async function() {
          const taskData = {
            text: 'FHIR task',
            patientReference: 'Patient/123',
            priority: 'stat'
          };

          const taskId = await Meteor.callAsync.call(
            { userId },
            'workqueues.createTask',
            taskData
          );

          const task = await WorkQueueItems.findOneAsync(taskId);
          assert.isDefined(task.fhirTask);
          assert.equal(task.fhirTask.resourceType, 'Task');
          assert.equal(task.fhirTask.priority, 'stat');
          assert.equal(task.fhirTask.for.reference, 'Patient/123');
        });
      });

      describe('workqueues.updateTask', function() {
        let taskId;

        beforeEach(async function() {
          taskId = await WorkQueueItems.insertAsync({
            text: 'Test task',
            creator: userId,
            assignee: userId,
            owner: userId,
            done: false,
            status: 'requested'
          });
        });

        it('should update task fields', async function() {
          const updates = {
            text: 'Updated task',
            priority: 'urgent',
            progress: 50
          };

          await Meteor.callAsync.call(
            { userId },
            'workqueues.updateTask',
            taskId,
            updates
          );

          const task = await WorkQueueItems.findOneAsync(taskId);
          assert.equal(task.text, 'Updated task');
          assert.equal(task.priority, 'urgent');
          assert.equal(task.progress, 50);
        });

        it('should handle completion', async function() {
          await Meteor.callAsync.call(
            { userId },
            'workqueues.updateTask',
            taskId,
            { done: true }
          );

          const task = await WorkQueueItems.findOneAsync(taskId);
          assert.isTrue(task.done);
          assert.equal(task.status, 'completed');
          assert.equal(task.progress, 100);
          assert.isDefined(task.completedAt);
        });

        it('should require permissions', async function() {
          const otherUserId = Random.id();
          
          try {
            await Meteor.callAsync.call(
              { userId: otherUserId },
              'workqueues.updateTask',
              taskId,
              { text: 'Unauthorized update' }
            );
            assert.fail('Should require permissions');
          } catch (error) {
            assert.equal(error.error, 'not-authorized');
          }
        });
      });

      describe('workqueues.assignTask', function() {
        let taskId;

        beforeEach(async function() {
          taskId = await WorkQueueItems.insertAsync({
            text: 'Test task',
            creator: userId,
            assignee: userId,
            owner: userId,
            status: 'requested'
          });
        });

        it('should assign task to user', async function() {
          const newAssignee = Random.id();

          await Meteor.callAsync.call(
            { userId },
            'workqueues.assignTask',
            taskId,
            newAssignee
          );

          const task = await WorkQueueItems.findOneAsync(taskId);
          assert.equal(task.assignee, newAssignee);
          assert.equal(task.status, 'accepted');
        });
      });

      describe('workqueues.createQueue', function() {
        it('should create a new queue', async function() {
          const queueData = {
            name: 'Radiology Queue',
            department: 'radiology',
            settings: {
              autoAssign: true,
              maxItemsPerUser: 10
            }
          };

          const queueId = await Meteor.callAsync.call(
            { userId },
            'workqueues.createQueue',
            queueData
          );

          assert.isString(queueId);
          
          const queue = await WorkQueues.findOneAsync(queueId);
          assert.equal(queue.name, 'Radiology Queue');
          assert.equal(queue.department, 'radiology');
          assert.isTrue(queue.active);
          assert.isTrue(queue.settings.autoAssign);
          assert.equal(queue.createdBy, userId);
        });
      });
    });

    describe('Publications', function() {
      let userId;
      let taskIds;

      beforeEach(async function() {
        userId = Random.id();
        taskIds = [];

        // Create test tasks
        for (let i = 0; i < 5; i++) {
          const taskId = await WorkQueueItems.insertAsync({
            text: `Task ${i}`,
            creator: userId,
            assignee: userId,
            priority: i < 2 ? 'urgent' : 'routine',
            done: i === 4,
            status: i === 4 ? 'completed' : 'requested'
          });
          taskIds.push(taskId);
        }
      });

      it('should publish user tasks', function(done) {
        const collector = new PublicationCollector({ userId });
        
        collector.collect('workqueues.myTasks', {}, (collections) => {
          assert.equal(collections.WorkQueueItems.length, 5);
          done();
        });
      });

      it('should filter by status', function(done) {
        const collector = new PublicationCollector({ userId });
        
        collector.collect('workqueues.myTasks', { status: 'completed' }, (collections) => {
          assert.equal(collections.WorkQueueItems.length, 1);
          assert.equal(collections.WorkQueueItems[0].status, 'completed');
          done();
        });
      });

      it('should filter by priority', function(done) {
        const collector = new PublicationCollector({ userId });
        
        collector.collect('workqueues.myTasks', { priority: 'urgent' }, (collections) => {
          assert.equal(collections.WorkQueueItems.length, 2);
          collections.WorkQueueItems.forEach(task => {
            assert.equal(task.priority, 'urgent');
          });
          done();
        });
      });
    });
  });
}