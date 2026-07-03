// imports/lib/schemas/SimpleSchemas/Medias.js
// Collection definition for Media resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Media.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Media = BaseModel.extend();

export let Medias = createFhirCollection('Media', 'Medias');

//Assign a collection so the object knows how to perform CRUD operations
Media.prototype._collection = Medias;

//Add the transform to the collection
Medias._transform = function (document) {
  return new Media(document);
};

export default { Media, Medias };
