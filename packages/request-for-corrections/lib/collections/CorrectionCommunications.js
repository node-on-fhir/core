// packages/request-for-corrections/lib/collections/CorrectionCommunications.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { get } from 'lodash';

// Create the collection
export const CorrectionCommunications = new Mongo.Collection('CorrectionCommunications');

// Define the schema for Patient Correction Communication
const PatientCorrectionCommunicationSchema = new SimpleSchema({
  // FHIR Communication base fields
  resourceType: {
    type: String,
    defaultValue: 'Communication'
  },
  identifier: {
    type: Array,
    optional: true
  },
  'identifier.$': {
    type: Object,
    optional: true
  },
  instantiatesCanonical: {
    type: Array,
    optional: true
  },
  'instantiatesCanonical.$': {
    type: String
  },
  instantiatesUri: {
    type: Array,
    optional: true
  },
  'instantiatesUri.$': {
    type: String
  },
  basedOn: {
    type: Array,
    optional: true
  },
  'basedOn.$': {
    type: Object,
    blackbox: true
  },
  partOf: {
    type: Array,
    optional: true
  },
  'partOf.$': {
    type: Object,
    blackbox: true
  },
  inResponseTo: {
    type: Array,
    optional: true
  },
  'inResponseTo.$': {
    type: Object,
    blackbox: true
  },
  // Ensure status is always completed
  status: {
    type: String,
    allowedValues: ['completed'],
    defaultValue: 'completed'
  },
  
  // Must have category
  category: {
    type: Array,
    minCount: 1
  },
  'category.$': {
    type: Object,
    blackbox: true
  },
  
  // Must reference a correction task
  about: {
    type: Array,
    minCount: 1
  },
  'about.$': {
    type: Object
  },
  'about.$.reference': {
    type: String,
    regEx: /^Task\/.+/
  },
  
  // Additional FHIR Communication fields
  meta: {
    type: Object,
    optional: true,
    blackbox: true
  },
  priority: {
    type: String,
    optional: true
  },
  medium: {
    type: Array,
    optional: true
  },
  'medium.$': {
    type: Object,
    blackbox: true
  },
  subject: {
    type: Object,
    optional: true,
    blackbox: true
  },
  topic: {
    type: Object,
    optional: true,
    blackbox: true
  },
  encounter: {
    type: Object,
    optional: true,
    blackbox: true
  },
  sent: {
    type: Date,
    optional: true
  },
  received: {
    type: Date,
    optional: true
  },
  recipient: {
    type: Array,
    optional: true
  },
  'recipient.$': {
    type: Object,
    blackbox: true
  },
  sender: {
    type: Object,
    optional: true,
    blackbox: true
  },
  reasonCode: {
    type: Array,
    optional: true
  },
  'reasonCode.$': {
    type: Object,
    blackbox: true
  },
  reasonReference: {
    type: Array,
    optional: true
  },
  'reasonReference.$': {
    type: Object,
    blackbox: true
  },
  payload: {
    type: Array,
    optional: true
  },
  'payload.$': {
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
// CorrectionCommunications.attachSchema(PatientCorrectionCommunicationSchema);

// Define helper methods directly on the collection
CorrectionCommunications.getCommunicationType = function(comm) {
  return get(comm, 'category[0].coding[0].code', 'unknown');
};

CorrectionCommunications.isCorrectionRequest = function(comm) {
  return this.getCommunicationType(comm) === 'medRecCxReq';
};

CorrectionCommunications.isDisagreement = function(comm) {
  return this.getCommunicationType(comm) === 'medRecCxDenialDisagree';
};

CorrectionCommunications.getTypeDisplay = function(comm) {
  const type = this.getCommunicationType(comm);
  const typeMap = {
    'medRecCxReq': 'Correction Request',
    'medRecCxDenialDisagree': 'Disagreement'
  };
  return typeMap[type] || 'Unknown';
};

CorrectionCommunications.getSenderDisplay = function(comm) {
  const senderRef = get(comm, 'sender.reference', '');
  const parts = senderRef.split('/');
  
  if (parts[0] === 'Patient') {
    return 'Patient';
  } else if (parts[0] === 'Practitioner') {
    return 'Provider';
  } else if (parts[0] === 'Organization') {
    return 'Organization';
  }
  
  return 'Unknown';
};

CorrectionCommunications.getMessageContent = function(comm) {
  // Try different payload types
  const stringContent = get(comm, 'payload[0].contentString');
  if (stringContent) return stringContent;
  
  const attachmentTitle = get(comm, 'payload[0].contentAttachment.title');
  if (attachmentTitle) return `Attachment: ${attachmentTitle}`;
  
  const referenceDisplay = get(comm, 'payload[0].contentReference.display');
  if (referenceDisplay) return `Reference: ${referenceDisplay}`;
  
  return 'No content';
};

CorrectionCommunications.getRelatedTask = function(comm) {
  const taskRef = get(comm, 'about[0].reference', '');
  const taskId = taskRef.replace('Task/', '');
  
  if (taskId) {
    const { CorrectionTasks } = require('./CorrectionTasks');
    return CorrectionTasks.findOne(taskId);
  }
  
  return null;
};

CorrectionCommunications.getParentCommunication = function(comm) {
  const parentRef = get(comm, 'inResponseTo[0].reference', '');
  const parentId = parentRef.replace('Communication/', '');
  
  if (parentId) {
    return CorrectionCommunications.findOne(parentId);
  }
  
  return null;
};


// Deny writes on client
if (Meteor.isClient) {
  CorrectionCommunications.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; }
  });
}