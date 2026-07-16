// /imports/api/insurancePlans/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { InsurancePlans } from '/imports/lib/schemas/SimpleSchemas/InsurancePlans';

Meteor.methods({
  async 'insurancePlans.create'(insurancePlanData) {
    check(insurancePlanData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create insurance plans');
    }

    // Generate FHIR id if not provided
    const fhirId = insurancePlanData.id || Random.id();

    // Add metadata - set _id to match id for consistent lookups
    const insurancePlan = {
      ...insurancePlanData,
      _id: fhirId,  // Set _id explicitly to match FHIR id
      id: fhirId,
      resourceType: 'InsurancePlan',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    console.log('[insurancePlans.create] Inserting:', fhirId);
    const insurancePlanId = await InsurancePlans._collection.insertAsync(insurancePlan);

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('InsurancePlan created', {
        userId: this.userId,
        insurancePlanId: insurancePlanId,
        fhirId: fhirId,
        timestamp: new Date()
      });
    }

    return insurancePlanId;
  },

  async 'insurancePlans.update'(insurancePlanId, insurancePlanData) {
    check(insurancePlanId, String);
    check(insurancePlanData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update insurance plans');
    }

    // Check if record exists - try _id first, then id
    let existingInsurancePlan = await InsurancePlans.findOneAsync({ _id: insurancePlanId });
    if (!existingInsurancePlan) {
      existingInsurancePlan = await InsurancePlans.findOneAsync({ id: insurancePlanId });
    }
    if (!existingInsurancePlan) {
      throw new Meteor.Error('not-found', 'InsurancePlan not found');
    }

    // Update metadata
    const updatedInsurancePlan = {
      ...insurancePlanData,
      _id: existingInsurancePlan._id,  // Use the actual _id from the found record
      id: existingInsurancePlan.id,    // Preserve the FHIR id
      resourceType: 'InsurancePlan',
      meta: {
        ...get(insurancePlanData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingInsurancePlan, 'meta.versionId', '0')) + 1)
      }
    };

    console.log('[insurancePlans.update] Updating:', insurancePlanId);
    const result = await InsurancePlans._collection.updateAsync(
      { _id: existingInsurancePlan._id },
      { $set: updatedInsurancePlan }
    );

    return result;
  },

  async 'insurancePlans.remove'(insurancePlanId) {
    check(insurancePlanId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove insurance plans');
    }

    // Check if record exists - try _id first, then id
    let existingInsurancePlan = await InsurancePlans.findOneAsync({ _id: insurancePlanId });
    if (!existingInsurancePlan) {
      existingInsurancePlan = await InsurancePlans.findOneAsync({ id: insurancePlanId });
    }
    if (!existingInsurancePlan) {
      throw new Meteor.Error('not-found', 'InsurancePlan not found');
    }

    console.log('[insurancePlans.remove] Removing:', insurancePlanId);
    const result = await InsurancePlans._collection.removeAsync({ _id: existingInsurancePlan._id });

    return result;
  },

  async 'insurancePlans.get'(insurancePlanId) {
    check(insurancePlanId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view insurance plans');
    }

    // Try to find by _id first, then by FHIR id
    let insurancePlan = await InsurancePlans.findOneAsync({ _id: insurancePlanId });
    if (!insurancePlan) {
      insurancePlan = await InsurancePlans.findOneAsync({ id: insurancePlanId });
    }
    if (!insurancePlan) {
      throw new Meteor.Error('not-found', 'InsurancePlan not found');
    }

    return insurancePlan;
  }
});
