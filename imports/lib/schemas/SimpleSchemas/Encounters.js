// imports/lib/schemas/SimpleSchemas/Encounters.js
// Collection definition for Encounter resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Encounter.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// // create the object using our BaseModel
let Encounter = BaseModel.extend();

export let Encounters = createFhirCollection('Encounter', 'Encounters');

// //Assign a collection so the object knows how to perform CRUD operations
Encounter.prototype._collection = Encounters;

// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Encounters._transform = function (document) {
  return new Encounter(document);
};

export { Encounter }
