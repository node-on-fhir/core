// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/drug-formulary/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

// -----------------------------------------------------------------------------
// ServerMethods registry (rpc-migration). Auth guards deleted -> requireAuth
// defaults to true. phi:true on the two patient-scoped methods
// (getPatientPlans, checkPriorAuth); the formulary-lookup methods carry no PHI.

Meteor.ServerMethods.define('formulary.searchDrugs', {
  description: 'Search the drug formulary by RxNorm, NDC, or display name',
  positionalParams: ['searchParams'],
  schemaObject: {
    type: 'object',
    properties: {
      searchParams: {
        type: 'object',
        properties: {
          searchTerm: { type: 'string' },
          searchType: { type: 'string' },
          planId: { type: 'string' },
          tierFilter: { type: 'string' }
        },
        required: ['searchTerm', 'searchType']
      }
    },
    required: ['searchParams']
  }
}, async function(params, context) {
    const searchParams = params.searchParams;

    // In production, this would query FHIR MedicationKnowledge resources
    // Following DaVinci PDEx Formulary specification
    const query = {};
    
    if (searchParams.searchType === 'rxnorm') {
      query['code.coding.code'] = searchParams.searchTerm;
    } else if (searchParams.searchType === 'ndc') {
      query['identifier.value'] = searchParams.searchTerm;
    } else {
      query['code.coding.display'] = new RegExp(searchParams.searchTerm, 'i');
    }
    
    // Would normally query MedicationKnowledge collection
    // return await MedicationKnowledge.findAsync(query).fetchAsync();
    
    return [];
});

Meteor.ServerMethods.define('formulary.getDrugDetails', {
  description: 'Get formulary coverage details for a specific drug and plan',
  positionalParams: ['drugId', 'planId'],
  schemaObject: {
    type: 'object',
    properties: { drugId: { type: 'string' }, planId: { type: 'string' } },
    required: ['drugId']
  }
}, async function(params, context) {
    const drugId = params.drugId;
    const planId = params.planId;

    // Would query FormularyItem resources with coverage details
    return {
      drugId,
      planId,
      tier: 'tier1',
      copay: 10,
      coinsurance: 0,
      priorAuth: false,
      stepTherapy: false,
      quantityLimit: null
    };
});

Meteor.ServerMethods.define('formulary.getAlternatives', {
  description: 'List therapeutic alternatives for a drug under a plan',
  positionalParams: ['drugId', 'planId'],
  schemaObject: {
    type: 'object',
    properties: { drugId: { type: 'string' }, planId: { type: 'string' } },
    required: ['drugId']
  }
}, async function(params, context) {
    const drugId = params.drugId;
    const planId = params.planId;

    // Would search for therapeutic alternatives
    // Based on drug class and formulary preferences
    return [];
});

Meteor.ServerMethods.define('formulary.getPatientPlans', {
  description: 'List the insurance plans covering a given patient',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context) {
    const patientId = params.patientId;

    // Would query Coverage resources for the patient
    // Then retrieve associated InsurancePlan resources
    return [];
});

Meteor.ServerMethods.define('formulary.checkPriorAuth', {
  description: 'Check prior-authorization requirements for a drug, plan, and patient',
  phi: true,
  positionalParams: ['drugId', 'planId', 'patientId'],
  schemaObject: {
    type: 'object',
    properties: {
      drugId: { type: 'string' },
      planId: { type: 'string' },
      patientId: { type: 'string' }
    },
    required: ['drugId', 'planId', 'patientId']
  }
}, async function(params, context) {
    const drugId = params.drugId;
    const planId = params.planId;
    const patientId = params.patientId;

    // Would check FormularyItem priorAuthorization extension
    return {
      required: false,
      criteria: [],
      forms: []
    };
});