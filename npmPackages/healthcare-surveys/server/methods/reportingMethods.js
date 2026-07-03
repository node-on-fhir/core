// packages/healthcare-surveys/server/methods/reportingMethods.js

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import SimpleSchema from 'simpl-schema';
import { get } from 'lodash';
import moment from 'moment';

// Import schemas and constants
import { HcsComposition } from '../../lib/schemas/HcsComposition';
import { HcsMedicationAdministration } from '../../lib/schemas/HcsMedicationAdministration';
import { HcsMedicationRequest } from '../../lib/schemas/HcsMedicationRequest';
import { HcsDiagnosticReport } from '../../lib/schemas/HcsDiagnosticReport';
import { HCS_SECTION_CODES } from '../../lib/constants/sectionCodes';

export const generateEncounterReport = new ValidatedMethod({
  name: 'healthcare-surveys.generateEncounterReport',
  validate: new SimpleSchema({
    encounterId: { type: String },
    encounterType: { 
      type: String, 
      allowedValues: ['emergency', 'inpatient', 'ambulatory'] 
    },
    includeOptionalSections: { type: Boolean, defaultValue: true }
  }).validator(),
  async run({ encounterId, encounterType, includeOptionalSections }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    // This method would typically fetch data from various collections
    // For now, we'll create a template structure
    const sections = [];
    
    // Add required sections
    sections.push({
      title: 'Reason for visit',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: HCS_SECTION_CODES.REASON_FOR_VISIT.code,
          display: HCS_SECTION_CODES.REASON_FOR_VISIT.display
        }]
      },
      text: {
        status: 'generated',
        div: '<div>Reason for visit content</div>'
      },
      entry: []
    });
    
    sections.push({
      title: 'Problem List',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: HCS_SECTION_CODES.PROBLEM.code,
          display: HCS_SECTION_CODES.PROBLEM.display
        }]
      },
      text: {
        status: 'generated',
        div: '<div>Problem list content</div>'
      },
      entry: []
    });
    
    sections.push({
      title: 'Allergies and Intolerances',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: HCS_SECTION_CODES.ALLERGIES.code,
          display: HCS_SECTION_CODES.ALLERGIES.display
        }]
      },
      text: {
        status: 'generated',
        div: '<div>No known allergies</div>'
      },
      entry: []
    });
    
    // Add optional sections based on encounter type
    if (includeOptionalSections) {
      if (encounterType === 'emergency' || encounterType === 'inpatient') {
        sections.push({
          title: 'Medications',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: HCS_SECTION_CODES.MEDICATIONS.code,
              display: HCS_SECTION_CODES.MEDICATIONS.display
            }]
          },
          text: {
            status: 'generated',
            div: '<div>Medications administered</div>'
          },
          entry: []
        });
        
        sections.push({
          title: 'Vital Signs',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: HCS_SECTION_CODES.VITAL_SIGNS.code,
              display: HCS_SECTION_CODES.VITAL_SIGNS.display
            }]
          },
          text: {
            status: 'generated',
            div: '<div>Vital signs recorded</div>'
          },
          entry: []
        });
      }
      
      if (encounterType === 'ambulatory') {
        sections.push({
          title: 'Assessment and Plan',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: HCS_SECTION_CODES.ASSESSMENT_PLAN.code,
              display: HCS_SECTION_CODES.ASSESSMENT_PLAN.display
            }]
          },
          text: {
            status: 'generated',
            div: '<div>Assessment and plan</div>'
          },
          entry: []
        });
      }
    }
    
    return {
      sections,
      encounterType,
      generatedAt: new Date()
    };
  }
});

export const checkReportability = new ValidatedMethod({
  name: 'healthcare-surveys.checkReportability',
  validate: new SimpleSchema({
    encounterId: { type: String },
    encounterType: { type: String }
  }).validator(),
  async run({ encounterId, encounterType }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    // Check if encounter meets reportability criteria
    const criteria = {
      emergency: {
        minDuration: 30, // minutes
        requiredSections: ['REASON_FOR_VISIT', 'PROBLEM', 'ALLERGIES', 'VITAL_SIGNS']
      },
      inpatient: {
        minDuration: 1440, // 24 hours
        requiredSections: ['REASON_FOR_VISIT', 'PROBLEM', 'ALLERGIES', 'MEDICATIONS', 'PROCEDURES']
      },
      ambulatory: {
        minDuration: 15, // minutes
        requiredSections: ['REASON_FOR_VISIT', 'PROBLEM', 'ALLERGIES']
      }
    };
    
    const typeCriteria = criteria[encounterType];
    if (!typeCriteria) {
      return {
        reportable: false,
        reason: 'Unknown encounter type'
      };
    }
    
    // TODO: Implement actual checks against encounter data
    // This is a placeholder implementation
    return {
      reportable: true,
      criteria: typeCriteria,
      checkedAt: new Date()
    };
  }
});

export const getMedicationSummary = new ValidatedMethod({
  name: 'healthcare-surveys.getMedicationSummary',
  validate: new SimpleSchema({
    encounterId: { type: String },
    startDate: { type: Date, optional: true },
    endDate: { type: Date, optional: true }
  }).validator(),
  async run({ encounterId, startDate, endDate }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const selector = {
      'context.reference': `Encounter/${encounterId}`
    };
    
    if (startDate || endDate) {
      selector.effectiveDateTime = {};
      if (startDate) {
        selector.effectiveDateTime.$gte = startDate.toISOString();
      }
      if (endDate) {
        selector.effectiveDateTime.$lte = endDate.toISOString();
      }
    }
    
    const administrations = await HcsMedicationAdministration.findAsync(selector).fetch();
    const requests = await HcsMedicationRequest.findAsync({
      'encounter.reference': `Encounter/${encounterId}`
    }).fetch();
    
    return {
      administrations: administrations.length,
      requests: requests.length,
      medications: [...administrations, ...requests],
      summary: {
        totalMedications: administrations.length + requests.length,
        administered: administrations.length,
        requested: requests.length
      }
    };
  }
});

export const getDiagnosticReportSummary = new ValidatedMethod({
  name: 'healthcare-surveys.getDiagnosticReportSummary',
  validate: new SimpleSchema({
    encounterId: { type: String }
  }).validator(),
  async run({ encounterId }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const reports = await HcsDiagnosticReport.findAsync({
      'encounter.reference': `Encounter/${encounterId}`
    }).fetch();
    
    const summary = {
      total: reports.length,
      byStatus: {},
      byCategory: {}
    };
    
    reports.forEach(report => {
      // Count by status
      const status = get(report, 'status', 'unknown');
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
      
      // Count by category
      const categories = get(report, 'category', []);
      categories.forEach(cat => {
        const catCode = get(cat, 'coding[0].code', 'unknown');
        summary.byCategory[catCode] = (summary.byCategory[catCode] || 0) + 1;
      });
    });
    
    return {
      reports,
      summary
    };
  }
});

export const validateSurveyReport = new ValidatedMethod({
  name: 'healthcare-surveys.validateReport',
  validate: new SimpleSchema({
    compositionId: { type: String }
  }).validator(),
  async run({ compositionId }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const composition = await HcsComposition.findOneAsync(compositionId);
    if (!composition) {
      throw new Meteor.Error('not-found', 'Composition not found');
    }
    
    const errors = [];
    const warnings = [];
    
    // Check required sections
    const sections = get(composition, 'section', []);
    const sectionCodes = sections.map(s => get(s, 'code.coding[0].code'));
    
    ['29299-5', '11450-4', '48765-2'].forEach(requiredCode => {
      if (!sectionCodes.includes(requiredCode)) {
        errors.push(`Missing required section: ${requiredCode}`);
      }
    });
    
    // Check each section has text
    sections.forEach(section => {
      if (!get(section, 'text.div')) {
        warnings.push(`Section ${get(section, 'code.coding[0].code')} has no narrative text`);
      }
    });
    
    // Check subject and encounter references
    if (!get(composition, 'subject.reference')) {
      errors.push('Missing subject reference');
    }
    
    if (!get(composition, 'encounter.reference')) {
      errors.push('Missing encounter reference');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date()
    };
  }
});