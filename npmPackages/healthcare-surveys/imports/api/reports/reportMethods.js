// packages/healthcare-surveys/imports/api/reports/reportMethods.js

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import SimpleSchema from 'simpl-schema';
import { Reports } from './reports';
import { Surveys } from '../surveys/surveys';
import { get } from 'lodash';
import moment from 'moment';

export const generateReport = new ValidatedMethod({
  name: 'reports.generate',
  validate: new SimpleSchema({
    name: { type: String },
    type: { type: String },
    format: { type: String, optional: true },
    parameters: { type: Object, blackbox: true },
    surveyId: { type: String, optional: true }
  }).validator(),
  async run({ name, type, format = 'fhir', parameters, surveyId }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to generate report');
    }
    
    const report = {
      name,
      type,
      format,
      parameters,
      surveyId,
      status: 'pending'
    };
    
    const reportId = await Reports.insertAsync(report);
    
    // Trigger async report generation
    Meteor.defer(async () => {
      await generateReportContent(reportId);
    });
    
    return reportId;
  }
});

// Async report generation function
const generateReportContent = async function(reportId) {
  const startTime = Date.now();
  
  try {
    // Update status to generating
    await Reports.updateAsync(reportId, {
      $set: { status: 'generating' }
    });
    
    const report = await Reports.findOneAsync(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    
    let content = null;
    
    // Generate content based on report type
    switch (report.type) {
      case 'composition':
        content = await generateCompositionReport(report.parameters);
        break;
        
      case 'encounter-summary':
        content = await generateEncounterSummaryReport(report.parameters);
        break;
        
      case 'medication-summary':
        content = await generateMedicationSummaryReport(report.parameters);
        break;
        
      case 'diagnostic-summary':
        content = await generateDiagnosticSummaryReport(report.parameters);
        break;
        
      case 'submission-report':
        content = await generateSubmissionReport(report.parameters);
        break;
        
      case 'statistical-report':
        content = await generateStatisticalReport(report.parameters);
        break;
        
      default:
        throw new Error(`Unknown report type: ${report.type}`);
    }
    
    // Update report with content
    await Reports.updateAsync(reportId, {
      $set: {
        content,
        status: 'completed',
        generatedAt: new Date(),
        generationDuration: Date.now() - startTime
      }
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    
    await Reports.updateAsync(reportId, {
      $set: {
        status: 'failed',
        error: error.message,
        generationDuration: Date.now() - startTime
      }
    });
  }
};

// Report generation functions
const generateCompositionReport = async function(parameters) {
  const { compositionId } = parameters;
  
  // This would fetch the composition and format it
  return {
    type: 'composition',
    compositionId,
    generatedAt: new Date()
  };
};

const generateEncounterSummaryReport = async function(parameters) {
  const { encounterId, includeConditions, includeProcedures, includeMedications } = parameters;
  
  // This would aggregate encounter data
  return {
    type: 'encounter-summary',
    encounterId,
    sections: {
      conditions: includeConditions ? [] : null,
      procedures: includeProcedures ? [] : null,
      medications: includeMedications ? [] : null
    },
    generatedAt: new Date()
  };
};

const generateMedicationSummaryReport = async function(parameters) {
  const { startDate, endDate, patientId, encounterId } = parameters;
  
  // This would aggregate medication data
  return {
    type: 'medication-summary',
    period: { start: startDate, end: endDate },
    summary: {
      totalAdministrations: 0,
      totalRequests: 0,
      byMedication: {},
      byStatus: {}
    },
    generatedAt: new Date()
  };
};

const generateDiagnosticSummaryReport = async function(parameters) {
  const { startDate, endDate, category } = parameters;
  
  // This would aggregate diagnostic report data
  return {
    type: 'diagnostic-summary',
    period: { start: startDate, end: endDate },
    category,
    summary: {
      totalReports: 0,
      byCategory: {},
      byStatus: {}
    },
    generatedAt: new Date()
  };
};

const generateSubmissionReport = async function(parameters) {
  const { surveyId } = parameters;
  
  if (!surveyId) {
    throw new Error('Survey ID required for submission report');
  }
  
  const survey = await Surveys.findOneAsync(surveyId);
  if (!survey) {
    throw new Error('Survey not found');
  }
  
  return {
    type: 'submission-report',
    surveyId,
    surveyName: survey.name,
    status: survey.status,
    submittedAt: survey.submittedAt,
    compositionCount: survey.compositionIds.length,
    endpoint: survey.submissionEndpoint,
    generatedAt: new Date()
  };
};

const generateStatisticalReport = async function(parameters) {
  const { startDate, endDate, groupBy } = parameters;
  
  // This would generate statistics
  return {
    type: 'statistical-report',
    period: { start: startDate, end: endDate },
    statistics: {
      totalSurveys: 0,
      totalCompositions: 0,
      totalSubmissions: 0,
      byType: {},
      byStatus: {}
    },
    generatedAt: new Date()
  };
};

export const getReport = new ValidatedMethod({
  name: 'reports.get',
  validate: new SimpleSchema({
    reportId: { type: String }
  }).validator(),
  async run({ reportId }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const report = await Reports.findOneAsync(reportId);
    if (!report) {
      throw new Meteor.Error('not-found', 'Report not found');
    }
    
    if (!report.canAccess(this.userId)) {
      throw new Meteor.Error('forbidden', 'Access denied');
    }
    
    return report;
  }
});

export const shareReport = new ValidatedMethod({
  name: 'reports.share',
  validate: new SimpleSchema({
    reportId: { type: String },
    userIds: { type: Array },
    'userIds.$': { type: String }
  }).validator(),
  async run({ reportId, userIds }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const report = await Reports.findOneAsync(reportId);
    if (!report) {
      throw new Meteor.Error('not-found', 'Report not found');
    }
    
    if (report.createdBy !== this.userId) {
      throw new Meteor.Error('forbidden', 'Only report owner can share');
    }
    
    return await Reports.updateAsync(reportId, {
      $addToSet: { sharedWith: { $each: userIds } }
    });
  }
});

export const updateReportVisibility = new ValidatedMethod({
  name: 'reports.updateVisibility',
  validate: new SimpleSchema({
    reportId: { type: String },
    visibility: { type: String, allowedValues: ['private', 'organization', 'public'] }
  }).validator(),
  async run({ reportId, visibility }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const report = await Reports.findOneAsync(reportId);
    if (!report) {
      throw new Meteor.Error('not-found', 'Report not found');
    }
    
    if (report.createdBy !== this.userId) {
      throw new Meteor.Error('forbidden', 'Only report owner can change visibility');
    }
    
    return await Reports.updateAsync(reportId, {
      $set: { visibility }
    });
  }
});

export const deleteReport = new ValidatedMethod({
  name: 'reports.delete',
  validate: new SimpleSchema({
    reportId: { type: String }
  }).validator(),
  async run({ reportId }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const report = await Reports.findOneAsync(reportId);
    if (!report) {
      throw new Meteor.Error('not-found', 'Report not found');
    }
    
    if (report.createdBy !== this.userId) {
      throw new Meteor.Error('forbidden', 'Only report owner can delete');
    }
    
    return await Reports.removeAsync(reportId);
  }
});