// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/clinical-lists/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  // Condition methods for Problem List
  'clinicalLists.conditions.insert': async function(conditionData) {
    check(conditionData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const Conditions = global.Collections?.Conditions;
    if (!Conditions) {
      throw new Meteor.Error('not-found', 'Conditions collection not available');
    }
    
    conditionData.meta = {
      profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition'],
      versionId: '1',
      lastUpdated: new Date().toISOString()
    };
    
    return await Conditions.insertAsync(conditionData);
  },
  
  'clinicalLists.conditions.update': async function(conditionId, conditionData) {
    check(conditionId, String);
    check(conditionData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const Conditions = global.Collections?.Conditions;
    if (!Conditions) {
      throw new Meteor.Error('not-found', 'Conditions collection not available');
    }
    
    conditionData.meta = {
      ...conditionData.meta,
      versionId: String(parseInt(conditionData.meta?.versionId || '1') + 1),
      lastUpdated: new Date().toISOString()
    };
    
    return await Conditions.updateAsync(conditionId, { $set: conditionData });
  },
  
  'clinicalLists.conditions.remove': async function(conditionId) {
    check(conditionId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const Conditions = global.Collections?.Conditions;
    if (!Conditions) {
      throw new Meteor.Error('not-found', 'Conditions collection not available');
    }
    
    return await Conditions.removeAsync(conditionId);
  },
  
  // AllergyIntolerance methods for Medication Allergy List
  'clinicalLists.allergyIntolerances.insert': async function(allergyData) {
    check(allergyData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const AllergyIntolerances = global.Collections?.AllergyIntolerances;
    if (!AllergyIntolerances) {
      throw new Meteor.Error('not-found', 'AllergyIntolerances collection not available');
    }
    
    allergyData.meta = {
      profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-allergyintolerance'],
      versionId: '1',
      lastUpdated: new Date().toISOString()
    };
    
    return await AllergyIntolerances.insertAsync(allergyData);
  },
  
  'clinicalLists.allergyIntolerances.update': async function(allergyId, allergyData) {
    check(allergyId, String);
    check(allergyData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const AllergyIntolerances = global.Collections?.AllergyIntolerances;
    if (!AllergyIntolerances) {
      throw new Meteor.Error('not-found', 'AllergyIntolerances collection not available');
    }
    
    allergyData.meta = {
      ...allergyData.meta,
      versionId: String(parseInt(allergyData.meta?.versionId || '1') + 1),
      lastUpdated: new Date().toISOString()
    };
    
    return await AllergyIntolerances.updateAsync(allergyId, { $set: allergyData });
  },
  
  'clinicalLists.allergyIntolerances.remove': async function(allergyId) {
    check(allergyId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const AllergyIntolerances = global.Collections?.AllergyIntolerances;
    if (!AllergyIntolerances) {
      throw new Meteor.Error('not-found', 'AllergyIntolerances collection not available');
    }
    
    return await AllergyIntolerances.removeAsync(allergyId);
  },
  
  // MedicationStatement methods for Medication List
  'clinicalLists.medicationStatements.insert': async function(medicationData) {
    check(medicationData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const MedicationStatements = global.Collections?.MedicationStatements;
    if (!MedicationStatements) {
      throw new Meteor.Error('not-found', 'MedicationStatements collection not available');
    }
    
    medicationData.meta = {
      profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationstatement'],
      versionId: '1',
      lastUpdated: new Date().toISOString()
    };
    
    return await MedicationStatements.insertAsync(medicationData);
  },
  
  'clinicalLists.medicationStatements.update': async function(medicationId, medicationData) {
    check(medicationId, String);
    check(medicationData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const MedicationStatements = global.Collections?.MedicationStatements;
    if (!MedicationStatements) {
      throw new Meteor.Error('not-found', 'MedicationStatements collection not available');
    }
    
    medicationData.meta = {
      ...medicationData.meta,
      versionId: String(parseInt(medicationData.meta?.versionId || '1') + 1),
      lastUpdated: new Date().toISOString()
    };
    
    return await MedicationStatements.updateAsync(medicationId, { $set: medicationData });
  },
  
  'clinicalLists.medicationStatements.remove': async function(medicationId) {
    check(medicationId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const MedicationStatements = global.Collections?.MedicationStatements;
    if (!MedicationStatements) {
      throw new Meteor.Error('not-found', 'MedicationStatements collection not available');
    }
    
    return await MedicationStatements.removeAsync(medicationId);
  }
});