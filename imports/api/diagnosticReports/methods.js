// /imports/api/diagnosticReports/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get, has, set } from 'lodash';

import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';

Meteor.ServerMethods.define('diagnosticReports.create', {
  description: 'Create a FHIR DiagnosticReport record for a patient',
  phi: true,
  aliases: ['createDiagnosticReport'],
  schemaObject: { type: 'object' }
}, async function(params, context){
  const diagnosticReportData = params;

  // Create clean object
  let cleanDiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: Random.id(),
    status: diagnosticReportData.status || 'final',
    effectiveDateTime: diagnosticReportData.effectiveDateTime,
    conclusion: diagnosticReportData.conclusion
  };

  // Set _id based on environment variable
  if (process.env.USE_MONGO_OBJECTID) {
    // Use MongoDB ObjectID for consistency with existing data
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    // Convert to hex string for Meteor
    cleanDiagnosticReport._id = objectId.toHexString();
    context.log.info('Using MongoDB ObjectID (as hex string)', { _id: cleanDiagnosticReport._id });
  } else {
    // Default: Set _id to match id (Meteor string ID)
    cleanDiagnosticReport._id = cleanDiagnosticReport.id;
    context.log.info('Using Meteor string ID', { _id: cleanDiagnosticReport._id });
  }

  // Set code as CodeableConcept
  // Common LOINC codes for diagnostic reports:
  // 24323-8 - Comprehensive metabolic panel
  // 58410-2 - Complete blood count (CBC) with differential
  // 2093-3 - Cholesterol [Mass/volume] in Serum or Plasma
  if (diagnosticReportData.code) {
    cleanDiagnosticReport.code = {
      coding: [{
        system: 'http://loinc.org',
        code: diagnosticReportData.code,
        display: diagnosticReportData.codeDisplay || diagnosticReportData.code
      }],
      text: diagnosticReportData.codeDisplay || diagnosticReportData.code
    };
  }

  // Set category
  if (diagnosticReportData.category) {
    cleanDiagnosticReport.category = [{
      text: diagnosticReportData.category
    }];
  }

  // Set subject reference from session
  if (diagnosticReportData.subject) {
    cleanDiagnosticReport.subject = diagnosticReportData.subject;
  }

  try {
    const reportId = await DiagnosticReports.insertAsync(cleanDiagnosticReport);
    context.log.info('Created diagnostic report', { reportId: reportId });
    return reportId;
  } catch (error) {
    context.log.error('Error creating diagnostic report', { message: error.message });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

Meteor.ServerMethods.define('diagnosticReports.update', {
  description: 'Update an existing FHIR DiagnosticReport record by MongoDB _id',
  phi: true,
  aliases: ['updateDiagnosticReport'],
  positionalParams: ['reportId', 'diagnosticReportData'],
  schemaObject: {
    type: 'object',
    properties: {
      reportId: { type: 'string' },
      diagnosticReportData: { type: 'object' }
    },
    required: ['reportId', 'diagnosticReportData']
  }
}, async function(params, context){
  const { reportId, diagnosticReportData } = params;

  const existingReport = await DiagnosticReports.findOneAsync({_id: reportId});
  if (!existingReport) {
    throw new Meteor.Error('not-found', 'Diagnostic report not found');
  }

  // Create update object
  let updateData = {
    status: diagnosticReportData.status || existingReport.status,
    effectiveDateTime: diagnosticReportData.effectiveDateTime || existingReport.effectiveDateTime,
    conclusion: diagnosticReportData.conclusion || existingReport.conclusion
  };

  // Update code as CodeableConcept
  if (diagnosticReportData.code) {
    updateData.code = {
      coding: [{
        system: 'http://loinc.org',
        code: diagnosticReportData.code,
        display: diagnosticReportData.codeDisplay || diagnosticReportData.code
      }],
      text: diagnosticReportData.codeDisplay || diagnosticReportData.code
    };
  }

  // Update category
  if (diagnosticReportData.category) {
    updateData.category = [{
      text: diagnosticReportData.category
    }];
  }

  // Preserve subject reference
  if (existingReport.subject) {
    updateData.subject = existingReport.subject;
  }

  try {
    const result = await DiagnosticReports.updateAsync({_id: reportId}, {$set: updateData});
    context.log.info('Updated diagnostic report', { reportId: reportId, updated: result });
    return result;
  } catch (error) {
    context.log.error('Error updating diagnostic report', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

Meteor.ServerMethods.define('diagnosticReports.remove', {
  description: 'Remove a FHIR DiagnosticReport record (test mode or settings-gated)',
  phi: true,
  aliases: ['removeDiagnosticReport'],
  positionalParams: ['reportId'],
  schemaObject: {
    type: 'object',
    properties: { reportId: { type: 'string' } },
    required: ['reportId']
  }
}, async function(params, context){
  const reportId = params.reportId;

  // Check if running in test mode
  if (!process.env.TEST_RUN && !get(Meteor, 'settings.public.defaults.allowDiagnosticReportDeletion', false)) {
    context.log.warn('Deletion blocked - not in TEST_RUN mode', { reportId: reportId });
    throw new Meteor.Error('not-allowed', 'Diagnostic report deletion is restricted in production mode');
  }

  try {
    const result = await DiagnosticReports.removeAsync({_id: reportId});
    context.log.info('Removed diagnostic report', { reportId: reportId, removed: result });
    return result;
  } catch (error) {
    context.log.error('Error removing diagnostic report', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});
