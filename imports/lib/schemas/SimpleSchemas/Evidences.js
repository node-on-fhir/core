// imports/lib/schemas/SimpleSchemas/Evidences.js
// Collection definition for Evidence resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Evidence.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let Evidences = createFhirCollection('Evidence', 'Evidences');

// create the object using our BaseModel
let Evidence = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
Evidence.prototype._collection = Evidences;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Evidences._transform = function (document) {
  return new Evidence(document);
};

export default { Evidence, Evidences };
