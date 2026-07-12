// imports/lib/schemas/SimpleSchemas/NutritionProducts.js
// Collection definition for NutritionProduct resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/NutritionProduct.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let NutritionProduct = BaseModel.extend();

export let NutritionProducts = createFhirCollection('NutritionProduct', 'NutritionProducts');

//Assign a collection so the object knows how to perform CRUD operations
NutritionProduct.prototype._collection = NutritionProducts;

//Add the transform to the collection
NutritionProducts._transform = function (document) {
  return new NutritionProduct(document);
};

export default { NutritionProduct, NutritionProducts };
