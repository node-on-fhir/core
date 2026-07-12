// imports/lib/schemas/SimpleSchemas/ActivityDefinitions.js
// Collection definition for ActivityDefinition resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ActivityDefinition.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let ActivityDefinition = BaseModel.extend();
export let ActivityDefinitions = createFhirCollection('ActivityDefinition', 'ActivityDefinitions');

//Assign a collection so the object knows how to perform CRUD operations
ActivityDefinition.prototype._collection = ActivityDefinitions;

//Add the transform to the collection
ActivityDefinitions._transform = function (document) {
  return new ActivityDefinition(document);
};

export default { ActivityDefinition, ActivityDefinitions };
