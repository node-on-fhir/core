// imports/lib/schemas/SimpleSchemas/Locations.js
// Collection definition for Location resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Location.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Location = BaseModel.extend();

export let Locations = createFhirCollection('Location', 'Locations');

//Assign a collection so the object knows how to perform CRUD operations
Location.prototype._collection = Locations;

//Add the transform to the collection
Locations._transform = function (document) {
  return new Location(document);
};

export default { Location, Locations };
