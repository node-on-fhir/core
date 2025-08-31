// /imports/methods/tasks.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Mongo } from 'meteor/mongo';
import moment from 'moment';
import { get, set, has, cloneDeep, isObject, uniq } from 'lodash';

import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

import { FhirUtilities } from '../lib/FhirUtilities';

if(Meteor.isServer){
  Meteor.methods({
    createTask: async function(taskData) {
      console.log('[createTask] Method called', taskData);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to create tasks');
      }
      
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
        console.log('[createTask] Using MongoDB ObjectID (as hex string):', cleanTask._id);
      } else {
        cleanTask._id = cleanTask.id;
        console.log('[createTask] Using Meteor string ID:', cleanTask._id);
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
        const user = await Meteor.users.findOneAsync(this.userId);
        if (user) {
          cleanTask.requester = {
            reference: `Practitioner/${this.userId}`,
            display: user.username || `${get(user, 'profile.name.given[0]', '')} ${get(user, 'profile.name.family', '')}`.trim()
          };
        }
      }
      
      console.log('[createTask] Clean task ready for insert:', cleanTask);
      
      // Insert the task
      try {
        const taskId = await Tasks.insertAsync(cleanTask);
        console.log('[createTask] Task created with ID:', taskId);
        return taskId;
      } catch (error) {
        console.error('[createTask] Error creating task:', error);
        throw new Meteor.Error('insert-failed', error.message);
      }
    },
    
    updateTask: async function(taskId, taskData) {
      console.log('[updateTask] Method called', taskId, taskData);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to update tasks');
      }
      
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
      
      console.log('[updateTask] Update data:', updateData);
      
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
        console.log('[updateTask] Task updated:', result);
        return result;
      } catch (error) {
        console.error('[updateTask] Error updating task:', error);
        throw new Meteor.Error('update-failed', error.message);
      }
    },
    
    removeTask: async function(taskId) {
      console.log('[removeTask] Method called', taskId);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to remove tasks');
      }
      
      // Check task exists
      const task = await Tasks.findOneAsync({_id: taskId});
      if (!task) {
        throw new Meteor.Error('not-found', 'Task not found');
      }
      
      // Hard delete to match other resource implementations
      try {
        const result = await Tasks.removeAsync({ _id: taskId });
        console.log('[removeTask] Task removed:', result);
        
        return result;
      } catch (error) {
        console.error('[removeTask] Error removing task:', error);
        throw new Meteor.Error('remove-failed', error.message);
      }
    },
    
    getTask: async function(taskId) {
      console.log('[getTask] Method called', taskId);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to view tasks');
      }
      
      const task = await Tasks.findOneAsync({_id: taskId});
      if (!task) {
        throw new Meteor.Error('not-found', 'Task not found');
      }
      
      return task;
    },
    
    searchTasks: async function(searchOptions = {}) {
      console.log('[searchTasks] Method called', searchOptions);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to search tasks');
      }
      
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
      
      console.log('[searchTasks] Query:', query, 'Options:', options);
      
      return Tasks.findAsync(query, options).then(cursor => cursor.fetch());
    }
  });
}