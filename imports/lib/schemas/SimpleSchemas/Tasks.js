// imports/lib/schemas/SimpleSchemas/Tasks.js
// Collection definition for Task resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Task.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Task = BaseModel.extend();

export let Tasks = createFhirCollection('Task', 'Tasks');

//Assign a collection so the object knows how to perform CRUD operations
Task.prototype._collection = Tasks;

// NOTE: transform was not active in the original file — left disabled.
// Tasks._transform = function (document) {
//   return new Task(document);
// };
