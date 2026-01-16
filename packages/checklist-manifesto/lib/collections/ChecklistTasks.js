// /packages/checklist-manifesto/lib/collections/ChecklistTasks.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// FHIR Task resource schema:
// https://www.hl7.org/fhir/task.html
export const ChecklistTasks = new Mongo.Collection('ChecklistTasks');

// Helper functions
export const getTaskStatus = function(task) {
  return get(task, 'status', 'unknown');
};

export const isTaskCompleted = function(task) {
  return get(task, 'status') === 'completed';
};

export const formatTaskDate = function(task, dateField = 'authoredOn') {
  const date = get(task, dateField);
  return date ? moment(date).format('MMM D, YYYY h:mm A') : 'Unknown';
};

// Initialize indexes on server
if (Meteor.isServer) {
  Meteor.startup(async function() {
    // Create indexes for efficient queries
    await ChecklistTasks.createIndexAsync({ requester: 1 });
    await ChecklistTasks.createIndexAsync({ owner: 1 });
    await ChecklistTasks.createIndexAsync({ status: 1 });
    await ChecklistTasks.createIndexAsync({ isDeleted: 1 });
    await ChecklistTasks.createIndexAsync({ priority: 1 });
    await ChecklistTasks.createIndexAsync({ 'executionPeriod.end': 1 });
    await ChecklistTasks.createIndexAsync({ listId: 1 });
    await ChecklistTasks.createIndexAsync({ public: 1 });
    await ChecklistTasks.createIndexAsync({ ordinal: 1 });
    await ChecklistTasks.createIndexAsync({ 'partOf.reference': 1 });
    await ChecklistTasks.createIndexAsync({ isTemplate: 1 });
    await ChecklistTasks.createIndexAsync({ lastModified: -1 });
    await ChecklistTasks.createIndexAsync({ authoredOn: -1 });
    
    console.log('ChecklistTasks indexes created');
  });
}