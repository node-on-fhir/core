// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/drug-formulary/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  // Search formulary drugs
  'formulary.searchDrugs': async function(searchParams) {
    check(searchParams, {
      searchTerm: String,
      searchType: String,
      planId: Match.Optional(String),
      tierFilter: Match.Optional(String)
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
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
  },
  
  // Get formulary details for a specific drug
  'formulary.getDrugDetails': async function(drugId, planId) {
    check(drugId, String);
    check(planId, Match.Optional(String));
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
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
  },
  
  // Check drug alternatives
  'formulary.getAlternatives': async function(drugId, planId) {
    check(drugId, String);
    check(planId, Match.Optional(String));
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Would search for therapeutic alternatives
    // Based on drug class and formulary preferences
    return [];
  },
  
  // Get patient's insurance plans
  'formulary.getPatientPlans': async function(patientId) {
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Would query Coverage resources for the patient
    // Then retrieve associated InsurancePlan resources
    return [];
  },
  
  // Check prior authorization requirements
  'formulary.checkPriorAuth': async function(drugId, planId, patientId) {
    check(drugId, String);
    check(planId, String);
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Would check FormularyItem priorAuthorization extension
    return {
      required: false,
      criteria: [],
      forms: []
    };
  }
});