// imports/lib/schemas/SimpleSchemas/Provenances.js
// Collection definition for Provenance resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Provenance.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Provenance = BaseModel.extend();

export let Provenances = createFhirCollection('Provenance', 'Provenances');

//Assign a collection so the object knows how to perform CRUD operations
Provenance.prototype._collection = Provenances;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Provenances._transform = function (document) {
  return new Provenance(document);
};
