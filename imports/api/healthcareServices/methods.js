// /imports/api/healthcareServices/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { HealthcareServices } from '/imports/lib/schemas/SimpleSchemas/HealthcareServices';

Meteor.methods({
  async 'healthcareServices.create'(healthcareServiceData) {
    check(healthcareServiceData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create healthcare services');
    }

    // Generate FHIR id if not provided
    const fhirId = healthcareServiceData.id || Random.id();

    // Add metadata - set _id to match id for consistent lookups
    const healthcareService = {
      ...healthcareServiceData,
      _id: fhirId,  // Set _id explicitly to match FHIR id
      id: fhirId,
      resourceType: 'HealthcareService',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    console.log('[healthcareServices.create] Inserting:', fhirId);
    const healthcareServiceId = await HealthcareServices._collection.insertAsync(healthcareService);

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('HealthcareService created', {
        userId: this.userId,
        healthcareServiceId: healthcareServiceId,
        fhirId: fhirId,
        timestamp: new Date()
      });
    }

    return healthcareServiceId;
  },

  async 'healthcareServices.update'(healthcareServiceId, healthcareServiceData) {
    check(healthcareServiceId, String);
    check(healthcareServiceData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update healthcare services');
    }

    // Check if record exists - try _id first, then id
    let existingHealthcareService = await HealthcareServices.findOneAsync({ _id: healthcareServiceId });
    if (!existingHealthcareService) {
      existingHealthcareService = await HealthcareServices.findOneAsync({ id: healthcareServiceId });
    }
    if (!existingHealthcareService) {
      throw new Meteor.Error('not-found', 'HealthcareService not found');
    }

    // Update metadata
    const updatedHealthcareService = {
      ...healthcareServiceData,
      _id: existingHealthcareService._id,  // Use the actual _id from the found record
      id: existingHealthcareService.id,    // Preserve the FHIR id
      resourceType: 'HealthcareService',
      meta: {
        ...get(healthcareServiceData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingHealthcareService, 'meta.versionId', '0')) + 1)
      }
    };

    console.log('[healthcareServices.update] Updating:', healthcareServiceId);
    const result = await HealthcareServices._collection.updateAsync(
      { _id: existingHealthcareService._id },
      { $set: updatedHealthcareService }
    );

    return result;
  },

  async 'healthcareServices.remove'(healthcareServiceId) {
    check(healthcareServiceId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove healthcare services');
    }

    // Check if record exists - try _id first, then id
    let existingHealthcareService = await HealthcareServices.findOneAsync({ _id: healthcareServiceId });
    if (!existingHealthcareService) {
      existingHealthcareService = await HealthcareServices.findOneAsync({ id: healthcareServiceId });
    }
    if (!existingHealthcareService) {
      throw new Meteor.Error('not-found', 'HealthcareService not found');
    }

    console.log('[healthcareServices.remove] Removing:', healthcareServiceId);
    const result = await HealthcareServices._collection.removeAsync({ _id: existingHealthcareService._id });

    return result;
  },

  async 'healthcareServices.get'(healthcareServiceId) {
    check(healthcareServiceId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view healthcare services');
    }

    // Try to find by _id first, then by FHIR id
    let healthcareService = await HealthcareServices.findOneAsync({ _id: healthcareServiceId });
    if (!healthcareService) {
      healthcareService = await HealthcareServices.findOneAsync({ id: healthcareServiceId });
    }
    if (!healthcareService) {
      throw new Meteor.Error('not-found', 'HealthcareService not found');
    }

    return healthcareService;
  }
});
