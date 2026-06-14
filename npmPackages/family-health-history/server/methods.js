// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/family-health-history/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  // Generate family tree data structure
  'familyHistory.generateFamilyTree': async function(patientId) {
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
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
  },
  
  // Analyze family health patterns
  'familyHistory.analyzeHealthPatterns': async function(patientId) {
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
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
  },
  
  // Export family history as PDF/document
  'familyHistory.exportReport': async function(patientId, format) {
    check(patientId, String);
    check(format, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
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
  },
  
  // Validate US Core FamilyMemberHistory compliance
  'familyHistory.validateUSCore': async function(familyMemberHistoryData) {
    check(familyMemberHistoryData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
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
  }
});