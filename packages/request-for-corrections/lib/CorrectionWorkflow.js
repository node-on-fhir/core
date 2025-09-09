// packages/request-for-corrections/lib/CorrectionWorkflow.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { CorrectionTasks } from './collections/CorrectionTasks';
import { CorrectionCommunications } from './collections/CorrectionCommunications';
import { BUSINESS_STATUSES, isValidTransition } from './constants/businessStatuses';

// Correction Workflow Manager
export const CorrectionWorkflow = {
  // Create a new correction request
  createCorrectionRequest: async function(patientId, requestData) {
    // Implementation would go here
    console.log('Creating correction request for patient:', patientId);
  },

  // Transition task to new status
  transitionTask: async function(taskId, newBusinessStatus) {
    const task = CorrectionTasks.findOne(taskId);
    if (!task) {
      throw new Meteor.Error('not-found', 'Task not found');
    }

    const currentStatus = CorrectionTasks.getBusinessStatusCode(task);
    if (!isValidTransition(currentStatus, newBusinessStatus)) {
      throw new Meteor.Error('invalid-transition', 
        `Cannot transition from ${currentStatus} to ${newBusinessStatus}`);
    }

    // Update the task
    const updates = {
      'businessStatus': BUSINESS_STATUSES[newBusinessStatus],
      'meta.lastUpdated': new Date()
    };

    // Handle specific status transitions
    if (newBusinessStatus === 'completed') {
      updates.status = 'completed';
    } else if (newBusinessStatus === 'requester-cancelled') {
      updates.status = 'cancelled';
    }

    return CorrectionTasks.update(taskId, { $set: updates });
  },

  // Add communication to a task
  addCommunication: async function(taskId, communicationData) {
    const task = CorrectionTasks.findOne(taskId);
    if (!task) {
      throw new Meteor.Error('not-found', 'Task not found');
    }

    // Create the communication
    const communication = {
      resourceType: 'Communication',
      status: 'completed',
      category: communicationData.category || [],
      subject: task.for,
      about: [{
        reference: `Task/${taskId}`
      }],
      sent: new Date(),
      sender: communicationData.sender,
      recipient: communicationData.recipient || [],
      payload: communicationData.payload || [],
      meta: {
        lastUpdated: new Date()
      }
    };

    return CorrectionCommunications.insert(communication);
  },

  // Get workflow status summary
  getWorkflowStatus: function(taskId) {
    const task = CorrectionTasks.findOne(taskId);
    if (!task) {
      return null;
    }

    return {
      taskId: task._id,
      status: task.status,
      businessStatus: CorrectionTasks.getBusinessStatusCode(task),
      stateDisplay: CorrectionTasks.getStateDisplay(task),
      needsPatientAction: CorrectionTasks.needsPatientAction(task),
      needsProviderAction: CorrectionTasks.needsProviderAction(task),
      progressPercentage: CorrectionTasks.getProgressPercentage(task),
      isComplete: CorrectionTasks.isComplete(task)
    };
  }
};