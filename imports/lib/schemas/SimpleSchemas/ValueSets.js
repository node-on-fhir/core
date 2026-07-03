// imports/lib/schemas/SimpleSchemas/ValueSets.js
// Collection definition for ValueSet resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ValueSet.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let ValueSet = BaseModel.extend();

export let ValueSets = createFhirCollection('ValueSet', 'ValueSets');

//Assign a collection so the object knows how to perform CRUD operations
ValueSet.prototype._collection = ValueSets;

//Add the transform to the collection
ValueSets._transform = function (document) {
  return new ValueSet(document);
};
