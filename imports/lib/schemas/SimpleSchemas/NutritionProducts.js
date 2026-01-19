// imports/lib/schemas/SimpleSchemas/NutritionProducts.js
import { get } from 'lodash';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import { BaseSchema, DomainResourceSchema, CodeableConceptSchema, ReferenceSchema, QuantitySchema, IdentifierSchema, AnnotationSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let NutritionProduct = BaseModel.extend();

export let NutritionProducts = new Mongo.Collection('NutritionProducts');

//Assign a collection so the object knows how to perform CRUD operations
NutritionProduct.prototype._collection = NutritionProducts;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
NutritionProducts._transform = function (document) {
  return new NutritionProduct(document);
};

// FHIR R4B NutritionProduct Schema
let NutritionProductR4 = new SimpleSchema({
  "resourceType": {
    type: String,
    defaultValue: "NutritionProduct"
  },
  "_id": {
    type: String,
    optional: true
  },
  "id": {
    type: String,
    optional: true
  },
  "meta": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "text": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "identifier": {
    type: Array,
    optional: true
  },
  "identifier.$": {
    type: IdentifierSchema,
    optional: true
  },
  "extension": {
    type: Array,
    optional: true
  },
  "extension.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "modifierExtension": {
    type: Array,
    optional: true
  },
  "modifierExtension.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  // Status: active | inactive | entered-in-error
  "status": {
    type: String,
    optional: true,
    allowedValues: ['active', 'inactive', 'entered-in-error']
  },
  // Category: Broad nutritional product category
  "category": {
    type: Array,
    optional: true
  },
  "category.$": {
    type: CodeableConceptSchema,
    optional: true
  },
  // Code: SNOMED CT or other identifier for the product
  "code": {
    type: CodeableConceptSchema,
    optional: true
  },
  // Manufacturer: Organization references
  "manufacturer": {
    type: Array,
    optional: true
  },
  "manufacturer.$": {
    type: ReferenceSchema,
    optional: true
  },
  // Nutrient: Nutritional information
  "nutrient": {
    type: Array,
    optional: true
  },
  "nutrient.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  // Ingredient: Product ingredients
  "ingredient": {
    type: Array,
    optional: true
  },
  "ingredient.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  // Known Allergen: Allergen references
  "knownAllergen": {
    type: Array,
    optional: true
  },
  "knownAllergen.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  // Product Characteristic: Descriptive properties
  "productCharacteristic": {
    type: Array,
    optional: true
  },
  "productCharacteristic.$": {
    type: Object,
    optional: true,
    blackbox: true
  },
  // Instance: Physical countable instances
  "instance": {
    type: Object,
    optional: true,
    blackbox: true
  },
  // Note: Comments
  "note": {
    type: Array,
    optional: true
  },
  "note.$": {
    type: AnnotationSchema,
    optional: true
  }
});

let NutritionProductSchema = NutritionProductR4;

// NutritionProducts.attachSchema(NutritionProductSchema);

export default { NutritionProduct, NutritionProducts, NutritionProductSchema, NutritionProductR4 };
