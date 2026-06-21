// packages/healthcare-surveys/imports/api/reports/reports.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import moment from 'moment';

// Report generation tracking collection
export const Reports = new Mongo.Collection('surveyReports');

// Report schema
const ReportSchema = new SimpleSchema({
  // Basic info
  surveyId: {
    type: String,
    optional: true
  },
  name: {
    type: String,
    max: 200
  },
  type: {
    type: String,
    allowedValues: ['composition', 'encounter-summary', 'medication-summary', 
                    'diagnostic-summary', 'submission-report', 'statistical-report']
  },
  format: {
    type: String,
    allowedValues: ['fhir', 'json', 'csv', 'pdf', 'html'],
    defaultValue: 'fhir'
  },
  
  // Report parameters
  parameters: {
    type: Object,
    blackbox: true
  },
  
  // Report content
  content: {
    type: Object,
    optional: true,
    blackbox: true
  },
  fileId: {
    type: String,
    optional: true // For file-based reports
  },
  
  // Status tracking
  status: {
    type: String,
    allowedValues: ['pending', 'generating', 'completed', 'failed'],
    defaultValue: 'pending'
  },
  error: {
    type: String,
    optional: true
  },
  
  // Timing
  generatedAt: {
    type: Date,
    optional: true
  },
  generationDuration: {
    type: Number,
    optional: true // milliseconds
  },
  
  // Access control
  visibility: {
    type: String,
    allowedValues: ['private', 'organization', 'public'],
    defaultValue: 'private'
  },
  sharedWith: {
    type: Array,
    defaultValue: []
  },
  'sharedWith.$': {
    type: String // User IDs
  },
  
  // Metadata
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  },
  createdBy: {
    type: String,
    autoValue: function() {
      if (this.isInsert && this.userId) {
        return this.userId;
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

Reports.attachSchema(ReportSchema);

// Indexes
if (Meteor.isServer) {
  Meteor.startup(async function() {
    try {
      await Reports.createIndexAsync({ surveyId: 1 });
      await Reports.createIndexAsync({ type: 1 });
      await Reports.createIndexAsync({ status: 1 });
      await Reports.createIndexAsync({ createdAt: -1 });
      await Reports.createIndexAsync({ createdBy: 1 });
      console.log('HealthcareSurveys: Report indexes created');
    } catch (error) {
      console.error('HealthcareSurveys: Error creating report indexes:', error);
    }
  });
}

// Collection helpers
Reports.helpers({
  isCompleted() {
    return this.status === 'completed';
  },
  
  isFailed() {
    return this.status === 'failed';
  },
  
  isPending() {
    return this.status === 'pending' || this.status === 'generating';
  },
  
  getFormattedDuration() {
    if (!this.generationDuration) return null;
    
    const duration = moment.duration(this.generationDuration);
    if (duration.asSeconds() < 1) {
      return `${duration.asMilliseconds()}ms`;
    } else if (duration.asMinutes() < 1) {
      return `${Math.round(duration.asSeconds())}s`;
    } else {
      return `${Math.round(duration.asMinutes())}m`;
    }
  },
  
  canAccess(userId) {
    if (this.visibility === 'public') return true;
    if (this.createdBy === userId) return true;
    if (this.sharedWith.includes(userId)) return true;
    // TODO: Add organization-level access check
    return false;
  }
});