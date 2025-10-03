// packages/drug-interactions/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, has } from 'lodash';
import { Random } from 'meteor/random';

// Import interaction database
import { 
  checkDrugDrugInteraction, 
  checkDrugAllergyInteraction 
} from '../lib/InteractionDatabase';

Meteor.methods({
  /**
   * Check for drug-drug interactions
   * Returns array of interaction alerts
   */
  'drugInteractions.checkDrugDrug': async function(medications) {
    console.log('DrugInteractions.checkDrugDrug', medications);
    
    check(medications, [{
      code: String,
      display: String,
      system: Match.Optional(String)
    }]);
    
    const interactions = [];
    const checkedPairs = new Set();
    
    // Check all medication pairs
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const pairKey = [medications[i].code, medications[j].code].sort().join('-');
        
        if (!checkedPairs.has(pairKey)) {
          checkedPairs.add(pairKey);
          
          const interaction = checkDrugDrugInteraction(
            medications[i].code,
            medications[j].code
          );
          
          if (interaction) {
            interactions.push({
              ...interaction,
              drug1: medications[i],
              drug2: medications[j],
              detectedAt: new Date(),
              id: Random.id()
            });
          }
        }
      }
    }
    
    // Log interaction check for audit
    if (this.userId) {
      await logInteractionCheck({
        userId: this.userId,
        type: 'drug-drug',
        medicationCount: medications.length,
        interactionsFound: interactions.length,
        timestamp: new Date()
      });
    }
    
    return interactions;
  },

  /**
   * Check for drug-allergy interactions
   * Returns array of interaction alerts
   */
  'drugInteractions.checkDrugAllergy': async function(medications, allergies) {
    console.log('DrugInteractions.checkDrugAllergy', medications, allergies);
    
    check(medications, [{
      code: String,
      display: String,
      system: Match.Optional(String)
    }]);
    
    check(allergies, [{
      code: String,
      display: String,
      system: Match.Optional(String)
    }]);
    
    const interactions = [];
    
    for (let medication of medications) {
      for (let allergy of allergies) {
        const interaction = checkDrugAllergyInteraction(
          medication.code,
          allergy.code
        );
        
        if (interaction) {
          interactions.push({
            ...interaction,
            drug: medication,
            allergy: allergy,
            detectedAt: new Date(),
            id: Random.id()
          });
        }
      }
    }
    
    // Log interaction check for audit
    if (this.userId) {
      await logInteractionCheck({
        userId: this.userId,
        type: 'drug-allergy',
        medicationCount: medications.length,
        allergyCount: allergies.length,
        interactionsFound: interactions.length,
        timestamp: new Date()
      });
    }
    
    return interactions;
  },

  /**
   * Create a DetectedIssue FHIR resource for an interaction
   */
  'drugInteractions.createDetectedIssue': async function(interactionData) {
    console.log('DrugInteractions.createDetectedIssue', interactionData);
    
    check(interactionData, {
      severity: String,
      type: String, // 'drug-drug' or 'drug-allergy'
      medications: Array,
      detail: String,
      mitigation: Match.Optional(String)
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to create DetectedIssue');
    }
    
    // Create FHIR DetectedIssue resource
    const detectedIssue = {
      resourceType: 'DetectedIssue',
      id: Random.id(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      },
      status: 'preliminary',
      severity: mapSeverityToFHIR(interactionData.severity),
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: interactionData.type === 'drug-drug' ? 'DRG' : 'DALG',
          display: interactionData.type === 'drug-drug' 
            ? 'Drug Interaction Alert' 
            : 'Drug Allergy Alert'
        }]
      },
      detail: interactionData.detail,
      identified: new Date().toISOString(),
      author: {
        reference: `Practitioner/${this.userId}`
      },
      implicated: interactionData.medications.map(med => ({
        reference: `MedicationRequest/${med.id || Random.id()}`,
        display: med.display
      }))
    };
    
    if (interactionData.mitigation) {
      detectedIssue.mitigation = [{
        action: {
          text: interactionData.mitigation
        },
        date: new Date().toISOString()
      }];
    }
    
    // Store in DetectedIssues collection if available
    if (global.Collections?.DetectedIssues) {
      const DetectedIssues = await global.Collections.DetectedIssues;
      if (DetectedIssues && typeof DetectedIssues.insertAsync === 'function') {
        const issueId = await DetectedIssues.insertAsync(detectedIssue);
        console.log('Created DetectedIssue:', issueId);
        return issueId;
      }
    }
    
    // Return the resource even if we can't store it
    return detectedIssue;
  },

  /**
   * Get interaction check history for a patient
   */
  'drugInteractions.getCheckHistory': async function(patientId) {
    console.log('DrugInteractions.getCheckHistory', patientId);
    
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to view check history');
    }
    
    // Get DetectedIssues for this patient if collection is available
    if (global.Collections?.DetectedIssues) {
      const DetectedIssues = await global.Collections.DetectedIssues;
      if (DetectedIssues && typeof DetectedIssues.findAsync === 'function') {
        const issues = await DetectedIssues.findAsync({
          'patient.reference': `Patient/${patientId}`
        }, {
          sort: { identified: -1 },
          limit: 20
        }).fetchAsync();
        
        return issues;
      }
    }
    
    return [];
  }
});

// Helper function to map severity to FHIR
function mapSeverityToFHIR(severity) {
  switch(severity) {
    case 'contraindicated':
    case 'severe':
      return 'high';
    case 'moderate':
      return 'moderate';
    case 'minor':
      return 'low';
    default:
      return 'moderate';
  }
}

// Helper function to log interaction checks for audit
async function logInteractionCheck(checkData) {
  // Create AuditEvent for ONC compliance
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'Drug Interaction Check'
    },
    subtype: [{
      system: 'http://hl7.org/fhir/restful-interaction',
      code: 'search',
      display: checkData.type === 'drug-drug' ? 'Drug-Drug Check' : 'Drug-Allergy Check'
    }],
    action: 'E', // Execute
    recorded: checkData.timestamp.toISOString(),
    outcome: '0', // Success
    agent: [{
      who: {
        reference: `Practitioner/${checkData.userId}`
      },
      requestor: true
    }],
    source: {
      site: 'Honeycomb Drug Interaction Module',
      type: [{
        system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
        code: '4',
        display: 'Application Server'
      }]
    },
    entity: [{
      what: {
        reference: 'DrugInteractionCheck',
        display: `${checkData.medicationCount} medications, ${checkData.interactionsFound} interactions found`
      }
    }]
  };
  
  // Store in AuditEvents collection if available
  if (global.Collections?.AuditEvents) {
    const AuditEvents = await global.Collections.AuditEvents;
    if (AuditEvents && typeof AuditEvents.insertAsync === 'function') {
      await AuditEvents.insertAsync(auditEvent);
      console.log('Logged interaction check audit event');
    }
  }
  
  return auditEvent;
}