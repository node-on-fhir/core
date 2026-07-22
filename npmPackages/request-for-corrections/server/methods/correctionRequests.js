// packages/request-for-corrections/server/methods/correctionRequests.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import moment from 'moment';

import { CorrectionTasks } from '../../lib/collections/CorrectionTasks';
import { CorrectionCommunications } from '../../lib/collections/CorrectionCommunications';
import { CorrectionWorkflow } from '../../lib/CorrectionWorkflow';
import { BUSINESS_STATUSES } from '../../lib/constants/businessStatuses';

// ServerMethods registry (rpc migration). All methods already carry canonical
// dotted names (no rename → no aliases). The `if (!this.userId) throw` guards
// are deleted in favor of the requireAuth default (true). this.userId ->
// context.userId. phi:true throughout — these read/write patient correction
// Tasks and Communications. Data was passed as a single named object, so no
// positionalParams needed except where the legacy signature was positional
// (correctionTasks.updateStatus). Uses the global Meteor.ServerMethods per the
// npmPackages exemplar.
Meteor.ServerMethods.define('correctionRequests.create', {
  description: 'Create a patient correction/amendment request Task plus its initial Communication',
  phi: true,
  positionalParams: ['data'],
  schemaObject: {
    type: 'object',
    properties: {
      patientId: { type: 'string' },
      communicationData: { type: 'object' },
      requestType: { type: 'string', enum: ['correction', 'amendment'] },
      endpoint: { type: 'string' }
    },
    required: ['patientId', 'communicationData', 'requestType']
  }
}, async function(params, context){
    const data = params;
    const { patientId, communicationData, requestType, endpoint } = data;

    console.log('[correctionRequests.create] Starting creation with data:', {
      patientId,
      requestType,
      endpoint,
      userId: context.userId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Create the initial communication
      communicationData._id = Random.id();
      communicationData.sent = new Date();
      communicationData.meta = {
        lastUpdated: new Date()
      };
      
      const communicationId = await CorrectionCommunications.insertAsync(communicationData);
      console.log('[correctionRequests.create] Communication created with ID:', communicationId);
      
      // Get CMO reference from settings for assignment
      const cmoReference = get(Meteor, 'settings.private.chiefMedicalOfficer.reference') ||
                           get(Meteor, 'settings.private.cmo.reference') ||
                           get(Meteor, 'settings.private.defaultPractitioner.reference');
      
      // If no reference format provided, construct it from ID
      let cmoAssignment;
      if (cmoReference) {
        cmoAssignment = cmoReference;
      } else {
        const cmoId = get(Meteor, 'settings.private.chiefMedicalOfficer.id') ||
                      get(Meteor, 'settings.private.cmo.id') ||
                      get(Meteor, 'settings.private.defaultPractitioner') ||
                      'chief-medical-officer';
        // Default to PractitionerRole if not specified
        cmoAssignment = `PractitionerRole/${cmoId}`;
      }
      
      console.log('[correctionRequests.create] Assigning to CMO:', cmoAssignment);
      
      // Create the task to track this request
      const task = {
        _id: Random.id(),
        resourceType: 'Task',
        status: 'ready',
        intent: 'order',
        priority: communicationData.priority || 'routine',
        code: {
          coding: [{
            system: 'http://fhir.org/guides/patient-correction/CodeSystem/PatientCorrectionTaskTypes',
            code: 'medRecCxReq',
            display: 'Correct or Amend Medical Record'
          }, {
            system: 'http://honeycomb.ai/task-types',
            code: 'patient-correction',
            display: 'Patient Correction Request'
          }]
        },
        description: `Patient correction request - ${requestType}`,
        for: {
          reference: `Patient/${patientId}`,
          display: get(communicationData, 'subject.display', '')
        },
        authoredOn: new Date(),
        lastModified: new Date(),
        requester: {
          reference: `Patient/${patientId}`,
          display: get(communicationData, 'subject.display', '')
        },
        owner: {
          reference: cmoAssignment,
          display: 'Chief Medical Officer'
        },
        performer: [{
          reference: cmoAssignment,
          display: 'Chief Medical Officer'
        }],
        businessStatus: BUSINESS_STATUSES.queued,
        input: [{
          type: {
            text: 'Correction Request Communication'
          },
          valueReference: {
            reference: `Communication/${communicationId}`
          }
        }],
        meta: {
          lastUpdated: new Date()
        }
      };
      
      // If endpoint provided, add it to task metadata
      if (endpoint) {
        task.extension = [{
          url: 'http://honeycomb.ai/fhir/extension/submission-endpoint',
          valueString: endpoint
        }];
        console.log('[correctionRequests.create] Added endpoint to task:', endpoint);
      }
      
      // Insert into main Tasks collection if available, otherwise use CorrectionTasks
      let taskId;
      const Tasks = Meteor.Collections?.Tasks || global.Collections?.Tasks;
      
      if (Tasks) {
        // Use main Tasks collection
        console.log('[correctionRequests.create] Using main Tasks collection');
        taskId = await Tasks.insertAsync(task);
      } else {
        // Fallback to CorrectionTasks
        console.log('[correctionRequests.create] Using CorrectionTasks collection');
        taskId = await CorrectionTasks.insertAsync(task);
      }
      console.log('[correctionRequests.create] Task created with ID:', taskId);
      
      // Update the communication to reference the task
      await CorrectionCommunications.updateAsync(communicationId, {
        $set: {
          'about': [{
            reference: `Task/${taskId}`
          }]
        }
      });
      
      console.log('[correctionRequests.create] Successfully created correction request:', {
        taskId,
        communicationId,
        endpoint,
        timestamp: new Date().toISOString()
      });
      
      // If endpoint provided, simulate submission (in production, would actually POST to endpoint)
      if (endpoint) {
        console.log('[correctionRequests.create] Would submit to endpoint:', endpoint);
        // TODO: Implement actual FHIR submission to external endpoint
        // const response = await fetch(endpoint, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/fhir+json' },
        //   body: JSON.stringify(task)
        // });
      }
      
      return {
        success: true,
        taskId: taskId,
        communicationId: communicationId
      };
      
    } catch (error) {
      console.error('[correctionRequests.create] Error creating correction request:', error);
      throw new Meteor.Error('create-failed', 'Failed to create correction request', error.message);
    }
});

Meteor.ServerMethods.define('correctionRequests.respond', {
  description: 'Record a patient response (additional info or a disagreement) to a correction request',
  phi: true,
  positionalParams: ['data'],
  schemaObject: {
    type: 'object',
    properties: {
      taskId: { type: 'string' },
      message: { type: 'string' },
      responseType: { type: 'string', enum: ['info', 'disagreement'] }
    },
    required: ['taskId', 'message', 'responseType']
  }
}, async function(params, context){
    const data = params;
    const { taskId, message, responseType } = data;

    console.log('[correctionRequests.respond] Processing response:', {
      taskId,
      responseType,
      userId: context.userId,
      timestamp: new Date().toISOString()
    });
    
    try {
      const task = await CorrectionTasks.findOneAsync(taskId);
      if (!task) {
        throw new Meteor.Error('not-found', 'Task not found');
      }
      
      // Get the initial communication to reference it
      const initialComm = CorrectionTasks.getInitialRequest(task);
      
      // Create response communication
      const communication = {
        _id: Random.id(),
        resourceType: 'Communication',
        status: 'completed',
        category: [{
          coding: [{
            system: 'http://fhir.org/guides/patient-correction/CodeSystem/PatientCorrectionCommunicationTypes',
            code: responseType === 'disagreement' ? 'medRecCxDenialDisagree' : 'medRecCxReq',
            display: responseType === 'disagreement' ? 'Disagreement with Denial' : 'Correction Request'
          }]
        }],
        subject: task.for,
        about: [{
          reference: `Task/${taskId}`
        }],
        sent: new Date(),
        sender: {
          reference: get(task, 'for.reference') // Patient
        },
        recipient: [{
          reference: get(task, 'owner.reference') // Provider
        }],
        payload: [{
          contentString: message
        }],
        meta: {
          lastUpdated: new Date()
        }
      };
      
      // If this is a response to initial request, reference it
      if (initialComm && responseType !== 'disagreement') {
        communication.inResponseTo = [{
          reference: `Communication/${initialComm._id}`
        }];
      }
      
      const commId = await CorrectionCommunications.insertAsync(communication);
      
      // Handle disagreement - create new task
      if (responseType === 'disagreement') {
        const disagreementTask = {
          _id: Random.id(),
          resourceType: 'Task',
          status: 'ready',
          intent: 'order',
          priority: 'routine',
          code: {
            coding: [{
              system: 'http://fhir.org/guides/patient-correction/CodeSystem/PatientCorrectionTaskTypes',
              code: 'medRecCxDenialDisagree',
              display: 'Log Disagreement with Correction Denial'
            }]
          },
          description: 'Patient disagreement with correction denial',
          for: task.for,
          authoredOn: new Date(),
          lastModified: new Date(),
          requester: task.for,
          owner: task.owner,
          businessStatus: BUSINESS_STATUSES.queued,
          reasonReference: {
            reference: `Task/${taskId}`
          },
          input: [{
            type: {
              text: 'Disagreement Communication'
            },
            valueReference: {
              reference: `Communication/${commId}`
            }
          }],
          meta: {
            lastUpdated: new Date()
          }
        };
        
        const disagreementTaskId = await CorrectionTasks.insertAsync(disagreementTask);
        
        // Update original task to completed status
        await CorrectionTasks.updateAsync(taskId, {
          $set: {
            status: 'completed',
            businessStatus: BUSINESS_STATUSES['disagreement-logged'],
            'meta.lastUpdated': new Date()
          }
        });
        
        return {
          success: true,
          taskId: disagreementTaskId,
          communicationId: commId
        };
      }
      
      // For regular info response, update task status if needed
      const currentBusinessStatus = get(task, 'businessStatus.coding[0].code');
      if (currentBusinessStatus === 'waiting-for-information') {
        await CorrectionTasks.updateAsync(taskId, {
          $set: {
            businessStatus: BUSINESS_STATUSES['in-review'],
            'meta.lastUpdated': new Date()
          }
        });
      }
      
      return {
        success: true,
        communicationId: commId
      };
      
    } catch (error) {
      console.error('Error responding to correction request:', error);
      throw new Meteor.Error('response-failed', 'Failed to submit response', error.message);
    }
});

Meteor.ServerMethods.define('correctionCommunications.create', {
  description: 'Insert a correction-workflow Communication resource',
  phi: true,
  positionalParams: ['communicationData'],
  schemaObject: { type: 'object' }
}, async function(params, context){
    const communicationData = params;
    try {
      communicationData._id = Random.id();
      communicationData.meta = {
        lastUpdated: new Date()
      };
      
      const id = await CorrectionCommunications.insertAsync(communicationData);
      console.log('[correctionCommunications.create] Created communication:', id);
      
      return id;
    } catch (error) {
      console.error('[correctionCommunications.create] Error:', error);
      throw new Meteor.Error('create-failed', 'Failed to create communication', error.message);
    }
});

Meteor.ServerMethods.define('correctionTasks.updateStatus', {
  description: 'Update the status/fields of a correction Task by id',
  phi: true,
  positionalParams: ['taskId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' }, updates: { type: 'object' } },
    required: ['taskId', 'updates']
  }
}, async function(params, context){
    const taskId = get(params, 'taskId');
    const updates = get(params, 'updates');
    try {
      // Update in main Tasks collection if available
      const Tasks = Meteor.Collections?.Tasks || global.Collections?.Tasks;
      
      const updateData = {
        ...updates,
        'meta.lastUpdated': new Date(),
        lastModified: new Date()
      };
      
      if (Tasks) {
        await Tasks.updateAsync(taskId, { $set: updateData });
        console.log('[correctionTasks.updateStatus] Updated in main Tasks collection');
      } else {
        await CorrectionTasks.updateAsync(taskId, { $set: updateData });
        console.log('[correctionTasks.updateStatus] Updated in CorrectionTasks collection');
      }
      
      return { success: true };
    } catch (error) {
      console.error('[correctionTasks.updateStatus] Error:', error);
      throw new Meteor.Error('update-failed', 'Failed to update task status', error.message);
    }
});

Meteor.ServerMethods.define('correctionRequests.cancel', {
  description: 'Cancel a correction request Task on the patient behalf and log a cancellation Communication',
  phi: true,
  positionalParams: ['data'],
  schemaObject: {
    type: 'object',
    properties: { taskId: { type: 'string' }, message: { type: 'string' } },
    required: ['taskId', 'message']
  }
}, async function(params, context){
    const data = params;
    const { taskId, message } = data;

    try {
      const task = await CorrectionTasks.findOneAsync(taskId);
      if (!task) {
        throw new Meteor.Error('not-found', 'Task not found');
      }
      
      // Check if can be cancelled
      if (!CorrectionRequests.canCancel({ _id: taskId })) {
        throw new Meteor.Error('invalid-state', 'Request cannot be cancelled in current state');
      }
      
      // Create cancellation communication
      const communication = {
        _id: Random.id(),
        resourceType: 'Communication',
        status: 'completed',
        category: [{
          coding: [{
            system: 'http://fhir.org/guides/patient-correction/CodeSystem/PatientCorrectionCommunicationTypes',
            code: 'medRecCxReq',
            display: 'Correction Request'
          }]
        }],
        subject: task.for,
        about: [{
          reference: `Task/${taskId}`
        }],
        sent: new Date(),
        sender: {
          reference: get(task, 'for.reference')
        },
        payload: [{
          contentString: `Request cancelled by patient: ${message}`
        }],
        meta: {
          lastUpdated: new Date()
        }
      };
      
      const commId = await CorrectionCommunications.insertAsync(communication);
      
      // Update task to cancelled
      await CorrectionTasks.updateAsync(taskId, {
        $set: {
          status: 'cancelled',
          businessStatus: BUSINESS_STATUSES['requester-cancelled'],
          'output': [{
            type: {
              text: 'Cancellation Communication'
            },
            valueReference: {
              reference: `Communication/${commId}`
            }
          }],
          'meta.lastUpdated': new Date()
        }
      });
      
      return {
        success: true,
        communicationId: commId
      };
      
    } catch (error) {
      console.error('Error cancelling correction request:', error);
      throw new Meteor.Error('cancel-failed', 'Failed to cancel request', error.message);
    }
});