// imports/lib/schemas/SimpleSchemas/Libraries.js
// Collection definition for Library resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Library.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let Libraries = createFhirCollection('Library', 'Libraries');

// create the object using our BaseModel
let Library = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
Library.prototype._collection = Libraries;

//Add the transform to the collection
Libraries._transform = function (document) {
  return new Library(document);
};

export default { Library, Libraries };
