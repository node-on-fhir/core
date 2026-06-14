// packages/healthcare-surveys/imports/api/surveys/surveys.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// Survey tracking collection
export const Surveys = new Mongo.Collection('surveys');

// Survey schema
const SurveySchema = new SimpleSchema({
  // Basic info
  name: {
    type: String,
    max: 200
  },
  description: {
    type: String,
    optional: true,
    max: 1000
  },
  status: {
    type: String,
    allowedValues: ['draft', 'active', 'completed', 'cancelled'],
    defaultValue: 'draft'
  },
  
  // Survey type and scope
  type: {
    type: String,
    allowedValues: ['emergency', 'inpatient', 'ambulatory', 'mixed']
  },
  reportingPeriod: {
    type: Object
  },
  'reportingPeriod.start': {
    type: Date
  },
  'reportingPeriod.end': {
    type: Date
  },
  
  // Composition tracking
  compositionIds: {
    type: Array,
    defaultValue: []
  },
  'compositionIds.$': {
    type: String
  },
  
  // Bundle tracking
  contentBundleId: {
    type: String,
    optional: true
  },
  reportingBundleId: {
    type: String,
    optional: true
  },
  
  // Submission info
  submittedAt: {
    type: Date,
    optional: true
  },
  submittedBy: {
    type: String,
    optional: true
  },
  submissionEndpoint: {
    type: String,
    optional: true
  },
  submissionResponse: {
    type: Object,
    optional: true,
    blackbox: true
  },
  
  // Statistics
  stats: {
    type: Object,
    optional: true
  },
  'stats.patientCount': {
    type: Number,
    optional: true
  },
  'stats.encounterCount': {
    type: Number,
    optional: true
  },
  'stats.sectionCounts': {
    type: Object,
    optional: true,
    blackbox: true
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
  },
  updatedBy: {
    type: String,
    autoValue: function() {
      if (this.userId) {
        return this.userId;
      }
    }
  }
});

Surveys.attachSchema(SurveySchema);

// Indexes
if (Meteor.isServer) {
  Meteor.startup(async function() {
    try {
      await Surveys.createIndexAsync({ status: 1 });
      await Surveys.createIndexAsync({ type: 1 });
      await Surveys.createIndexAsync({ createdAt: -1 });
      await Surveys.createIndexAsync({ 'reportingPeriod.start': 1, 'reportingPeriod.end': 1 });
      console.log('HealthcareSurveys: Survey indexes created');
    } catch (error) {
      console.error('HealthcareSurveys: Error creating survey indexes:', error);
    }
  });
}

// Collection helpers
Surveys.helpers({
  isActive() {
    return this.status === 'active';
  },
  
  isSubmitted() {
    return !!this.submittedAt;
  },
  
  getDuration() {
    if (this.reportingPeriod?.start && this.reportingPeriod?.end) {
      return moment(this.reportingPeriod.end).diff(this.reportingPeriod.start, 'days');
    }
    return null;
  },
  
  getCompositionCount() {
    return this.compositionIds?.length || 0;
  }
});