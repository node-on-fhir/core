// /imports/api/measures/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';

Meteor.methods({
  async createMeasure(measureData) {
    console.log('[createMeasure] Starting with data:', measureData);
    
    check(measureData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create measures');
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    
    const cleanMeasure = {
      resourceType: 'Measure',
      status: measureData.status || 'draft',
      identifier: [{
        system: 'http://example.org/measure-identifiers',
        value: measureData.identifier || `MEASURE-${Date.now()}`
      }],
      version: measureData.version || '1.0.0',
      name: measureData.name,
      title: measureData.title,
      description: measureData.description,
      purpose: measureData.purpose,
      usage: measureData.usage,
      copyright: measureData.copyright,
      date: moment().toISOString(),
      publisher: get(user, 'profile.name.text', get(user, 'username', 'Unknown')),
      guidance: measureData.guidance,
      rateAggregation: measureData.rateAggregation,
      clinicalRecommendationStatement: measureData.clinicalRecommendationStatement,
      disclaimer: measureData.disclaimer,
      riskAdjustment: measureData.riskAdjustment,
      rationale: measureData.rationale,
      author: [{
        name: get(user, 'profile.name.text', get(user, 'username', 'Unknown')),
        reference: `Practitioner/${this.userId}`
      }]
    };

    // Add dates if provided
    if (measureData.approvalDate) {
      cleanMeasure.approvalDate = moment(measureData.approvalDate).toISOString();
    }
    if (measureData.lastReviewDate) {
      cleanMeasure.lastReviewDate = moment(measureData.lastReviewDate).toISOString();
    }

    // Add effective period if provided
    if (measureData.effectivePeriodStart || measureData.effectivePeriodEnd) {
      cleanMeasure.effectivePeriod = {};
      if (measureData.effectivePeriodStart) {
        cleanMeasure.effectivePeriod.start = moment(measureData.effectivePeriodStart).toISOString();
      }
      if (measureData.effectivePeriodEnd) {
        cleanMeasure.effectivePeriod.end = moment(measureData.effectivePeriodEnd).toISOString();
      }
    }

    // Add improvement notation if provided
    if (measureData.improvementNotation) {
      const notations = {
        'increase': 'Increased score indicates improvement',
        'decrease': 'Decreased score indicates improvement'
      };
      
      cleanMeasure.improvementNotation = {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/measure-improvement-notation',
          code: measureData.improvementNotation,
          display: notations[measureData.improvementNotation] || measureData.improvementNotation
        }]
      };
    }

    // Set ID
    cleanMeasure.id = Random.id();
    
    // Set _id based on environment variable (for testing with mixed ObjectID/String datasets)
    if (process.env.USE_MONGO_OBJECTID) {
      const { Mongo } = Package.mongo;
      const objectId = new Mongo.ObjectID();
      cleanMeasure._id = objectId.toHexString();
      console.log('[createMeasure] Using MongoDB ObjectID (as hex string):', cleanMeasure._id);
    } else {
      cleanMeasure._id = cleanMeasure.id;
      console.log('[createMeasure] Using Meteor string ID:', cleanMeasure._id);
    }
    
    console.log('[createMeasure] Inserting measure:', cleanMeasure);
    
    try {
      const measureId = await Measures.insertAsync(cleanMeasure);
      console.log('[createMeasure] Created measure with ID:', measureId);
      return measureId;
    } catch (error) {
      console.error('[createMeasure] Error:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create measure', error.message);
    }
  },

  async updateMeasure(measureId, measureData) {
    console.log('[updateMeasure] Starting with ID:', measureId, 'data:', measureData);
    
    check(measureId, String);
    check(measureData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update measures');
    }

    const existingMeasure = await Measures.findOneAsync({ _id: measureId });
    if (!existingMeasure) {
      throw new Meteor.Error('not-found', 'Measure not found');
    }

    const updateData = {
      status: measureData.status || existingMeasure.status,
      version: measureData.version || existingMeasure.version,
      name: measureData.name || existingMeasure.name,
      title: measureData.title || existingMeasure.title,
      description: measureData.description || existingMeasure.description,
      purpose: measureData.purpose || existingMeasure.purpose,
      usage: measureData.usage || existingMeasure.usage,
      copyright: measureData.copyright || existingMeasure.copyright,
      guidance: measureData.guidance || existingMeasure.guidance,
      rateAggregation: measureData.rateAggregation || existingMeasure.rateAggregation,
      clinicalRecommendationStatement: measureData.clinicalRecommendationStatement || existingMeasure.clinicalRecommendationStatement,
      disclaimer: measureData.disclaimer || existingMeasure.disclaimer,
      riskAdjustment: measureData.riskAdjustment || existingMeasure.riskAdjustment,
      rationale: measureData.rationale || existingMeasure.rationale,
      date: moment().toISOString()
    };

    // Update identifier if provided
    if (measureData.identifier) {
      updateData.identifier = [{
        system: 'http://example.org/measure-identifiers',
        value: measureData.identifier
      }];
    }

    // Update dates if provided
    if (measureData.approvalDate) {
      updateData.approvalDate = moment(measureData.approvalDate).toISOString();
    }
    if (measureData.lastReviewDate) {
      updateData.lastReviewDate = moment(measureData.lastReviewDate).toISOString();
    }

    // Update effective period if provided
    if (measureData.effectivePeriodStart || measureData.effectivePeriodEnd) {
      updateData.effectivePeriod = existingMeasure.effectivePeriod || {};
      if (measureData.effectivePeriodStart) {
        updateData.effectivePeriod.start = moment(measureData.effectivePeriodStart).toISOString();
      }
      if (measureData.effectivePeriodEnd) {
        updateData.effectivePeriod.end = moment(measureData.effectivePeriodEnd).toISOString();
      }
    }

    // Update improvement notation if provided
    if (measureData.improvementNotation) {
      const notations = {
        'increase': 'Increased score indicates improvement',
        'decrease': 'Decreased score indicates improvement'
      };
      
      updateData.improvementNotation = {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/measure-improvement-notation',
          code: measureData.improvementNotation,
          display: notations[measureData.improvementNotation] || measureData.improvementNotation
        }]
      };
    }

    console.log('[updateMeasure] Updating with data:', updateData);
    
    try {
      const result = await Measures.updateAsync(
        { _id: measureId },
        { $set: updateData }
      );
      console.log('[updateMeasure] Update result:', result);
      return result;
    } catch (error) {
      console.error('[updateMeasure] Error:', error);
      throw new Meteor.Error('update-failed', 'Failed to update measure', error.message);
    }
  },

  async removeMeasure(measureId) {
    console.log('[removeMeasure] Starting with ID:', measureId);
    
    check(measureId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete measures');
    }

    const existingMeasure = await Measures.findOneAsync({ _id: measureId });
    if (!existingMeasure) {
      throw new Meteor.Error('not-found', 'Measure not found');
    }

    console.log('[removeMeasure] Removing measure:', measureId);
    
    try {
      const result = await Measures.removeAsync({ _id: measureId });
      console.log('[removeMeasure] Remove result:', result);
      return result;
    } catch (error) {
      console.error('[removeMeasure] Error:', error);
      throw new Meteor.Error('remove-failed', 'Failed to delete measure', error.message);
    }
  }
});