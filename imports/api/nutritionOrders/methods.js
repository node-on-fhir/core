// /imports/api/nutritionOrders/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';

Meteor.methods({
  async 'nutritionOrders.create'(nutritionOrderData) {
    check(nutritionOrderData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create nutrition orders');
    }

    // Clean the data
    const cleanNutritionOrder = {
      ...nutritionOrderData,
      resourceType: 'NutritionOrder',
      id: nutritionOrderData.id || Random.id(),
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
      console.log('Created nutrition order:', nutritionOrderId);
      return nutritionOrderId;
    } catch (error) {
      console.error('Error creating nutrition order:', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },

  async 'nutritionOrders.update'(nutritionOrderId, nutritionOrderData) {
    check(nutritionOrderId, String);
    check(nutritionOrderData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update nutrition orders');
    }

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
      console.log('Updated nutrition order:', nutritionOrderId, result);
      return nutritionOrderId;
    } catch (error) {
      console.error('Error updating nutrition order:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  async 'nutritionOrders.remove'(nutritionOrderId) {
    check(nutritionOrderId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete nutrition orders');
    }

    try {
      const result = await NutritionOrders.removeAsync({ _id: nutritionOrderId });
      console.log('Removed nutrition order:', nutritionOrderId, result);
      return result;
    } catch (error) {
      console.error('Error removing nutrition order:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  },

  async 'nutritionOrders.get'(nutritionOrderId) {
    check(nutritionOrderId, String);
    
    try {
      const nutritionOrder = await NutritionOrders.findOneAsync({ _id: nutritionOrderId });
      if (!nutritionOrder) {
        throw new Meteor.Error('not-found', 'Nutrition order not found');
      }
      console.log('Retrieved nutrition order:', nutritionOrderId);
      return nutritionOrder;
    } catch (error) {
      console.error('Error getting nutrition order:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  },

  async 'nutritionOrders.count'() {
    try {
      const count = await NutritionOrders.find().countAsync();
      console.log('NutritionOrders count:', count);
      return count;
    } catch (error) {
      console.error('Error counting nutrition orders:', error);
      throw new Meteor.Error('count-failed', error.message);
    }
  },

  async 'nutritionOrders.findAll'() {
    try {
      const records = await NutritionOrders.find({}).fetchAsync();
      console.log('NutritionOrders findAll found:', records.length, 'records');
      return records;
    } catch (error) {
      console.error('Error finding nutrition orders:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  }
});