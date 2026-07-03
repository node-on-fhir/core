// imports/lib/schemas/SimpleSchemas/NutritionOrders.js
// Collection definition for NutritionOrder resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/NutritionOrder.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let NutritionOrder = BaseModel.extend();

export let NutritionOrders = createFhirCollection('NutritionOrder', 'NutritionOrders');

//Assign a collection so the object knows how to perform CRUD operations
NutritionOrder.prototype._collection = NutritionOrders;

//Add the transform to the collection
NutritionOrders._transform = function (document) {
  return new NutritionOrder(document);
};

export default { NutritionOrder, NutritionOrders };
