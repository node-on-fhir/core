// /imports/api/nutritionProducts/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/NutritionProducts';

// Get the correct NutritionProducts collection reference
function getNutritionProducts() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.NutritionProducts || global.NutritionProducts;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.NutritionProducts;
  }
}

// 'nutritionProducts.insert' was a thin delegating wrapper around create —
// preserved as an alias rather than a second define.
Meteor.ServerMethods.define('nutritionProducts.create', {
  description: 'Create a new NutritionProduct catalog entry from form fields',
  aliases: ['nutritionProducts.insert'],
  phi: false,
  schemaObject: { type: 'object' }   // params IS the form/product payload
}, async function(params, context){
  const nutritionProductData = params;
  context.log.info('nutritionProducts.create input received');

  // Transform input data to proper FHIR structure
  const nutritionProduct = {
    resourceType: 'NutritionProduct',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Handle status
  if (nutritionProductData.status) {
    nutritionProduct.status = nutritionProductData.status;
  }

  // Handle code (CodeableConcept)
  if (nutritionProductData.code || nutritionProductData.codeCode || nutritionProductData.codeDisplay) {
    nutritionProduct.code = {
      coding: [{
        system: 'http://snomed.info/sct',
        code: nutritionProductData.codeCode || nutritionProductData.code,
        display: nutritionProductData.codeDisplay || nutritionProductData.display
      }],
      text: nutritionProductData.codeDisplay || nutritionProductData.display || nutritionProductData.code
    };
  }

  // Handle category (array of CodeableConcept)
  if (nutritionProductData.category || nutritionProductData.categoryCode || nutritionProductData.categoryDisplay) {
    nutritionProduct.category = [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/nutrition-product-category',
        code: nutritionProductData.categoryCode || nutritionProductData.category,
        display: nutritionProductData.categoryDisplay
      }],
      text: nutritionProductData.categoryDisplay || nutritionProductData.category
    }];
  }

  // Handle manufacturer (array of Reference)
  if (nutritionProductData.manufacturer || nutritionProductData.manufacturerDisplay) {
    nutritionProduct.manufacturer = [{
      display: nutritionProductData.manufacturerDisplay || nutritionProductData.manufacturer
    }];
  }

  // Handle description via productCharacteristic
  if (nutritionProductData.description) {
    nutritionProduct.productCharacteristic = [{
      type: {
        coding: [{
          system: 'http://hl7.org/fhir/nutrition-product-characteristic-type',
          code: 'description',
          display: 'Description'
        }],
        text: 'Description'
      },
      valueString: nutritionProductData.description
    }];
  }

  // Handle notes
  if (nutritionProductData.notes) {
    nutritionProduct.note = [{
      text: nutritionProductData.notes,
      time: moment().format('YYYY-MM-DDTHH:mm:ssZ')
    }];
  }

  // Set _id based on environment variable for consistent sorting with existing data
  if (process.env.USE_MONGO_OBJECTID) {
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    nutritionProduct._id = objectId.toHexString();
    context.log.info('Using MongoDB ObjectID (as hex string)', { _id: nutritionProduct._id });
  }
  // Otherwise Meteor will auto-generate a random string ID

  // Insert and return the new nutrition product ID
  const NutritionProducts = getNutritionProducts();
  const nutritionProductId = await NutritionProducts.insertAsync(nutritionProduct);

  // Log for HIPAA compliance
  context.log.info('NutritionProduct created', {
    userId: context.userId,
    nutritionProductId: nutritionProductId,
    timestamp: new Date()
  });

  return nutritionProductId;
});

Meteor.ServerMethods.define('nutritionProducts.update', {
  description: 'Update fields of an existing NutritionProduct catalog entry',
  phi: false,
  positionalParams: ['nutritionProductId', 'nutritionProductData'],
  schemaObject: {
    type: 'object',
    properties: {
      nutritionProductId: { type: 'string' },
      nutritionProductData: { type: 'object' }
    },
    required: ['nutritionProductId', 'nutritionProductData']
  }
}, async function(params, context){
  const nutritionProductId = params.nutritionProductId;
  const nutritionProductData = params.nutritionProductData;

  const NutritionProducts = getNutritionProducts();

  // Check if nutrition product exists
  const existingProduct = await NutritionProducts.findOneAsync({ _id: nutritionProductId });
  if (!existingProduct) {
    throw new Meteor.Error('not-found', 'Nutrition product not found');
  }

  // Build update object preserving existing structure
  const updatedProduct = {
    ...existingProduct,
    meta: {
      ...get(existingProduct, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingProduct, 'meta.versionId', '0')) + 1)
    }
  };

  // Update status
  if (nutritionProductData.status !== undefined) {
    updatedProduct.status = nutritionProductData.status;
  }

  // Update code
  if (nutritionProductData.codeCode || nutritionProductData.codeDisplay) {
    updatedProduct.code = {
      coding: [{
        system: 'http://snomed.info/sct',
        code: nutritionProductData.codeCode || get(existingProduct, 'code.coding.0.code'),
        display: nutritionProductData.codeDisplay || get(existingProduct, 'code.coding.0.display')
      }],
      text: nutritionProductData.codeDisplay || get(existingProduct, 'code.text')
    };
  }

  // Update category
  if (nutritionProductData.categoryCode || nutritionProductData.categoryDisplay) {
    updatedProduct.category = [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/nutrition-product-category',
        code: nutritionProductData.categoryCode || get(existingProduct, 'category.0.coding.0.code'),
        display: nutritionProductData.categoryDisplay || get(existingProduct, 'category.0.coding.0.display')
      }],
      text: nutritionProductData.categoryDisplay || get(existingProduct, 'category.0.text')
    }];
  }

  // Update manufacturer
  if (nutritionProductData.manufacturerDisplay !== undefined) {
    updatedProduct.manufacturer = [{
      display: nutritionProductData.manufacturerDisplay
    }];
  }

  // Update description
  if (nutritionProductData.description !== undefined) {
    updatedProduct.productCharacteristic = [{
      type: {
        coding: [{
          system: 'http://hl7.org/fhir/nutrition-product-characteristic-type',
          code: 'description',
          display: 'Description'
        }],
        text: 'Description'
      },
      valueString: nutritionProductData.description
    }];
  }

  // Update notes
  if (nutritionProductData.notes !== undefined) {
    updatedProduct.note = [{
      text: nutritionProductData.notes,
      time: moment().format('YYYY-MM-DDTHH:mm:ssZ')
    }];
  }

  // Update the nutrition product
  const result = await NutritionProducts.updateAsync(
    { _id: nutritionProductId },
    { $set: updatedProduct }
  );

  // Log for HIPAA compliance
  context.log.info('NutritionProduct updated', {
    userId: context.userId,
    nutritionProductId: nutritionProductId,
    timestamp: new Date()
  });

  return result;
});

// 'nutritionProducts.findOne' was a thin delegating wrapper around get —
// preserved as an alias rather than a second define.
Meteor.ServerMethods.define('nutritionProducts.get', {
  description: 'Fetch a single NutritionProduct catalog entry by its MongoDB _id',
  aliases: ['nutritionProducts.findOne'],
  phi: false,
  positionalParams: ['nutritionProductId'],
  schemaObject: {
    type: 'object',
    properties: { nutritionProductId: { type: 'string' } },
    required: ['nutritionProductId']
  }
}, async function(params, context){
  const NutritionProducts = getNutritionProducts();
  const nutritionProduct = await NutritionProducts.findOneAsync({ _id: params.nutritionProductId });

  if (!nutritionProduct) {
    throw new Meteor.Error('not-found', 'Nutrition product not found');
  }

  // Log access for HIPAA compliance
  context.log.info('NutritionProduct accessed', {
    userId: context.userId,
    nutritionProductId: params.nutritionProductId,
    timestamp: new Date()
  });

  return nutritionProduct;
});

Meteor.ServerMethods.define('nutritionProducts.remove', {
  description: 'Delete a NutritionProduct catalog entry by its MongoDB _id',
  phi: false,
  positionalParams: ['nutritionProductId'],
  schemaObject: {
    type: 'object',
    properties: { nutritionProductId: { type: 'string' } },
    required: ['nutritionProductId']
  }
}, async function(params, context){
  const NutritionProducts = getNutritionProducts();

  // Check if nutrition product exists
  const existingProduct = await NutritionProducts.findOneAsync({ _id: params.nutritionProductId });
  if (!existingProduct) {
    throw new Meteor.Error('not-found', 'Nutrition product not found');
  }

  // Remove the nutrition product
  const result = await NutritionProducts.removeAsync({ _id: params.nutritionProductId });

  // Log for HIPAA compliance
  context.log.info('NutritionProduct deleted', {
    userId: context.userId,
    nutritionProductId: params.nutritionProductId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('nutritionProducts.search', {
  description: 'Search NutritionProduct catalog entries by name, status, and category',
  phi: false,
  schemaObject: { type: 'object' }   // params IS the legacy searchOptions object
}, async function(params, context){
  const searchOptions = params || {};

  const NutritionProducts = getNutritionProducts();
  const { query = {}, options = {} } = searchOptions;

  // Add any necessary query transformations here
  if (searchOptions.name) {
    query['code.text'] = { $regex: searchOptions.name, $options: 'i' };
  }

  if (searchOptions.status) {
    query.status = searchOptions.status;
  }

  if (searchOptions.category) {
    query['category.0.coding.0.code'] = searchOptions.category;
  }

  // Set default options
  const findOptions = {
    limit: options.limit || 20,
    sort: options.sort || { 'meta.lastUpdated': -1 },
    ...options
  };

  const nutritionProducts = await NutritionProducts.find(query, findOptions).fetchAsync();

  // Log search for HIPAA compliance
  context.log.info('NutritionProducts searched', {
    userId: context.userId,
    query: query,
    resultCount: nutritionProducts.length,
    timestamp: new Date()
  });

  return nutritionProducts;
});
