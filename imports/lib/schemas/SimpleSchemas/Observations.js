// imports/lib/schemas/SimpleSchemas/Observations.js
// Collection definition for Observation resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Observation.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Observation = BaseModel.extend();

let Observations = createFhirCollection('Observation', 'Observations');

//Assign a collection so the object knows how to perform CRUD operations
Observation.prototype._collection = Observations;

//Add the transform to the collection
Observations._transform = function (document) {
  return new Observation(document);
};

export default { Observation, Observations };
export { Observation, Observations };
