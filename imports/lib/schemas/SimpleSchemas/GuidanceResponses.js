// imports/lib/schemas/SimpleSchemas/GuidanceResponses.js
// Collection definition for GuidanceResponse resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/GuidanceResponse.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let GuidanceResponses = createFhirCollection('GuidanceResponse', 'GuidanceResponses');

// create the object using our BaseModel
let GuidanceResponse = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
GuidanceResponse.prototype._collection = GuidanceResponses;

//Add the transform to the collection
GuidanceResponses._transform = function (document) {
  return new GuidanceResponse(document);
};

export default { GuidanceResponse, GuidanceResponses };
