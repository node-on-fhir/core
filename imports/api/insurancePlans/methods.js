// /imports/api/insurancePlans/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import moment from 'moment';

import { InsurancePlans } from '/imports/lib/schemas/SimpleSchemas/InsurancePlans';

Meteor.methods({
  async 'insurancePlans.create'(insurancePlanData) {
    check(insurancePlanData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create insurance plans');
    }

    console.log('=== insurancePlans.create called ===');
    console.log('User ID:', this.userId);
    console.log('InsurancePlan data received:', JSON.stringify(insurancePlanData, null, 2));

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

    console.log('InsurancePlan to insert:', JSON.stringify(insurancePlan, null, 2));

    // Insert and return the new insurance plan
    const insurancePlanId = await InsurancePlans._collection.insertAsync(insurancePlan);
    console.log('Successfully inserted insurance plan with _id:', insurancePlanId);

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

    // Check if insurance plan exists - try _id first, then id
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

    // Update the insurance plan using the actual _id
    const result = await InsurancePlans._collection.updateAsync(
      { _id: existingInsurancePlan._id },
      { $set: updatedInsurancePlan }
    );

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('InsurancePlan updated', {
        userId: this.userId,
        insurancePlanId: insurancePlanId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'insurancePlans.remove'(insurancePlanId) {
    check(insurancePlanId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove insurance plans');
    }

    // Check if insurance plan exists - try _id first, then id
    let existingInsurancePlan = await InsurancePlans.findOneAsync({ _id: insurancePlanId });
    if (!existingInsurancePlan) {
      existingInsurancePlan = await InsurancePlans.findOneAsync({ id: insurancePlanId });
    }
    if (!existingInsurancePlan) {
      throw new Meteor.Error('not-found', 'InsurancePlan not found');
    }

    // Remove the insurance plan using the actual _id
    const result = await InsurancePlans._collection.removeAsync({ _id: existingInsurancePlan._id });

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('InsurancePlan removed', {
        userId: this.userId,
        insurancePlanId: insurancePlanId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'insurancePlans.get'(insurancePlanId) {
    check(insurancePlanId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view insurance plans');
    }

    console.log('=== insurancePlans.get called with insurancePlanId:', insurancePlanId);

    // Try to find by _id first, then by id
    let insurancePlan = await InsurancePlans.findOneAsync({ _id: insurancePlanId });

    if (!insurancePlan) {
      console.log('Not found by _id, trying by FHIR id...');
      insurancePlan = await InsurancePlans.findOneAsync({ id: insurancePlanId });
    }

    if (!insurancePlan) {
      console.log('InsurancePlan not found with _id or id:', insurancePlanId);
      const allInsurancePlans = await InsurancePlans.find({}, { limit: 5 }).fetchAsync();
      console.log('Sample insurance plans in DB:', allInsurancePlans.map(o => ({ _id: o._id, id: o.id })));
      throw new Meteor.Error('not-found', 'InsurancePlan not found');
    }

    console.log('Found insurance plan:', { _id: insurancePlan._id, id: insurancePlan.id });
    return insurancePlan;
  }
});
