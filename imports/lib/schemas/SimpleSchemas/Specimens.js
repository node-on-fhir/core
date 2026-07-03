// imports/lib/schemas/SimpleSchemas/Specimens.js
// Collection definition for Specimen resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Specimen.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let Specimens = createFhirCollection('Specimen', 'Specimens');

// create the object using our BaseModel
let Specimen = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
Specimen.prototype._collection = Specimens;

//Add the transform to the collection
Specimens._transform = function (document) {
  return new Specimen(document);
};

export default { Specimen, Specimens };
