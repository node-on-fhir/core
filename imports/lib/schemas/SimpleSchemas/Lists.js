// imports/lib/schemas/SimpleSchemas/Lists.js
// Collection definition for List resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/List.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
// (NOTE: model class is named Goal in the original file — preserved as-is)
let Goal = BaseModel.extend();

export let Lists = createFhirCollection('List', 'Lists');

//Assign a collection so the object knows how to perform CRUD operations
Goal.prototype._collection = Lists;

//Add the transform to the collection
Lists._transform = function (document) {
  return new Goal(document);
};

export default { Goal, Lists };
