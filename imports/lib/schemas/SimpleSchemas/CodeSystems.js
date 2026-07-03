// imports/lib/schemas/SimpleSchemas/CodeSystems.js
// Collection definition for CodeSystem resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/CodeSystem.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let CodeSystem = BaseModel.extend();

export let CodeSystems = createFhirCollection('CodeSystem', 'CodeSystems');

//Assign a collection so the object knows how to perform CRUD operations
CodeSystem.prototype._collection = CodeSystems;

//Add the transform to the collection
CodeSystems._transform = function (document) {
  return new CodeSystem(document);
};
