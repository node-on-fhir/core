// imports/lib/schemas/SimpleSchemas/AllergyIntolerances.js
// Collection definition for AllergyIntolerance resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/AllergyIntolerance.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let AllergyIntolerance = BaseModel.extend();

export let AllergyIntolerances = createFhirCollection('AllergyIntolerance', 'AllergyIntolerances');

//Assign a collection so the object knows how to perform CRUD operations
AllergyIntolerance.prototype._collection = AllergyIntolerances;

//Add the transform to the collection
AllergyIntolerances._transform = function (document) {
  return new AllergyIntolerance(document);
};

export default { AllergyIntolerance, AllergyIntolerances };
