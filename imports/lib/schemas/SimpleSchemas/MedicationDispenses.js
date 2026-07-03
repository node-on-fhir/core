// imports/lib/schemas/SimpleSchemas/MedicationDispenses.js
// Collection definition for MedicationDispense resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/MedicationDispense.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let MedicationDispenses = createFhirCollection('MedicationDispense', 'MedicationDispenses');

// create the object using our BaseModel
let MedicationDispense = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
MedicationDispense.prototype._collection = MedicationDispenses;

//Add the transform to the collection
MedicationDispenses._transform = function (document) {
  return new MedicationDispense(document);
};

export default { MedicationDispense, MedicationDispenses };
