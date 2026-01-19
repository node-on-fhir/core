// /imports/api/nutritionIntakes/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { NutritionIntakes } from '/imports/lib/schemas/SimpleSchemas/NutritionIntakes';

Meteor.methods({
  async 'nutritionIntakes.create'(nutritionIntakeData) {
    check(nutritionIntakeData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create nutrition intakes');
    }

    // Clean the data
    const cleanNutritionIntake = {
      ...nutritionIntakeData,
      resourceType: 'NutritionIntake',
      id: nutritionIntakeData.id || Random.id(),
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
      console.log('Created nutrition intake:', nutritionIntakeId);
      return nutritionIntakeId;
    } catch (error) {
      console.error('Error creating nutrition intake:', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },

  async 'nutritionIntakes.update'(nutritionIntakeId, nutritionIntakeData) {
    check(nutritionIntakeId, String);
    check(nutritionIntakeData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update nutrition intakes');
    }

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
      console.log('Updated nutrition intake:', nutritionIntakeId, result);
      return nutritionIntakeId;
    } catch (error) {
      console.error('Error updating nutrition intake:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  async 'nutritionIntakes.remove'(nutritionIntakeId) {
    check(nutritionIntakeId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete nutrition intakes');
    }

    try {
      const result = await NutritionIntakes.removeAsync({ _id: nutritionIntakeId });
      console.log('Removed nutrition intake:', nutritionIntakeId, result);
      return result;
    } catch (error) {
      console.error('Error removing nutrition intake:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  },

  async 'nutritionIntakes.get'(nutritionIntakeId) {
    check(nutritionIntakeId, String);

    try {
      const nutritionIntake = await NutritionIntakes.findOneAsync({ _id: nutritionIntakeId });
      if (!nutritionIntake) {
        throw new Meteor.Error('not-found', 'Nutrition intake not found');
      }
      console.log('Retrieved nutrition intake:', nutritionIntakeId);
      return nutritionIntake;
    } catch (error) {
      console.error('Error getting nutrition intake:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  },

  async 'nutritionIntakes.count'() {
    try {
      const count = await NutritionIntakes.find().countAsync();
      console.log('NutritionIntakes count:', count);
      return count;
    } catch (error) {
      console.error('Error counting nutrition intakes:', error);
      throw new Meteor.Error('count-failed', error.message);
    }
  },

  async 'nutritionIntakes.findAll'() {
    try {
      const records = await NutritionIntakes.find({}).fetchAsync();
      console.log('NutritionIntakes findAll found:', records.length, 'records');
      return records;
    } catch (error) {
      console.error('Error finding nutrition intakes:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  }
});
