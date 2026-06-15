// /packages/workqueues/server/rest.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { WorkQueueItems } from '../lib/collections';
import { get } from 'lodash';

// Helper to convert WorkQueueItem to FHIR Task
function toFhirTask(item) {
  const fhirTask = item.fhirTask || {
    resourceType: 'Task',
    id: item._id
  };
  
  // Map our fields to FHIR
  fhirTask.status = item.status || 'requested';
  fhirTask.intent = item.intent || 'order';
  fhirTask.priority = item.priority || 'routine';
  fhirTask.description = item.text;
  fhirTask.authoredOn = item.createdAt?.toISOString();
  fhirTask.lastModified = item.updatedAt?.toISOString();
  
  if (item.description) {
    fhirTask.note = [{
      text: item.description,
      time: item.createdAt?.toISOString()
    }];
  }
  
  if (item.creator) {
    fhirTask.requester = {
      reference: `Practitioner/${item.creator}`
    };
  }
  
  if (item.assignee) {
    fhirTask.owner = {
      reference: `Practitioner/${item.assignee}`
    };
  }
  
  if (item.patientReference) {
    fhirTask.for = {
      reference: item.patientReference
    };
  }
  
  if (item.encounterReference) {
    fhirTask.encounter = {
      reference: item.encounterReference
    };
  }
  
  if (item.completedAt) {
    fhirTask.executionPeriod = {
      start: item.startedAt?.toISOString() || item.createdAt?.toISOString(),
      end: item.completedAt.toISOString()
    };
  } else if (item.startedAt) {
    fhirTask.executionPeriod = {
      start: item.startedAt.toISOString()
    };
  }
  
  if (item.dueDate) {
    fhirTask.restriction = {
      period: {
        end: item.dueDate.toISOString()
      }
    };
  }
  
  if (item.category) {
    fhirTask.code = {
      coding: [{
        system: 'http://honeycomb.health/workqueue-category',
        code: item.category,
        display: item.category.charAt(0).toUpperCase() + item.category.slice(1)
      }]
    };
  }
  
  return fhirTask;
}

// Helper to convert FHIR Task to WorkQueueItem updates
function fromFhirTask(fhirTask) {
  const updates = {};
  
  if (fhirTask.status) updates.status = fhirTask.status;
  if (fhirTask.priority) updates.priority = fhirTask.priority;
  if (fhirTask.description) updates.text = fhirTask.description;
  
  if (fhirTask.note && fhirTask.note.length > 0) {
    updates.description = fhirTask.note[0].text;
  }
  
  if (fhirTask.for?.reference) {
    updates.patientReference = fhirTask.for.reference;
  }
  
  if (fhirTask.encounter?.reference) {
    updates.encounterReference = fhirTask.encounter.reference;
  }
  
  if (fhirTask.restriction?.period?.end) {
    updates.dueDate = new Date(fhirTask.restriction.period.end);
  }
  
  if (fhirTask.code?.coding?.[0]?.code) {
    updates.category = fhirTask.code.coding[0].code;
  }
  
  // Store the full FHIR resource
  updates.fhirTask = fhirTask;
  
  return updates;
}

// Register REST endpoints
WebApp.connectHandlers.use('/fhir/Task', async (req, res, next) => {
  res.setHeader('Content-Type', 'application/fhir+json');
  
  try {
    // GET /fhir/Task - Search tasks
    if (req.method === 'GET') {
      const query = req.query || {};
      const selector = {};
      
      // Parse search parameters
      if (query.status) selector.status = query.status;
      if (query.priority) selector.priority = query.priority;
      if (query.patient) selector.patientReference = `Patient/${query.patient}`;
      if (query.owner) selector.assignee = query.owner.replace('Practitioner/', '');
      
      const tasks = await WorkQueueItems.find(selector, {
        limit: parseInt(query._count) || 100
      }).fetchAsync();
      
      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: tasks.length,
        entry: tasks.map(task => ({
          fullUrl: `${Meteor.absoluteUrl()}fhir/Task/${task._id}`,
          resource: toFhirTask(task)
        }))
      };
      
      res.end(JSON.stringify(bundle, null, 2));
    }
    
    // POST /fhir/Task - Create task
    else if (req.method === 'POST') {
      const body = [];
      req.on('data', chunk => body.push(chunk));
      req.on('end', async () => {
        const fhirTask = JSON.parse(Buffer.concat(body).toString());
        
        if (fhirTask.resourceType !== 'Task') {
          res.statusCode = 400;
          res.end(JSON.stringify({
            resourceType: 'OperationOutcome',
            issue: [{
              severity: 'error',
              code: 'invalid',
              diagnostics: 'Resource must be of type Task'
            }]
          }));
          return;
        }
        
        const taskData = fromFhirTask(fhirTask);
        taskData.creator = 'fhir-api'; // TODO: Get from auth
        
        const taskId = await WorkQueueItems.insertAsync(taskData);
        const newTask = await WorkQueueItems.findOneAsync(taskId);
        
        res.statusCode = 201;
        res.setHeader('Location', `${Meteor.absoluteUrl()}fhir/Task/${taskId}`);
        res.end(JSON.stringify(toFhirTask(newTask), null, 2));
      });
    }
    
    else {
      res.statusCode = 405;
      res.end(JSON.stringify({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-supported',
          diagnostics: `Method ${req.method} not supported`
        }]
      }));
    }
  } catch (error) {
    console.error('FHIR Task endpoint error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    }));
  }
});

// GET/PUT/DELETE /fhir/Task/:id
WebApp.connectHandlers.use('/fhir/Task/:id', async (req, res, next) => {
  res.setHeader('Content-Type', 'application/fhir+json');
  
  // Extract ID from URL
  const urlParts = req.url.split('/');
  const taskId = urlParts[urlParts.length - 1];
  
  try {
    // GET - Read single task
    if (req.method === 'GET') {
      const task = await WorkQueueItems.findOneAsync(taskId);
      
      if (!task) {
        res.statusCode = 404;
        res.end(JSON.stringify({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: `Task ${taskId} not found`
          }]
        }));
        return;
      }
      
      res.end(JSON.stringify(toFhirTask(task), null, 2));
    }
    
    // PUT - Update task
    else if (req.method === 'PUT') {
      const body = [];
      req.on('data', chunk => body.push(chunk));
      req.on('end', async () => {
        const fhirTask = JSON.parse(Buffer.concat(body).toString());
        
        if (fhirTask.id !== taskId) {
          res.statusCode = 400;
          res.end(JSON.stringify({
            resourceType: 'OperationOutcome',
            issue: [{
              severity: 'error',
              code: 'invalid',
              diagnostics: 'Resource ID must match URL'
            }]
          }));
          return;
        }
        
        const updates = fromFhirTask(fhirTask);
        await WorkQueueItems.updateAsync(taskId, { $set: updates });
        
        const updatedTask = await WorkQueueItems.findOneAsync(taskId);
        res.end(JSON.stringify(toFhirTask(updatedTask), null, 2));
      });
    }
    
    // DELETE - Delete task
    else if (req.method === 'DELETE') {
      await WorkQueueItems.removeAsync(taskId);
      res.statusCode = 204;
      res.end();
    }
    
    else {
      res.statusCode = 405;
      res.end(JSON.stringify({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-supported',
          diagnostics: `Method ${req.method} not supported`
        }]
      }));
    }
  } catch (error) {
    console.error('FHIR Task endpoint error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        diagnostics: error.message
      }]
    }));
  }
});