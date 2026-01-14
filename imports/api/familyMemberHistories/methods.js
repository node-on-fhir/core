// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/familyMemberHistories/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { FamilyMemberHistories } from '/imports/lib/schemas/SimpleSchemas/FamilyMemberHistories';

Meteor.methods({
  'createFamilyMemberHistory': async function(familyMemberHistoryData) {
    check(familyMemberHistoryData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to create family member history');
    }

    console.log('Creating family member history:', familyMemberHistoryData);

    let cleanFamilyMemberHistory = {
      resourceType: 'FamilyMemberHistory',
      status: familyMemberHistoryData.status || 'partial',
      patient: {
        reference: familyMemberHistoryData.patient?.reference || '',
        display: familyMemberHistoryData.patient?.display || ''
      },
      relationship: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
          code: familyMemberHistoryData.relationship?.coding?.[0]?.code || '',
          display: familyMemberHistoryData.relationship?.coding?.[0]?.display || ''
        }],
        text: familyMemberHistoryData.relationship?.text || familyMemberHistoryData.relationship?.coding?.[0]?.display || ''
      }
    };

    // Optional fields
    if (familyMemberHistoryData.name) {
      cleanFamilyMemberHistory.name = familyMemberHistoryData.name;
    }

    if (familyMemberHistoryData.sex) {
      cleanFamilyMemberHistory.sex = familyMemberHistoryData.sex;
    }

    if (familyMemberHistoryData.bornDate) {
      cleanFamilyMemberHistory.bornDate = familyMemberHistoryData.bornDate;
    }

    if (familyMemberHistoryData.ageAge?.value) {
      cleanFamilyMemberHistory.ageAge = {
        value: familyMemberHistoryData.ageAge.value,
        unit: familyMemberHistoryData.ageAge.unit || 'years'
      };
    }

    if (familyMemberHistoryData.deceasedBoolean !== undefined) {
      cleanFamilyMemberHistory.deceasedBoolean = familyMemberHistoryData.deceasedBoolean;
    }

    if (familyMemberHistoryData.deceasedAge?.value) {
      cleanFamilyMemberHistory.deceasedAge = {
        value: familyMemberHistoryData.deceasedAge.value,
        unit: familyMemberHistoryData.deceasedAge.unit || 'years'
      };
    }

    if (familyMemberHistoryData.deceasedDate) {
      cleanFamilyMemberHistory.deceasedDate = familyMemberHistoryData.deceasedDate;
    }

    // Handle conditions array
    if (Array.isArray(familyMemberHistoryData.condition) && familyMemberHistoryData.condition.length > 0) {
      cleanFamilyMemberHistory.condition = familyMemberHistoryData.condition.map(condition => {
        let cleanCondition = {
          code: {
            coding: [{
              system: condition.code?.coding?.[0]?.system || 'http://snomed.info/sct',
              code: condition.code?.coding?.[0]?.code || condition.code?.text?.replace(/\s+/g, '-').toLowerCase(),
              display: condition.code?.coding?.[0]?.display || condition.code?.text
            }],
            text: condition.code?.text || condition.code?.coding?.[0]?.display
          }
        };

        if (condition.onsetAge?.value) {
          cleanCondition.onsetAge = condition.onsetAge;
        }

        if (condition.note && Array.isArray(condition.note) && condition.note[0]?.text) {
          cleanCondition.note = condition.note;
        }

        return cleanCondition;
      });
    }

    // Add notes if provided
    if (familyMemberHistoryData.note) {
      if (typeof familyMemberHistoryData.note === 'string') {
        cleanFamilyMemberHistory.note = [{
          text: familyMemberHistoryData.note
        }];
      } else if (Array.isArray(familyMemberHistoryData.note)) {
        cleanFamilyMemberHistory.note = familyMemberHistoryData.note;
      }
    }

    // Metadata
    cleanFamilyMemberHistory.meta = {
      versionId: '1',
      lastUpdated: new Date()
    };

    console.log('Clean family member history to insert:', cleanFamilyMemberHistory);

    try {
      const newId = await FamilyMemberHistories.insertAsync(cleanFamilyMemberHistory);
      console.log('Family member history created with ID:', newId);
      return newId;
    } catch (error) {
      console.error('Error creating family member history:', error);
      throw new Meteor.Error('create-failed', 'Failed to create family member history: ' + error.message);
    }
  },

  'updateFamilyMemberHistory': async function(familyMemberHistoryId, familyMemberHistoryData) {
    check(familyMemberHistoryId, String);
    check(familyMemberHistoryData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to update family member history');
    }

    console.log('Updating family member history:', familyMemberHistoryId, familyMemberHistoryData);

    // Remove internal fields that shouldn't be updated
    delete familyMemberHistoryData._id;
    delete familyMemberHistoryData.id;

    // Update metadata
    if (!familyMemberHistoryData.meta) {
      familyMemberHistoryData.meta = {};
    }
    familyMemberHistoryData.meta.lastUpdated = new Date();
    
    // Increment version
    const currentRecord = await FamilyMemberHistories.findOneAsync({_id: familyMemberHistoryId});
    if (currentRecord && currentRecord.meta && currentRecord.meta.versionId) {
      const currentVersion = parseInt(currentRecord.meta.versionId) || 1;
      familyMemberHistoryData.meta.versionId = String(currentVersion + 1);
    } else {
      familyMemberHistoryData.meta.versionId = '2';
    }

    try {
      const result = await FamilyMemberHistories.updateAsync(
        { _id: familyMemberHistoryId }, 
        { $set: familyMemberHistoryData }
      );
      console.log('Family member history updated:', result);
      return result;
    } catch (error) {
      console.error('Error updating family member history:', error);
      throw new Meteor.Error('update-failed', 'Failed to update family member history: ' + error.message);
    }
  },

  'removeFamilyMemberHistory': async function(familyMemberHistoryId) {
    check(familyMemberHistoryId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to remove family member history');
    }

    console.log('Removing family member history:', familyMemberHistoryId);

    try {
      const result = await FamilyMemberHistories.removeAsync({ _id: familyMemberHistoryId });
      console.log('Family member history removed:', result);
      return result;
    } catch (error) {
      console.error('Error removing family member history:', error);
      throw new Meteor.Error('remove-failed', 'Failed to remove family member history: ' + error.message);
    }
  }
});