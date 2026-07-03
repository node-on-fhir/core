// imports/lib/schemas/SimpleSchemas/NutritionIntakes.js
// Collection definition for NutritionIntake resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/NutritionIntake.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let NutritionIntake = BaseModel.extend();

export let NutritionIntakes = createFhirCollection('NutritionIntake', 'NutritionIntakes');

//Assign a collection so the object knows how to perform CRUD operations
NutritionIntake.prototype._collection = NutritionIntakes;

//Add the transform to the collection
NutritionIntakes._transform = function (document) {
  return new NutritionIntake(document);
};

export default { NutritionIntake, NutritionIntakes };
