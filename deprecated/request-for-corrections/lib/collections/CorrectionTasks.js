// packages/request-for-corrections/lib/collections/CorrectionTasks.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { get } from 'lodash';
import { BUSINESS_STATUSES, isValidTransition } from '../constants/businessStatuses';
import { getStateDisplay } from '../constants/workflowStates';

// Create the collection
export const CorrectionTasks = new Mongo.Collection('CorrectionTasks');

// Define the schema for Patient Correction Task
const PatientCorrectionTaskSchema = new SimpleSchema({
  // FHIR Task base fields
  resourceType: {
    type: String,
    defaultValue: 'Task'
  },
  identifier: {
    type: Array,
    optional: true
  },
  'identifier.$': {
    type: Object,
    optional: true
  },
  // Restrict status values
  status: {
    type: String,
    allowedValues: ['ready', 'in-progress', 'cancelled', 'completed']
  },
  
  // Must have a code
  code: {
    type: Object,
    optional: false
  },
  
  // Business status is required
  businessStatus: {
    type: Object,
    optional: false
  },
  
  // For disagreement tasks, must reference original task
  reasonReference: {
    type: Object,
    optional: true,
    custom() {
      // If this is a disagreement task, reasonReference is required
      const taskCode = get(this.obj, 'code.coding[0].code');
      if (taskCode === 'medRecCxDenialDisagree' && !this.value) {
        return 'required';
      }
    }
  },
  
  // Additional FHIR Task fields that might be used
  meta: {
    type: Object,
    optional: true,
    blackbox: true
  },
  input: {
    type: Array,
    optional: true
  },
  'input.$': {
    type: Object,
    blackbox: true
  },
  output: {
    type: Array,
    optional: true
  },
  'output.$': {
    type: Object,
    blackbox: true
  },
  for: {
    type: Object,
    optional: true,
    blackbox: true
  },
  encounter: {
    type: Object,
    optional: true,
    blackbox: true
  },
  authoredOn: {
    type: Date,
    optional: true
  },
  lastModified: {
    type: Date,
    optional: true
  },
  requester: {
    type: Object,
    optional: true,
    blackbox: true
  },
  owner: {
    type: Object,
    optional: true,
    blackbox: true
  },
  intent: {
    type: String,
    optional: true
  },
  priority: {
    type: String,
    optional: true
  },
  description: {
    type: String,
    optional: true
  },
  focus: {
    type: Object,
    optional: true,
    blackbox: true
  },
  basedOn: {
    type: Array,
    optional: true
  },
  'basedOn.$': {
    type: Object,
    blackbox: true
  },
  note: {
    type: Array,
    optional: true
  },
  'note.$': {
    type: Object,
    blackbox: true
  }
});

// Since aldeed:collection2 is having version issues, we'll skip schema attachment
// CorrectionTasks.attachSchema(PatientCorrectionTaskSchema);

// Define helper methods directly on the collection
CorrectionTasks.getTaskType = function(task) {
  return get(task, 'code.coding[0].code', 'unknown');
};

CorrectionTasks.isCorrectionRequest = function(task) {
  return this.getTaskType(task) === 'medRecCxReq';
};

CorrectionTasks.isDisagreement = function(task) {
  return this.getTaskType(task) === 'medRecCxDenialDisagree';
};

CorrectionTasks.getBusinessStatusCode = function(task) {
  return get(task, 'businessStatus.coding[0].code', 'unknown');
};

CorrectionTasks.getStateDisplay = function(task) {
  return getStateDisplay(task.status, this.getBusinessStatusCode(task));
};

CorrectionTasks.canTransitionTo = function(task, newBusinessStatus) {
  const currentStatus = this.getBusinessStatusCode(task);
  return isValidTransition(currentStatus, newBusinessStatus);
};

CorrectionTasks.getCommunications = function(task) {
  const { CorrectionCommunications } = require('./CorrectionCommunications');
  return CorrectionCommunications.find({ 
    'about.reference': `Task/${task._id}`
  }, {
    sort: { 'meta.lastUpdated': 1 }
  }).fetch();
};

CorrectionTasks.getInitialRequest = function(task) {
  const inputRef = get(task, 'input[0].valueReference.reference', '');
  const commId = inputRef.replace('Communication/', '');
  
  if (commId) {
    const { CorrectionCommunications } = require('./CorrectionCommunications');
    return CorrectionCommunications.findOne(commId);
  }
  
  return null;
};

CorrectionTasks.getResolution = function(task) {
  const outputRef = get(task, 'output[0].valueReference.reference', '');
  const commId = outputRef.replace('Communication/', '');
  
  if (commId) {
    const { CorrectionCommunications } = require('./CorrectionCommunications');
    return CorrectionCommunications.findOne(commId);
  }
  
  return null;
};

CorrectionTasks.isComplete = function(task) {
  return ['completed', 'cancelled'].includes(task.status);
};

CorrectionTasks.needsPatientAction = function(task) {
  const businessStatus = this.getBusinessStatusCode(task);
  return businessStatus === 'waiting-for-information' || businessStatus === 'denied';
};

CorrectionTasks.needsProviderAction = function(task) {
  const businessStatus = this.getBusinessStatusCode(task);
  return ['queued', 'in-review', 'accepted', 'partial-accept'].includes(businessStatus);
};

CorrectionTasks.getProgressPercentage = function(task) {
  const statusProgress = {
    'queued': 10,
    'in-review': 30,
    'waiting-for-information': 40,
    'accepted': 60,
    'partial-accept': 60,
    'amendment-completed': 90,
    'denied': 90,
    'disagreement-logged': 95,
    'completed': 100,
    'requester-cancelled': 100
  };
  
  return statusProgress[this.getBusinessStatusCode(task)] || 0;
};


// Deny writes on client
if (Meteor.isClient) {
  CorrectionTasks.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; }
  });
}