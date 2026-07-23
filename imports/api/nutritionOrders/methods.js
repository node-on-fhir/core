// /imports/api/nutritionOrders/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';

Meteor.ServerMethods.define('nutritionOrders.create', {
  description: 'Create a new NutritionOrder resource for a patient',
  phi: true,
  schemaObject: { type: 'object' }   // params IS the NutritionOrder resource
}, async function(params, context){
  // Clean the data
  const cleanNutritionOrder = {
    ...params,
    resourceType: 'NutritionOrder',
    id: params.id || Random.id(),
    meta: {
      versionId: '1',
      lastUpdated: new Date()
    }
  };

  // Set default status if not provided
  if (!cleanNutritionOrder.status) {
    cleanNutritionOrder.status = 'active';
  }

  // Set default intent if not provided
  if (!cleanNutritionOrder.intent) {
    cleanNutritionOrder.intent = 'order';
  }

  // Ensure dateTime is set
  if (!cleanNutritionOrder.dateTime) {
    cleanNutritionOrder.dateTime = new Date();
  }

  // Ensure patient reference is set
  if (!cleanNutritionOrder.patient || !cleanNutritionOrder.patient.reference) {
    throw new Meteor.Error('invalid-data', 'Patient reference is required');
  }

  // Transform supplement data if provided
  if (cleanNutritionOrder.supplement && Array.isArray(cleanNutritionOrder.supplement)) {
    cleanNutritionOrder.supplement = cleanNutritionOrder.supplement.filter(supp =>
      supp && (supp.productName || (supp.type && supp.type[0] && supp.type[0].text))
    );
    if (cleanNutritionOrder.supplement.length === 0) {
      delete cleanNutritionOrder.supplement;
    }
  }

  // Transform enteral formula data if provided
  if (cleanNutritionOrder.enteralFormula) {
    const formula = cleanNutritionOrder.enteralFormula;
    if (!formula.baseFormulaProductName &&
        (!formula.baseFormulaType || !formula.baseFormulaType[0] || !formula.baseFormulaType[0].text)) {
      delete cleanNutritionOrder.enteralFormula;
    }
  }

  // Transform allergy intolerance array
  if (cleanNutritionOrder.allergyIntolerance && Array.isArray(cleanNutritionOrder.allergyIntolerance)) {
    cleanNutritionOrder.allergyIntolerance = cleanNutritionOrder.allergyIntolerance.filter(item => item && item.length > 0);
    if (cleanNutritionOrder.allergyIntolerance.length === 0) {
      delete cleanNutritionOrder.allergyIntolerance;
    }
  }

  // Transform food preference modifiers
  if (cleanNutritionOrder.foodPreferenceModifier && Array.isArray(cleanNutritionOrder.foodPreferenceModifier)) {
    cleanNutritionOrder.foodPreferenceModifier = cleanNutritionOrder.foodPreferenceModifier.filter(mod =>
      mod && mod.text && mod.text.length > 0
    );
    if (cleanNutritionOrder.foodPreferenceModifier.length === 0) {
      delete cleanNutritionOrder.foodPreferenceModifier;
    }
  }

  // Transform exclude food modifiers
  if (cleanNutritionOrder.excludeFoodModifier && Array.isArray(cleanNutritionOrder.excludeFoodModifier)) {
    cleanNutritionOrder.excludeFoodModifier = cleanNutritionOrder.excludeFoodModifier.filter(mod =>
      mod && mod.text && mod.text.length > 0
    );
    if (cleanNutritionOrder.excludeFoodModifier.length === 0) {
      delete cleanNutritionOrder.excludeFoodModifier;
    }
  }

  try {
    const nutritionOrderId = await NutritionOrders.insertAsync(cleanNutritionOrder);
    context.log.info('Created nutrition order', { _id: nutritionOrderId });
    return nutritionOrderId;
  } catch (error) {
    context.log.error('Error creating nutrition order', { message: error.message });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

Meteor.ServerMethods.define('nutritionOrders.update', {
  description: 'Replace fields of an existing NutritionOrder resource',
  phi: true,
  positionalParams: ['nutritionOrderId', 'nutritionOrderData'],
  schemaObject: {
    type: 'object',
    properties: {
      nutritionOrderId: { type: 'string' },
      nutritionOrderData: { type: 'object' }
    },
    required: ['nutritionOrderId', 'nutritionOrderData']
  }
}, async function(params, context){
  const nutritionOrderId = params.nutritionOrderId;
  const nutritionOrderData = params.nutritionOrderData;

  // Clean the data
  const cleanNutritionOrder = {
    ...nutritionOrderData,
    meta: {
      ...nutritionOrderData.meta,
      versionId: String(parseInt(get(nutritionOrderData, 'meta.versionId', '0')) + 1),
      lastUpdated: new Date()
    }
  };

  // Remove fields that shouldn't be updated
  delete cleanNutritionOrder._id;
  delete cleanNutritionOrder._document;

  try {
    const result = await NutritionOrders.updateAsync(
      { _id: nutritionOrderId },
      { $set: cleanNutritionOrder }
    );
    context.log.info('Updated nutrition order', { _id: nutritionOrderId, result: result });
    return nutritionOrderId;
  } catch (error) {
    context.log.error('Error updating nutrition order', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

Meteor.ServerMethods.define('nutritionOrders.remove', {
  description: 'Delete a NutritionOrder resource by its MongoDB _id',
  phi: true,
  positionalParams: ['nutritionOrderId'],
  schemaObject: {
    type: 'object',
    properties: { nutritionOrderId: { type: 'string' } },
    required: ['nutritionOrderId']
  }
}, async function(params, context){
  try {
    const result = await NutritionOrders.removeAsync({ _id: params.nutritionOrderId });
    context.log.info('Removed nutrition order', { _id: params.nutritionOrderId, result: result });
    return result;
  } catch (error) {
    context.log.error('Error removing nutrition order', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});

// Pre-migration this method had NO auth guard (latent bug — it returns
// patient-scoped order data). requireAuth now applies (default true).
Meteor.ServerMethods.define('nutritionOrders.get', {
  description: 'Fetch a single NutritionOrder by its MongoDB _id',
  phi: true,
  positionalParams: ['nutritionOrderId'],
  schemaObject: {
    type: 'object',
    properties: { nutritionOrderId: { type: 'string' } },
    required: ['nutritionOrderId']
  }
}, async function(params, context){
  try {
    const nutritionOrder = await NutritionOrders.findOneAsync({ _id: params.nutritionOrderId });
    if (!nutritionOrder) {
      throw new Meteor.Error('not-found', 'Nutrition order not found');
    }
    context.log.info('Retrieved nutrition order', { _id: params.nutritionOrderId });
    return nutritionOrder;
  } catch (error) {
    context.log.error('Error getting nutrition order', { message: error.message });
    throw new Meteor.Error('find-failed', error.message);
  }
});

// Pre-migration this method had NO auth guard. requireAuth now applies
// (default true) — it only returns an aggregate count, but stays gated.
Meteor.ServerMethods.define('nutritionOrders.count', {
  description: 'Count the NutritionOrder records in the database'
}, async function(params, context){
  try {
    const count = await NutritionOrders.find().countAsync();
    context.log.info('NutritionOrders count', { count: count });
    return count;
  } catch (error) {
    context.log.error('Error counting nutrition orders', { message: error.message });
    throw new Meteor.Error('count-failed', error.message);
  }
});

// Pre-migration this method had NO auth guard (latent bug — it returns ALL
// patients' order records). requireAuth now applies (default true).
Meteor.ServerMethods.define('nutritionOrders.findAll', {
  description: 'Fetch every NutritionOrder record in the database',
  phi: true
}, async function(params, context){
  try {
    const records = await NutritionOrders.find({}).fetchAsync();
    context.log.info('NutritionOrders findAll', { count: records.length });
    return records;
  } catch (error) {
    context.log.error('Error finding nutrition orders', { message: error.message });
    throw new Meteor.Error('find-failed', error.message);
  }
});
