// imports/lib/schemas/SimpleSchemas/Coverages.js
// Collection definition for Coverage resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Coverage.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let Coverages = createFhirCollection('Coverage', 'Coverages');

// create the object using our BaseModel
let Coverage = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
Coverage.prototype._collection = Coverages;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Coverages._transform = function (document) {
  return new Coverage(document);
};

export default { Coverage, Coverages };
