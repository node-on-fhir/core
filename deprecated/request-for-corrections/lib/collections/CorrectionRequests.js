// packages/request-for-corrections/lib/collections/CorrectionRequests.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import moment from 'moment';
import { get } from 'lodash';

// Create the collection
export const CorrectionRequests = new Mongo.Collection('CorrectionRequests');

// Define helper methods directly on the collection
CorrectionRequests.getStatusDisplay = function(request) {
  const task = CorrectionTasks.findOne({ 'input.valueReference': request._id });
  if (!task) return 'Unknown';
  
  return get(task, 'businessStatus.coding[0].display', get(task, 'status', 'Unknown'));
};

CorrectionRequests.getTask = function(request) {
  return CorrectionTasks.findOne({ 'input.valueReference': request._id });
};

CorrectionRequests.getCommunications = function(request) {
  const task = this.getTask(request);
  return CorrectionCommunications.find({ 
    'about.reference': `Task/${get(task, '_id', '')}`
  }, {
    sort: { 'meta.lastUpdated': 1 }
  }).fetch();
};

CorrectionRequests.canCancel = function(request) {
  const task = this.getTask(request);
  if (!task) return false;
  
  const businessStatus = get(task, 'businessStatus.coding[0].code');
  return ['queued', 'in-review', 'waiting-for-information', 'accepted', 'partial-accept']
    .includes(businessStatus);
};

CorrectionRequests.canFileDisagreement = function(request) {
  const task = this.getTask(request);
  if (!task) return false;
  
  const businessStatus = get(task, 'businessStatus.coding[0].code');
  return businessStatus === 'denied';
};

// Deny writes on client
if (Meteor.isClient) {
  CorrectionRequests.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; }
  });
}

// Import related collections
import { CorrectionTasks } from './CorrectionTasks';
import { CorrectionCommunications } from './CorrectionCommunications';