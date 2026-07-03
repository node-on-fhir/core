// imports/lib/schemas/SimpleSchemas/MedicationAdministrations.js
// Collection definition for MedicationAdministration resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/MedicationAdministration.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let MedicationAdministrations = createFhirCollection('MedicationAdministration', 'MedicationAdministrations');

// create the object using our BaseModel
let MedicationAdministration = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
MedicationAdministration.prototype._collection = MedicationAdministrations;

//Add the transform to the collection
MedicationAdministrations._transform = function (document) {
  return new MedicationAdministration(document);
};

export default { MedicationAdministration, MedicationAdministrations };
