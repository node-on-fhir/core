// /imports/api/diagnosticReports/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get, has, set } from 'lodash';

import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';

Meteor.methods({
  'createDiagnosticReport': async function(diagnosticReportData) {
    console.log('[DiagnosticReports.createDiagnosticReport]', diagnosticReportData);
    
    check(diagnosticReportData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create diagnostic reports');
    }
    
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
      console.log('[DiagnosticReports.createDiagnosticReport] Using MongoDB ObjectID (as hex string):', cleanDiagnosticReport._id);
    } else {
      // Default: Set _id to match id (Meteor string ID)
      cleanDiagnosticReport._id = cleanDiagnosticReport.id;
      console.log('[DiagnosticReports.createDiagnosticReport] Using Meteor string ID:', cleanDiagnosticReport._id);
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
    
    console.log('[DiagnosticReports.createDiagnosticReport] Clean report:', cleanDiagnosticReport);
    
    try {
      const reportId = await DiagnosticReports.insertAsync(cleanDiagnosticReport);
      console.log('[DiagnosticReports.createDiagnosticReport] Created with ID:', reportId);
      return reportId;
    } catch (error) {
      console.error('[DiagnosticReports.createDiagnosticReport] Error:', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },
  
  'updateDiagnosticReport': async function(reportId, diagnosticReportData) {
    console.log('[DiagnosticReports.updateDiagnosticReport]', reportId, diagnosticReportData);
    
    check(reportId, String);
    check(diagnosticReportData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update diagnostic reports');
    }
    
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
      console.log('[DiagnosticReports.updateDiagnosticReport] Updated:', result);
      return result;
    } catch (error) {
      console.error('[DiagnosticReports.updateDiagnosticReport] Error:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },
  
  'removeDiagnosticReport': async function(reportId) {
    console.log('[DiagnosticReports.removeDiagnosticReport]', reportId);
    
    check(reportId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete diagnostic reports');
    }
    
    // Check if running in test mode
    if (!process.env.TEST_RUN && !get(Meteor, 'settings.public.defaults.allowDiagnosticReportDeletion', false)) {
      console.log('[DiagnosticReports.removeDiagnosticReport] Deletion blocked - not in TEST_RUN mode');
      throw new Meteor.Error('not-allowed', 'Diagnostic report deletion is restricted in production mode');
    }
    
    try {
      const result = await DiagnosticReports.removeAsync({_id: reportId});
      console.log('[DiagnosticReports.removeDiagnosticReport] Removed:', result);
      return result;
    } catch (error) {
      console.error('[DiagnosticReports.removeDiagnosticReport] Error:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  }
});