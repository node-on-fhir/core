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

    // Set default status if not provided
    if (!cleanConsent.status) {
      cleanConsent.status = 'draft';
    }

    // Ensure dateTime is set
    if (!cleanConsent.dateTime) {
      cleanConsent.dateTime = new Date();
    }

    // Log the action
    HipaaLogger.logEvent({
      eventType: 'create',
      userId: this.userId,
      userName: get(Meteor.user(), 'username', 'Unknown User'),
      collectionName: 'Consents',
      recordId: cleanConsent.id,
      patientId: get(cleanConsent, 'patient.reference'),
      payload: cleanConsent
    });

    try {
      const consentId = await Consents.insertAsync(cleanConsent);
      console.log('Created consent:', consentId);
      return consentId;
    } catch (error) {
      console.error('Error creating consent:', error);
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
    HipaaLogger.logEvent({
      eventType: 'update',
      userId: this.userId,
      userName: get(Meteor.user(), 'username', 'Unknown User'),
      collectionName: 'Consents',
      recordId: consentId,
      patientId: get(cleanConsent, 'patient.reference'),
      payload: cleanConsent
    });

    try {
      const result = await Consents.updateAsync(
        { _id: consentId },
        { $set: cleanConsent }
      );
      console.log('Updated consent:', consentId, result);
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
    HipaaLogger.logEvent({
      eventType: 'delete',
      userId: this.userId,
      userName: get(Meteor.user(), 'username', 'Unknown User'),
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