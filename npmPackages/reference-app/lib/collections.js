// packages/reference-app/lib/collections.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
// import SimpleSchema from 'simpl-schema';  // Uncomment when SimpleSchema is available for Meteor 3.0

// =============================================================================
// COLLECTIONS
// =============================================================================

// Client-only collection for UI state management
let ReferenceAppState;
if (Meteor.isClient) {
  ReferenceAppState = new Mongo.Collection('ReferenceAppState', {
    connection: null // Client-only collection
  });
}

// Client-only collection for workflow data
let ReferenceWorkflowData;
if (Meteor.isClient) {
  ReferenceWorkflowData = new Mongo.Collection('ReferenceWorkflowData', {
    connection: null
  });
}

// Client-only collection for stats display
let ReferenceAppStats;
if (Meteor.isClient) {
  ReferenceAppStats = new Mongo.Collection('ReferenceAppStats');
}

// =============================================================================
// SCHEMAS (SimpleSchema - commented out until Meteor 3.0 support)
// =============================================================================

// When SimpleSchema is available for Meteor 3.0, uncomment this section:
/*
const ReferenceAppStateSchema = new SimpleSchema({
  _id: {
    type: String,
    optional: true
  },
  currentStep: {
    type: SimpleSchema.Integer,
    defaultValue: 0,
    min: 0
  },
  workflowStatus: {
    type: String,
    allowedValues: ['idle', 'active', 'paused', 'completed', 'error'],
    defaultValue: 'idle'
  },
  selectedPatientId: {
    type: String,
    optional: true
  },
  formData: {
    type: Object,
    blackbox: true,
    optional: true
  },
  lastUpdated: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
});

const ReferenceWorkflowSchema = new SimpleSchema({
  _id: {
    type: String,
    optional: true
  },
  workflowId: {
    type: String
  },
  patientId: {
    type: String
  },
  resourceType: {
    type: String,
    allowedValues: ['Observation', 'Procedure', 'Condition', 'DiagnosticReport']
  },
  status: {
    type: String,
    allowedValues: ['draft', 'preliminary', 'final', 'amended', 'corrected', 'cancelled'],
    defaultValue: 'draft'
  },
  code: {
    type: Object,
    optional: true
  },
  'code.system': {
    type: String,
    optional: true
  },
  'code.code': {
    type: String,
    optional: true
  },
  'code.display': {
    type: String,
    optional: true
  },
  value: {
    type: String,
    optional: true
  },
  notes: {
    type: String,
    optional: true
  },
  metadata: {
    type: Object,
    blackbox: true,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
});

// Attach schemas
if (Meteor.isClient) {
  ReferenceAppState.attachSchema(ReferenceAppStateSchema);
  ReferenceWorkflowData.attachSchema(ReferenceWorkflowSchema);
}
*/

// =============================================================================
// COLLECTION HELPERS
// =============================================================================

const ReferenceAppCollections = {
  // Client-only collections
  ReferenceAppState: ReferenceAppState,
  ReferenceWorkflowData: ReferenceWorkflowData,
  ReferenceAppStats: ReferenceAppStats,
  
  // Helper methods
  initializeState: function() {
    if (Meteor.isClient) {
      // Initialize default state if not exists
      if (ReferenceAppState.find().count() === 0) {
        ReferenceAppState.insert({
          _id: 'default',
          currentStep: 0,
          workflowStatus: 'idle'
        });
      }
    }
  },
  
  getCurrentState: function() {
    if (Meteor.isClient) {
      return ReferenceAppState.findOne('default') || {};
    }
    return {};
  },
  
  updateState: function(updates) {
    if (Meteor.isClient) {
      ReferenceAppState.update('default', { $set: updates });
    }
  },
  
  resetState: function() {
    if (Meteor.isClient) {
      ReferenceAppState.remove({});
      ReferenceWorkflowData.remove({});
      this.initializeState();
    }
  },
  
  // Workflow helpers
  saveWorkflowData: function(data) {
    if (Meteor.isClient) {
      const workflowId = Session.get('currentWorkflowId') || Random.id();
      Session.set('currentWorkflowId', workflowId);
      
      const doc = {
        ...data,
        workflowId: workflowId,
        patientId: Session.get('selectedPatientId')
      };
      
      const existing = ReferenceWorkflowData.findOne({ workflowId: workflowId });
      if (existing) {
        ReferenceWorkflowData.update(existing._id, { $set: doc });
      } else {
        ReferenceWorkflowData.insert(doc);
      }
      
      return workflowId;
    }
  },
  
  getWorkflowData: function(workflowId) {
    if (Meteor.isClient) {
      return ReferenceWorkflowData.findOne({ workflowId: workflowId });
    }
    return null;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export { 
  ReferenceAppCollections,
  ReferenceAppState,
  ReferenceWorkflowData,
  ReferenceAppStats
};