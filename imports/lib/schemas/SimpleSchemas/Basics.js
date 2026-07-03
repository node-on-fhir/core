// imports/lib/schemas/SimpleSchemas/Basics.js
// Collection definition for Basic resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Basic.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let Basics = createFhirCollection('Basic', 'Basics');

// create the object using our BaseModel
let Basic = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
Basic.prototype._collection = Basics;

//Add the transform to the collection
Basics._transform = function (document) {
  return new Basic(document);
};

export default { Basic, Basics };
