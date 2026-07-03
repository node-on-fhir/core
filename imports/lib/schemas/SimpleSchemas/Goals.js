// imports/lib/schemas/SimpleSchemas/Goals.js
// Collection definition for Goal resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Goal.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Goal = BaseModel.extend();

export let Goals = createFhirCollection('Goal', 'Goals');

//Assign a collection so the object knows how to perform CRUD operations
Goal.prototype._collection = Goals;

//Add the transform to the collection
Goals._transform = function (document) {
  return new Goal(document);
};

export default { Goal, Goals };
