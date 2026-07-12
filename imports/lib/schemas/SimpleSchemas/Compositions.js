// imports/lib/schemas/SimpleSchemas/Compositions.js
// Collection definition for Composition resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Composition.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// // create the object using our BaseModel
let Composition = BaseModel.extend();

// // Create a persistent data store for addresses to be stored.
export let Compositions = createFhirCollection('Composition', 'Compositions');


// //Assign a collection so the object knows how to perform CRUD operations
Composition.prototype._collection = Compositions;



// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Compositions._transform = function (document) {
  return new Composition(document);
};

export default { Composition, Compositions };
