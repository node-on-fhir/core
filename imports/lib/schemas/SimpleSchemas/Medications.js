// imports/lib/schemas/SimpleSchemas/Medications.js
// Collection definition for Medication resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Medication.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// Import Substances from its own module to avoid duplicate collection definition
import { Substances } from './Substances';

// create the object using our BaseModel
let Medication = BaseModel.extend();
let Substance = BaseModel.extend();

export let Medications = createFhirCollection('Medication', 'Medications');
// Re-export Substances from its own module (no longer creating duplicate here)
export { Substances };

//Assign a collection so the object knows how to perform CRUD operations
Medication.prototype._collection = Medications;
Substance.prototype._collection = Substances;

//Add the transform to the collection
Medications._transform = function (document) {
  return new Medication(document);
};
Substances._transform = function (document) {
  return new Substance(document);
};

export default { Medication, Medications, Substances, Substance };
