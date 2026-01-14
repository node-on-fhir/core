// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/drug-formulary/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

// Publish formulary drugs based on plan
Meteor.publish('formulary.drugsForPlan', function(planId) {
  check(planId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  // In production, would publish FormularyDrug (MedicationKnowledge) resources
  // filtered by the specified insurance plan
  return this.ready();
});

// Publish patient's available formularies
Meteor.publish('formulary.patientFormularies', function(patientId) {
  check(patientId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  // Would publish Formulary (InsurancePlan) resources
  // available to the patient based on their coverage
  return this.ready();
});

// Publish formulary items with coverage details
Meteor.publish('formulary.coverageDetails', function(drugId, planId) {
  check(drugId, String);
  check(planId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  // Would publish FormularyItem (Basic) resources
  // containing tier, cost-sharing, and restriction details
  return this.ready();
});