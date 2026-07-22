// packages/drug-interactions/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, has } from 'lodash';
import { Random } from 'meteor/random';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

// Import interaction database
import { 
  checkDrugDrugInteraction, 
  checkDrugAllergyInteraction 
} from '../lib/InteractionDatabase';

// rpc-migration: Meteor.methods -> Meteor.ServerMethods.define (npmPackages
// exemplar — GLOBAL Meteor.ServerMethods). Names already dotted-canonical
// (drugInteractions.*), no renames/aliases. checkDrugDrug/checkDrugAllergy were
// guard-less (they only audit-log WHEN a userId is present, never throwing) —
// kept requireAuth: false (public terminology interaction check over supplied
// codes) and phi: false. createDetectedIssue/getCheckHistory had `this.userId`
// guards -> requireAuth (default true); getCheckHistory reads patient data ->
// phi: true, createDetectedIssue implicates patient meds -> phi: true.

/**
 * Check for drug-drug interactions
 * Returns array of interaction alerts
 */
Meteor.ServerMethods.define('drugInteractions.checkDrugDrug', {
  description: 'Check a medication list for known drug-drug interactions',
  // Guard-less pre-migration; a terminology-only interaction check over supplied
  // codes (audit-logs only when a userId is present). Kept public.
  requireAuth: false,
  phi: false,
  positionalParams: ['medications'],
  schemaObject: {
    type: 'object',
    properties: {
      medications: {
        type: 'array',
        items: {
          type: 'object',
          properties: { code: { type: 'string' }, display: { type: 'string' }, system: { type: 'string' } },
          required: ['code', 'display']
        }
      }
    },
    required: ['medications']
  }
}, async function(params, context){
    const medications = params.medications;
    context.log.info('drugInteractions.checkDrugDrug');

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
    if (context.userId) {
      await logInteractionCheck({
        userId: context.userId,
        type: 'drug-drug',
        medicationCount: medications.length,
        interactionsFound: interactions.length,
        timestamp: new Date()
      });
    }

    return interactions;
});

/**
 * Check for drug-allergy interactions
 * Returns array of interaction alerts
 */
Meteor.ServerMethods.define('drugInteractions.checkDrugAllergy', {
  description: 'Check a medication list against an allergy list for drug-allergy interactions',
  // Guard-less pre-migration; terminology-only check over supplied codes. Public.
  requireAuth: false,
  phi: false,
  positionalParams: ['medications', 'allergies'],
  schemaObject: {
    type: 'object',
    properties: {
      medications: {
        type: 'array',
        items: {
          type: 'object',
          properties: { code: { type: 'string' }, display: { type: 'string' }, system: { type: 'string' } },
          required: ['code', 'display']
        }
      },
      allergies: {
        type: 'array',
        items: {
          type: 'object',
          properties: { code: { type: 'string' }, display: { type: 'string' }, system: { type: 'string' } },
          required: ['code', 'display']
        }
      }
    },
    required: ['medications', 'allergies']
  }
}, async function(params, context){
    const medications = params.medications;
    const allergies = params.allergies;
    context.log.info('drugInteractions.checkDrugAllergy');

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
    if (context.userId) {
      await logInteractionCheck({
        userId: context.userId,
        type: 'drug-allergy',
        medicationCount: medications.length,
        allergyCount: allergies.length,
        interactionsFound: interactions.length,
        timestamp: new Date()
      });
    }

    return interactions;
});

/**
 * Create a DetectedIssue FHIR resource for an interaction
 */
Meteor.ServerMethods.define('drugInteractions.createDetectedIssue', {
  description: 'Create a FHIR DetectedIssue resource for a detected drug interaction',
  phi: true,
  positionalParams: ['interactionData'],
  schemaObject: {
    type: 'object',
    properties: {
      interactionData: {
        type: 'object',
        properties: {
          severity: { type: 'string' },
          type: { type: 'string' },
          medications: { type: 'array' },
          detail: { type: 'string' },
          mitigation: { type: 'string' }
        },
        required: ['severity', 'type', 'medications', 'detail']
      }
    },
    required: ['interactionData']
  }
}, async function(params, context){
    const interactionData = params.interactionData;
    context.log.info('drugInteractions.createDetectedIssue');

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
        reference: `Practitioner/${context.userId}`
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
});

/**
 * Get interaction check history for a patient
 */
Meteor.ServerMethods.define('drugInteractions.getCheckHistory', {
  description: 'Return the recorded drug-interaction DetectedIssues for a patient',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context){
    const patientId = params.patientId;
    context.log.debug('drugInteractions.getCheckHistory', { patientId });

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