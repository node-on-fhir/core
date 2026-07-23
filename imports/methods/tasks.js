// /imports/methods/tasks.js
//
// rpc migration (inline template): `if (!this.userId) throw` guards deleted in
// favor of requireAuth (the default), positional signatures mapped via
// positionalParams, this.userId -> context.userId, console.log -> context.log.
// All five legacy methods were auth-guarded, so requireAuth (default true)
// preserves the pre-migration posture exactly.

import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { Random } from 'meteor/random';
import { Mongo } from 'meteor/mongo';
import moment from 'moment';
import { get, set, has, cloneDeep, isObject, uniq } from 'lodash';

import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

import { FhirUtilities } from '../lib/FhirUtilities';

if(Meteor.isServer){
  ServerMethods.define('tasks.create', {
    description: 'Create a FHIR Task record, defaulting requester to the current user',
    aliases: ['createTask'],
    phi: true,
    schemaObject: { type: 'object' }
  }, async function(params, context) {
      const taskData = params;
      context.log.debug('tasks.create called', { taskData });

      let cleanTask = {};

      if (taskData) {
        cleanTask = cloneDeep(taskData);
      }

      // Set resourceType
      cleanTask.resourceType = 'Task';

      // Generate ID if not provided
      if (!cleanTask.id) {
        cleanTask.id = Random.id();
      }

      // Set _id based on environment variable for consistent sorting with existing data
      if (process.env.USE_MONGO_OBJECTID) {
        const objectId = new Mongo.ObjectID();
        cleanTask._id = objectId.toHexString();
        context.log.debug('tasks.create using MongoDB ObjectID (as hex string)', { _id: cleanTask._id });
      } else {
        cleanTask._id = cleanTask.id;
        context.log.debug('tasks.create using Meteor string ID', { _id: cleanTask._id });
      }

      // Set metadata
      cleanTask.meta = {
        versionId: '1',
        lastUpdated: new Date()
      };

      // Ensure required fields have proper FHIR structure

      // Status - required
      if (!cleanTask.status) {
        cleanTask.status = 'requested';
      }

      // Intent - required
      if (!cleanTask.intent) {
        cleanTask.intent = 'order';
      }

      // Priority
      if (!cleanTask.priority) {
        cleanTask.priority = 'routine';
      }

      // Code as CodeableConcept
      if (taskData.code && typeof taskData.code === 'string') {
        cleanTask.code = {
          coding: [{
            system: 'http://snomed.info/sct',
            code: taskData.code,
            display: taskData.codeDisplay || taskData.code
          }],
          text: taskData.codeDisplay || taskData.code
        };
      }

      // Business status as CodeableConcept
      if (taskData.businessStatus && typeof taskData.businessStatus === 'string') {
        cleanTask.businessStatus = {
          coding: [{
            code: taskData.businessStatus,
            display: taskData.businessStatusDisplay || taskData.businessStatus
          }],
          text: taskData.businessStatusDisplay || taskData.businessStatus
        };
      }

      // Set dates
      if (!cleanTask.authoredOn) {
        cleanTask.authoredOn = new Date().toISOString();
      }

      if (!cleanTask.lastModified) {
        cleanTask.lastModified = new Date().toISOString();
      }

      // Handle references - ensure they exist and have proper format
      if (taskData.for) {
        cleanTask.for = taskData.for;

        // If we have display but no reference, try to find patient
        if (cleanTask.for.display && !cleanTask.for.reference) {
          const patientName = cleanTask.for.display;
          const patient = await Patients.findOneAsync({
            $or: [
              { 'name.0.text': patientName },
              { 'name.0.family': patientName.split(' ').pop() },
              { 'name.0.given.0': patientName.split(' ')[0] }
            ]
          });

          if (patient) {
            cleanTask.for.reference = `Patient/${patient.id || patient._id}`;
          }
        }
      }

      // Set requester from current user if not provided
      if (!cleanTask.requester || !cleanTask.requester.reference) {
        const user = await Meteor.users.findOneAsync(context.userId);
        if (user) {
          cleanTask.requester = {
            reference: `Practitioner/${context.userId}`,
            display: user.username || `${get(user, 'profile.name.given[0]', '')} ${get(user, 'profile.name.family', '')}`.trim()
          };
        }
      }

      context.log.debug('tasks.create clean task ready for insert', { cleanTask });

      // Insert the task
      try {
        const taskId = await Tasks.insertAsync(cleanTask);
        context.log.info('Task created', { taskId });
        return taskId;
      } catch (error) {
        context.log.error('Error creating task', { error: error.message });
        throw new Meteor.Error('insert-failed', error.message);
      }
  });

  ServerMethods.define('tasks.update', {
    description: 'Update an existing FHIR Task record, incrementing its version',
    aliases: ['updateTask'],
    phi: true,
    positionalParams: ['taskId', 'taskData'],
    schemaObject: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        taskData: { type: 'object' }
      },
      required: ['taskId', 'taskData']
    }
  }, async function(params, context) {
      const taskId = get(params, 'taskId');
      const taskData = get(params, 'taskData');
      context.log.debug('tasks.update called', { taskId, taskData });

      // Check task exists
      const existingTask = await Tasks.findOneAsync({_id: taskId});
      if (!existingTask) {
        throw new Meteor.Error('not-found', 'Task not found');
      }

      let updateData = cloneDeep(taskData);

      // Update metadata
      updateData.meta = existingTask.meta || {};
      updateData.meta.versionId = String(parseInt(updateData.meta.versionId || '0') + 1);
      updateData.meta.lastUpdated = new Date();

      // Update lastModified
      updateData.lastModified = new Date().toISOString();

      // Handle CodeableConcept conversions like in create
      if (taskData.code && typeof taskData.code === 'string') {
        updateData.code = {
          coding: [{
            system: 'http://snomed.info/sct',
            code: taskData.code,
            display: taskData.codeDisplay || taskData.code
          }],
          text: taskData.codeDisplay || taskData.code
        };
      }

      if (taskData.businessStatus && typeof taskData.businessStatus === 'string') {
        updateData.businessStatus = {
          coding: [{
            code: taskData.businessStatus,
            display: taskData.businessStatusDisplay || taskData.businessStatus
          }],
          text: taskData.businessStatusDisplay || taskData.businessStatus
        };
      }

      context.log.debug('tasks.update update data', { updateData });

      // Preserve critical fields from existing task
      if (!updateData.for && existingTask.for) {
        updateData.for = existingTask.for;
      }

      // Ensure we have the required fields
      updateData.resourceType = 'Task';
      updateData.id = existingTask.id;
      updateData._id = existingTask._id;

      // Update the task
      try {
        const result = await Tasks.updateAsync(
          { _id: taskId },
          { $set: updateData }
        );
        context.log.info('Task updated', { taskId, result });
        return result;
      } catch (error) {
        context.log.error('Error updating task', { error: error.message });
        throw new Meteor.Error('update-failed', error.message);
      }
  });

  ServerMethods.define('tasks.remove', {
    description: 'Delete a FHIR Task record',
    aliases: ['removeTask'],
    phi: true,
    positionalParams: ['taskId'],
    schemaObject: {
      type: 'object',
      properties: { taskId: { type: 'string' } },
      required: ['taskId']
    }
  }, async function(params, context) {
      const taskId = get(params, 'taskId');
      context.log.debug('tasks.remove called', { taskId });

      // Check task exists
      const task = await Tasks.findOneAsync({_id: taskId});
      if (!task) {
        throw new Meteor.Error('not-found', 'Task not found');
      }

      // Hard delete to match other resource implementations
      try {
        const result = await Tasks.removeAsync({ _id: taskId });
        context.log.info('Task removed', { taskId, result });

        return result;
      } catch (error) {
        context.log.error('Error removing task', { error: error.message });
        throw new Meteor.Error('remove-failed', error.message);
      }
  });

  ServerMethods.define('tasks.get', {
    description: 'Fetch a single FHIR Task record by id',
    aliases: ['getTask'],
    phi: true,
    positionalParams: ['taskId'],
    schemaObject: {
      type: 'object',
      properties: { taskId: { type: 'string' } },
      required: ['taskId']
    }
  }, async function(params, context) {
      const taskId = get(params, 'taskId');
      context.log.debug('tasks.get called', { taskId });

      const task = await Tasks.findOneAsync({_id: taskId});
      if (!task) {
        throw new Meteor.Error('not-found', 'Task not found');
      }

      return task;
  });

  ServerMethods.define('tasks.search', {
    description: 'Search FHIR Task records by patient, status, and free text',
    aliases: ['searchTasks'],
    phi: true,
    schemaObject: {
      type: 'object',
      properties: {
        patient: { type: 'string' },
        status: { type: 'string' },
        text: { type: 'string' },
        limit: { type: 'number' }
      }
    }
  }, async function(params, context) {
      const searchOptions = params || {};
      context.log.debug('tasks.search called', { searchOptions });

      let query = {};

      // Add patient filter if provided
      if (searchOptions.patient) {
        query = FhirUtilities.addPatientFilterToQuery(searchOptions.patient, query);
      }

      // Add status filter
      if (searchOptions.status) {
        query.status = searchOptions.status;
      }

      // Add text search
      if (searchOptions.text) {
        query.$or = [
          { 'description': { $regex: searchOptions.text, $options: 'i' } },
          { 'code.text': { $regex: searchOptions.text, $options: 'i' } },
          { 'code.coding.display': { $regex: searchOptions.text, $options: 'i' } }
        ];
      }

      const options = {
        sort: { authoredOn: -1 },
        limit: searchOptions.limit || 100
      };

      context.log.debug('tasks.search query', { query, options });

      return Tasks.findAsync(query, options).then(cursor => cursor.fetch());
  });
}
