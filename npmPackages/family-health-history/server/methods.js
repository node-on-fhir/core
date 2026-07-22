// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/family-health-history/server/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// ServerMethods registry (rpc migration). All methods already carry canonical
// dotted 'familyHistory.*' names (no rename → no aliases). The
// `if (!this.userId) throw` guards are deleted in favor of the requireAuth
// default (true). positionalParams preserve the legacy signatures. phi:true —
// these operate over a patient's family health history. Uses the global
// Meteor.ServerMethods per the npmPackages exemplar.
Meteor.ServerMethods.define('familyHistory.generateFamilyTree', {
  description: 'Build a hierarchical family-tree structure for a patient from FamilyMemberHistory resources',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context){
    const patientId = get(params, 'patientId');
    // In production, this would query FamilyMemberHistory resources
    // and construct a hierarchical family tree structure
    const familyTree = {
      patient: {
        id: patientId,
        name: 'Patient',
        relationship: 'self',
        generation: 0,
        conditions: []
      },
      generations: {
        '-2': [], // Great-grandparents
        '-1': [], // Grandparents  
        '0': [],  // Patient generation (siblings)
        '1': [],  // Children
        '2': []   // Grandchildren
      },
      conditions: {},
      statistics: {
        totalFamilyMembers: 0,
        totalConditions: 0,
        generationsRecorded: 0,
        mostCommonConditions: []
      }
    };
    
    return familyTree;
});

Meteor.ServerMethods.define('familyHistory.analyzeHealthPatterns', {
  description: 'Analyze a patient family health history for genetic risk factors and inheritance patterns',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context){
    const patientId = get(params, 'patientId');
    // Analyze genetic patterns and risks
    const analysis = {
      geneticRiskFactors: [
        { condition: 'Diabetes', familyMembers: 3, riskLevel: 'high' },
        { condition: 'Heart Disease', familyMembers: 2, riskLevel: 'moderate' },
        { condition: 'Cancer', familyMembers: 1, riskLevel: 'low' }
      ],
      inheritancePatterns: {
        maternal: ['Diabetes', 'Hypertension'],
        paternal: ['Heart Disease', 'High Cholesterol']
      },
      recommendations: [
        'Regular diabetes screening recommended',
        'Cardiac risk assessment suggested',
        'Genetic counseling may be beneficial'
      ]
    };
    
    return analysis;
});

Meteor.ServerMethods.define('familyHistory.exportReport', {
  description: 'Generate an exportable family-history report for a patient in the requested format',
  phi: true,
  positionalParams: ['patientId', 'format'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' }, format: { type: 'string' } },
    required: ['patientId', 'format']
  }
}, async function(params, context){
    const patientId = get(params, 'patientId');
    const format = get(params, 'format');
    // Generate family history report
    const report = {
      patientId: patientId,
      format: format,
      generatedDate: new Date(),
      familyTreeData: {},
      healthPatterns: {},
      recommendations: []
    };
    
    return report;
});

Meteor.ServerMethods.define('familyHistory.validateUSCore', {
  description: 'Validate a FamilyMemberHistory resource against US Core required elements',
  phi: true,
  positionalParams: ['familyMemberHistoryData'],
  schemaObject: { type: 'object' }
}, async function(params, context){
    const familyMemberHistoryData = params;
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Check required US Core elements
    if (!familyMemberHistoryData.status) {
      validation.errors.push('Status is required per US Core');
      validation.isValid = false;
    }
    
    if (!familyMemberHistoryData.patient?.reference) {
      validation.errors.push('Patient reference is required per US Core');
      validation.isValid = false;
    }
    
    if (!familyMemberHistoryData.relationship?.coding?.[0]?.code) {
      validation.errors.push('Relationship coding is required per US Core');
      validation.isValid = false;
    }
    
    // Check condition coding
    if (familyMemberHistoryData.condition && Array.isArray(familyMemberHistoryData.condition)) {
      familyMemberHistoryData.condition.forEach((condition, index) => {
        if (!condition.code?.coding?.[0]?.system || 
            (!condition.code.coding[0].system.includes('snomed') && 
             !condition.code.coding[0].system.includes('icd'))) {
          validation.warnings.push(`Condition ${index + 1} should use SNOMED CT or ICD-10-CM coding per US Core`);
        }
      });
    }
    
    return validation;
});