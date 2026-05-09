// /imports/api/consents/methods.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { FhirUtilities } from '../../lib/FhirUtilities';
import { HipaaLogger } from '../../lib/HipaaLogger';

Meteor.methods({
  async createConsent(consentData) {
    check(consentData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a consent');
    }

    // Clean the data
    const cleanConsent = {
      ...consentData,
      resourceType: 'Consent',
      id: consentData.id || Random.id(),
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      }
    };
    
    // Debug logging
    console.log('=== createConsent DEBUG ===');
    console.log('policyRule:', JSON.stringify(cleanConsent.policyRule, null, 2));
    console.log('note:', JSON.stringify(cleanConsent.note, null, 2));
    console.log('status:', cleanConsent.status);
    console.log('category:', JSON.stringify(cleanConsent.category, null, 2));
    console.log('patient:', JSON.stringify(cleanConsent.patient, null, 2));

    // Set default status if not provided
    if (!cleanConsent.status) {
      cleanConsent.status = 'draft';
    }

    // Ensure dateTime is set
    if (!cleanConsent.dateTime) {
      cleanConsent.dateTime = new Date();
    }

    // Log the action
    const currentUser = await Meteor.userAsync();
    HipaaLogger.logEvent({
      eventType: 'create',
      userId: this.userId,
      userName: get(currentUser, 'username', 'Unknown User'),
      collectionName: 'Consents',
      recordId: cleanConsent.id,
      patientId: get(cleanConsent, 'patient.reference'),
      payload: cleanConsent
    });

    try {
      console.log('Calling Consents.insertAsync...');
      const consentId = await Consents.insertAsync(cleanConsent);
      console.log('✓ Created consent with ID:', consentId);

      // Verify it was saved correctly
      const saved = await Consents.findOneAsync({_id: consentId});
      if (saved) {
        console.log('✓ Verified saved consent:');
        console.log('  policyRule.text:', saved.policyRule?.text);
        console.log('  note[0].text:', saved.note?.[0]?.text);
        console.log('  status:', saved.status);
      } else {
        console.error('✗ WARNING: Consent not found immediately after insert!');
      }

      return consentId;
    } catch (error) {
      console.error('✗ Error creating consent:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },

  async updateConsent(consentId, consentData) {
    check(consentId, String);
    check(consentData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a consent');
    }

    // Clean the data
    const cleanConsent = {
      ...consentData,
      meta: {
        ...consentData.meta,
        versionId: String(parseInt(get(consentData, 'meta.versionId', '0')) + 1),
        lastUpdated: new Date()
      }
    };

    // Remove fields that shouldn't be updated
    delete cleanConsent._id;
    delete cleanConsent._document;

    // Log the action
    const currentUser = await Meteor.userAsync();
    HipaaLogger.logEvent({
      eventType: 'update',
      userId: this.userId,
      userName: get(currentUser, 'username', 'Unknown User'),
      collectionName: 'Consents',
      recordId: consentId,
      patientId: get(cleanConsent, 'patient.reference'),
      payload: cleanConsent
    });

    try {
      // Detailed logging for debugging
      console.log('=== updateConsent DEBUG ===');
      console.log('Consent ID:', consentId);
      console.log('cleanConsent.category:', JSON.stringify(cleanConsent.category, null, 2));
      console.log('cleanConsent.status:', cleanConsent.status);

      // Check if consent exists before update
      const existingConsent = await Consents.findOneAsync({ _id: consentId });
      console.log('Existing consent found?', !!existingConsent);
      if (existingConsent) {
        console.log('Existing category:', JSON.stringify(existingConsent.category, null, 2));
        console.log('Existing status:', existingConsent.status);
      } else {
        console.error('CRITICAL: Consent not found with _id:', consentId);
      }

      const result = await Consents.updateAsync(
        { _id: consentId },
        { $set: cleanConsent }
      );
      console.log('Update result (number of docs updated):', result);

      if (result === 0) {
        console.error('WARNING: Update returned 0 - no documents were updated!');
        console.error('This usually means schema validation failed or document not found');
      }

      return consentId;
    } catch (error) {
      console.error('Error updating consent:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  async removeConsent(consentId) {
    check(consentId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete a consent');
    }

    // Get the consent for logging
    const consent = await Consents.findOneAsync({ _id: consentId });
    if (!consent) {
      throw new Meteor.Error('not-found', 'Consent not found');
    }

    // Log the action
    const currentUser = await Meteor.userAsync();
    HipaaLogger.logEvent({
      eventType: 'delete',
      userId: this.userId,
      userName: get(currentUser, 'username', 'Unknown User'),
      collectionName: 'Consents',
      recordId: consentId,
      patientId: get(consent, 'patient.reference'),
      payload: consent
    });

    try {
      const result = await Consents.removeAsync({ _id: consentId });
      console.log('Removed consent:', consentId, result);
      return result;
    } catch (error) {
      console.error('Error removing consent:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  }
});