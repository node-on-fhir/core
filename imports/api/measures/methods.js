// /imports/api/measures/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import moment from 'moment';

import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';

// Measure definitions are quality-measure admin data (not patient-scoped) —
// no phi flag on these methods. Legacy non-dotted names (createMeasure,
// updateMeasure, removeMeasure) are preserved as aliases.

Meteor.ServerMethods.define('measures.create', {
  description: 'Create a FHIR Measure resource from flattened form data',
  aliases: ['createMeasure'],
  schemaObject: { type: 'object' }
}, async function(params, context){
  const measureData = params;

  context.log.info('createMeasure starting');

  const user = await Meteor.users.findOneAsync(context.userId);

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
      reference: `Practitioner/${context.userId}`
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
    context.log.info('Using MongoDB ObjectID (as hex string)', { _id: cleanMeasure._id });
  } else {
    cleanMeasure._id = cleanMeasure.id;
    context.log.info('Using Meteor string ID', { _id: cleanMeasure._id });
  }

  context.log.debug('Inserting measure', { measure: cleanMeasure });

  try {
    const measureId = await Measures.insertAsync(cleanMeasure);
    context.log.info('Created measure', { measureId: measureId });
    return measureId;
  } catch (error) {
    context.log.error('Error creating measure', { message: error.message });
    throw new Meteor.Error('insert-failed', 'Failed to create measure', error.message);
  }
});

Meteor.ServerMethods.define('measures.update', {
  description: 'Update an existing FHIR Measure resource from flattened form data',
  aliases: ['updateMeasure'],
  positionalParams: ['measureId', 'measureData'],
  schemaObject: {
    type: 'object',
    properties: {
      measureId: { type: 'string' },
      measureData: { type: 'object' }
    },
    required: ['measureId', 'measureData']
  }
}, async function(params, context){
  const measureId = params.measureId;
  const measureData = params.measureData;

  context.log.info('updateMeasure starting', { measureId: measureId });

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

  context.log.debug('Updating with data', { updateData: updateData });

  try {
    const result = await Measures.updateAsync(
      { _id: measureId },
      { $set: updateData }
    );
    context.log.info('Update result', { result: result });
    return result;
  } catch (error) {
    context.log.error('Error updating measure', { message: error.message });
    throw new Meteor.Error('update-failed', 'Failed to update measure', error.message);
  }
});

Meteor.ServerMethods.define('measures.remove', {
  description: 'Delete a FHIR Measure resource by id',
  aliases: ['removeMeasure'],
  positionalParams: ['measureId'],
  schemaObject: {
    type: 'object',
    properties: { measureId: { type: 'string' } },
    required: ['measureId']
  }
}, async function(params, context){
  const measureId = params.measureId;

  context.log.info('removeMeasure starting', { measureId: measureId });

  const existingMeasure = await Measures.findOneAsync({ _id: measureId });
  if (!existingMeasure) {
    throw new Meteor.Error('not-found', 'Measure not found');
  }

  try {
    const result = await Measures.removeAsync({ _id: measureId });
    context.log.info('Remove result', { result: result });
    return result;
  } catch (error) {
    context.log.error('Error removing measure', { message: error.message });
    throw new Meteor.Error('remove-failed', 'Failed to delete measure', error.message);
  }
});
