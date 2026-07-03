// imports/lib/schemas/SimpleSchemas/BodyStructures.js
// Collection definition for BodyStructure resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/BodyStructure.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let BodyStructure = BaseModel.extend();

export let BodyStructures = createFhirCollection('BodyStructure', 'BodyStructures');

//Assign a collection so the object knows how to perform CRUD operations
BodyStructure.prototype._collection = BodyStructures;

//Add the transform to the collection
BodyStructures._transform = function (document) {
  return new BodyStructure(document);
};

export default { BodyStructure, BodyStructures };
