// /imports/api/healthcareServices/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import moment from 'moment';

import { HealthcareServices } from '/imports/lib/schemas/SimpleSchemas/HealthcareServices';

Meteor.methods({
  async 'healthcareServices.create'(healthcareServiceData) {
    check(healthcareServiceData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create healthcare services');
    }

    console.log('=== healthcareServices.create called ===');
    console.log('User ID:', this.userId);
    console.log('HealthcareService data received:', JSON.stringify(healthcareServiceData, null, 2));

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

    console.log('HealthcareService to insert:', JSON.stringify(healthcareService, null, 2));

    // Insert and return the new healthcare service
    const healthcareServiceId = await HealthcareServices._collection.insertAsync(healthcareService);
    console.log('Successfully inserted healthcare service with _id:', healthcareServiceId);

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

    // Check if healthcare service exists - try _id first, then id
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

    // Update the healthcare service using the actual _id
    const result = await HealthcareServices._collection.updateAsync(
      { _id: existingHealthcareService._id },
      { $set: updatedHealthcareService }
    );

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('HealthcareService updated', {
        userId: this.userId,
        healthcareServiceId: healthcareServiceId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'healthcareServices.remove'(healthcareServiceId) {
    check(healthcareServiceId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove healthcare services');
    }

    // Check if healthcare service exists - try _id first, then id
    let existingHealthcareService = await HealthcareServices.findOneAsync({ _id: healthcareServiceId });
    if (!existingHealthcareService) {
      existingHealthcareService = await HealthcareServices.findOneAsync({ id: healthcareServiceId });
    }
    if (!existingHealthcareService) {
      throw new Meteor.Error('not-found', 'HealthcareService not found');
    }

    // Remove the healthcare service using the actual _id
    const result = await HealthcareServices._collection.removeAsync({ _id: existingHealthcareService._id });

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('HealthcareService removed', {
        userId: this.userId,
        healthcareServiceId: healthcareServiceId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'healthcareServices.get'(healthcareServiceId) {
    check(healthcareServiceId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view healthcare services');
    }

    console.log('=== healthcareServices.get called with healthcareServiceId:', healthcareServiceId);

    // Try to find by _id first, then by id
    let healthcareService = await HealthcareServices.findOneAsync({ _id: healthcareServiceId });

    if (!healthcareService) {
      console.log('Not found by _id, trying by FHIR id...');
      healthcareService = await HealthcareServices.findOneAsync({ id: healthcareServiceId });
    }

    if (!healthcareService) {
      console.log('HealthcareService not found with _id or id:', healthcareServiceId);
      const allHealthcareServices = await HealthcareServices.find({}, { limit: 5 }).fetchAsync();
      console.log('Sample healthcare services in DB:', allHealthcareServices.map(o => ({ _id: o._id, id: o.id })));
      throw new Meteor.Error('not-found', 'HealthcareService not found');
    }

    console.log('Found healthcare service:', { _id: healthcareService._id, id: healthcareService.id });
    return healthcareService;
  }
});
