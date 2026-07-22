// /imports/api/nutritionIntakes/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { NutritionIntakes } from '/imports/lib/schemas/SimpleSchemas/NutritionIntakes';

Meteor.ServerMethods.define('nutritionIntakes.create', {
  description: 'Create a new NutritionIntake resource for a patient',
  phi: true,
  schemaObject: { type: 'object' }   // params IS the NutritionIntake resource
}, async function(params, context){
  // Clean the data
  const cleanNutritionIntake = {
    ...params,
    resourceType: 'NutritionIntake',
    id: params.id || Random.id(),
    meta: {
      versionId: '1',
      lastUpdated: new Date()
    }
  };

  // Set default status if not provided
  if (!cleanNutritionIntake.status) {
    cleanNutritionIntake.status = 'completed';
  }

  // Ensure subject reference is set (patient-owned resource)
  if (!cleanNutritionIntake.subject || !cleanNutritionIntake.subject.reference) {
    throw new Meteor.Error('invalid-data', 'Subject (patient) reference is required');
  }

  // Ensure consumedItem is set (required field)
  if (!cleanNutritionIntake.consumedItem || !Array.isArray(cleanNutritionIntake.consumedItem) || cleanNutritionIntake.consumedItem.length === 0) {
    throw new Meteor.Error('invalid-data', 'At least one consumedItem is required');
  }

  // Validate each consumedItem has required fields (type and nutritionProduct)
  cleanNutritionIntake.consumedItem.forEach((item, index) => {
    if (!item.type) {
      throw new Meteor.Error('invalid-data', `consumedItem[${index}].type is required`);
    }
    if (!item.nutritionProduct) {
      throw new Meteor.Error('invalid-data', `consumedItem[${index}].nutritionProduct is required`);
    }
  });

  // Set recorded date if not provided
  if (!cleanNutritionIntake.recorded) {
    cleanNutritionIntake.recorded = new Date().toISOString();
  }

  // Transform ingredientLabel array if provided
  if (cleanNutritionIntake.ingredientLabel && Array.isArray(cleanNutritionIntake.ingredientLabel)) {
    cleanNutritionIntake.ingredientLabel = cleanNutritionIntake.ingredientLabel.filter(label =>
      label && label.nutrient && label.amount
    );
    if (cleanNutritionIntake.ingredientLabel.length === 0) {
      delete cleanNutritionIntake.ingredientLabel;
    }
  }

  // Transform performer array if provided
  if (cleanNutritionIntake.performer && Array.isArray(cleanNutritionIntake.performer)) {
    cleanNutritionIntake.performer = cleanNutritionIntake.performer.filter(perf =>
      perf && perf.actor
    );
    if (cleanNutritionIntake.performer.length === 0) {
      delete cleanNutritionIntake.performer;
    }
  }

  try {
    const nutritionIntakeId = await NutritionIntakes.insertAsync(cleanNutritionIntake);
    context.log.info('Created nutrition intake', { _id: nutritionIntakeId });
    return nutritionIntakeId;
  } catch (error) {
    context.log.error('Error creating nutrition intake', { message: error.message });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

Meteor.ServerMethods.define('nutritionIntakes.update', {
  description: 'Replace fields of an existing NutritionIntake resource',
  phi: true,
  positionalParams: ['nutritionIntakeId', 'nutritionIntakeData'],
  schemaObject: {
    type: 'object',
    properties: {
      nutritionIntakeId: { type: 'string' },
      nutritionIntakeData: { type: 'object' }
    },
    required: ['nutritionIntakeId', 'nutritionIntakeData']
  }
}, async function(params, context){
  const nutritionIntakeId = params.nutritionIntakeId;
  const nutritionIntakeData = params.nutritionIntakeData;

  // Clean the data
  const cleanNutritionIntake = {
    ...nutritionIntakeData,
    meta: {
      ...nutritionIntakeData.meta,
      versionId: String(parseInt(get(nutritionIntakeData, 'meta.versionId', '0')) + 1),
      lastUpdated: new Date()
    }
  };

  // Remove fields that shouldn't be updated
  delete cleanNutritionIntake._id;
  delete cleanNutritionIntake._document;

  try {
    const result = await NutritionIntakes.updateAsync(
      { _id: nutritionIntakeId },
      { $set: cleanNutritionIntake }
    );
    context.log.info('Updated nutrition intake', { _id: nutritionIntakeId, result: result });
    return nutritionIntakeId;
  } catch (error) {
    context.log.error('Error updating nutrition intake', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

Meteor.ServerMethods.define('nutritionIntakes.remove', {
  description: 'Delete a NutritionIntake resource by its MongoDB _id',
  phi: true,
  positionalParams: ['nutritionIntakeId'],
  schemaObject: {
    type: 'object',
    properties: { nutritionIntakeId: { type: 'string' } },
    required: ['nutritionIntakeId']
  }
}, async function(params, context){
  try {
    const result = await NutritionIntakes.removeAsync({ _id: params.nutritionIntakeId });
    context.log.info('Removed nutrition intake', { _id: params.nutritionIntakeId, result: result });
    return result;
  } catch (error) {
    context.log.error('Error removing nutrition intake', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});

// Pre-migration this method had NO auth guard (latent bug — it returns
// patient-scoped intake data). requireAuth now applies (default true).
Meteor.ServerMethods.define('nutritionIntakes.get', {
  description: 'Fetch a single NutritionIntake by its MongoDB _id',
  phi: true,
  positionalParams: ['nutritionIntakeId'],
  schemaObject: {
    type: 'object',
    properties: { nutritionIntakeId: { type: 'string' } },
    required: ['nutritionIntakeId']
  }
}, async function(params, context){
  try {
    const nutritionIntake = await NutritionIntakes.findOneAsync({ _id: params.nutritionIntakeId });
    if (!nutritionIntake) {
      throw new Meteor.Error('not-found', 'Nutrition intake not found');
    }
    context.log.info('Retrieved nutrition intake', { _id: params.nutritionIntakeId });
    return nutritionIntake;
  } catch (error) {
    context.log.error('Error getting nutrition intake', { message: error.message });
    throw new Meteor.Error('find-failed', error.message);
  }
});

// Pre-migration this method had NO auth guard. requireAuth now applies
// (default true) — it only returns an aggregate count, but stays gated.
Meteor.ServerMethods.define('nutritionIntakes.count', {
  description: 'Count the NutritionIntake records in the database'
}, async function(params, context){
  try {
    const count = await NutritionIntakes.find().countAsync();
    context.log.info('NutritionIntakes count', { count: count });
    return count;
  } catch (error) {
    context.log.error('Error counting nutrition intakes', { message: error.message });
    throw new Meteor.Error('count-failed', error.message);
  }
});

// Pre-migration this method had NO auth guard (latent bug — it returns ALL
// patients' intake records). requireAuth now applies (default true).
Meteor.ServerMethods.define('nutritionIntakes.findAll', {
  description: 'Fetch every NutritionIntake record in the database',
  phi: true
}, async function(params, context){
  try {
    const records = await NutritionIntakes.find({}).fetchAsync();
    context.log.info('NutritionIntakes findAll', { count: records.length });
    return records;
  } catch (error) {
    context.log.error('Error finding nutrition intakes', { message: error.message });
    throw new Meteor.Error('find-failed', error.message);
  }
});
