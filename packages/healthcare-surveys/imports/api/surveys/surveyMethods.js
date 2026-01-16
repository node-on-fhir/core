// packages/healthcare-surveys/imports/api/surveys/surveyMethods.js

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import SimpleSchema from 'simpl-schema';
import { Surveys } from './surveys';
import { get } from 'lodash';

export const createSurvey = new ValidatedMethod({
  name: 'surveys.create',
  validate: new SimpleSchema({
    name: { type: String },
    description: { type: String, optional: true },
    type: { type: String, allowedValues: ['emergency', 'inpatient', 'ambulatory', 'mixed'] },
    reportingPeriod: { type: Object },
    'reportingPeriod.start': { type: Date },
    'reportingPeriod.end': { type: Date }
  }).validator(),
  async run({ name, description, type, reportingPeriod }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to create survey');
    }
    
    // Validate period
    if (reportingPeriod.start >= reportingPeriod.end) {
      throw new Meteor.Error('invalid-period', 'End date must be after start date');
    }
    
    const survey = {
      name,
      description,
      type,
      reportingPeriod,
      status: 'draft',
      compositionIds: [],
      stats: {
        patientCount: 0,
        encounterCount: 0,
        sectionCounts: {}
      }
    };
    
    return await Surveys.insertAsync(survey);
  }
});

export const updateSurveyStatus = new ValidatedMethod({
  name: 'surveys.updateStatus',
  validate: new SimpleSchema({
    surveyId: { type: String },
    status: { type: String, allowedValues: ['draft', 'active', 'completed', 'cancelled'] }
  }).validator(),
  async run({ surveyId, status }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const survey = await Surveys.findOneAsync(surveyId);
    if (!survey) {
      throw new Meteor.Error('not-found', 'Survey not found');
    }
    
    // Validate status transitions
    const currentStatus = survey.status;
    const validTransitions = {
      'draft': ['active', 'cancelled'],
      'active': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    if (!validTransitions[currentStatus].includes(status)) {
      throw new Meteor.Error('invalid-transition', 
        `Cannot transition from ${currentStatus} to ${status}`);
    }
    
    return await Surveys.updateAsync(surveyId, {
      $set: { 
        status,
        updatedAt: new Date(),
        updatedBy: this.userId
      }
    });
  }
});

export const addCompositionToSurvey = new ValidatedMethod({
  name: 'surveys.addComposition',
  validate: new SimpleSchema({
    surveyId: { type: String },
    compositionId: { type: String }
  }).validator(),
  async run({ surveyId, compositionId }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const survey = await Surveys.findOneAsync(surveyId);
    if (!survey) {
      throw new Meteor.Error('not-found', 'Survey not found');
    }
    
    if (survey.status !== 'active') {
      throw new Meteor.Error('invalid-status', 'Survey must be active to add compositions');
    }
    
    // Check if composition already added
    if (survey.compositionIds.includes(compositionId)) {
      throw new Meteor.Error('duplicate', 'Composition already added to survey');
    }
    
    return await Surveys.updateAsync(surveyId, {
      $push: { compositionIds: compositionId },
      $inc: { 'stats.encounterCount': 1 },
      $set: { updatedAt: new Date(), updatedBy: this.userId }
    });
  }
});

export const submitSurvey = new ValidatedMethod({
  name: 'surveys.submit',
  validate: new SimpleSchema({
    surveyId: { type: String },
    endpoint: { type: String },
    contentBundleId: { type: String },
    reportingBundleId: { type: String }
  }).validator(),
  async run({ surveyId, endpoint, contentBundleId, reportingBundleId }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const survey = await Surveys.findOneAsync(surveyId);
    if (!survey) {
      throw new Meteor.Error('not-found', 'Survey not found');
    }
    
    if (survey.status !== 'active') {
      throw new Meteor.Error('invalid-status', 'Survey must be active to submit');
    }
    
    if (survey.compositionIds.length === 0) {
      throw new Meteor.Error('no-compositions', 'Survey has no compositions to submit');
    }
    
    return await Surveys.updateAsync(surveyId, {
      $set: {
        status: 'completed',
        submittedAt: new Date(),
        submittedBy: this.userId,
        submissionEndpoint: endpoint,
        contentBundleId,
        reportingBundleId,
        updatedAt: new Date(),
        updatedBy: this.userId
      }
    });
  }
});

export const getSurveyStatistics = new ValidatedMethod({
  name: 'surveys.getStatistics',
  validate: new SimpleSchema({
    surveyId: { type: String }
  }).validator(),
  async run({ surveyId }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const survey = await Surveys.findOneAsync(surveyId);
    if (!survey) {
      throw new Meteor.Error('not-found', 'Survey not found');
    }
    
    // Calculate additional statistics
    const stats = {
      ...survey.stats,
      duration: moment(survey.reportingPeriod.end)
        .diff(survey.reportingPeriod.start, 'days'),
      compositionCount: survey.compositionIds.length,
      status: survey.status,
      progress: survey.status === 'completed' ? 100 : 
                survey.status === 'active' ? 50 : 0
    };
    
    return stats;
  }
});

export const deleteSurvey = new ValidatedMethod({
  name: 'surveys.delete',
  validate: new SimpleSchema({
    surveyId: { type: String }
  }).validator(),
  async run({ surveyId }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const survey = await Surveys.findOneAsync(surveyId);
    if (!survey) {
      throw new Meteor.Error('not-found', 'Survey not found');
    }
    
    if (survey.status === 'completed' && survey.submittedAt) {
      throw new Meteor.Error('cannot-delete', 'Cannot delete submitted surveys');
    }
    
    return await Surveys.removeAsync(surveyId);
  }
});