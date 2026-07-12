// imports/lib/schemas/SimpleSchemas/MedicationRequests.js
// Collection definition for MedicationRequest resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/MedicationRequest.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let MedicationRequest = BaseModel.extend();

export let MedicationRequests = createFhirCollection('MedicationRequest', 'MedicationRequests');

//Assign a collection so the object knows how to perform CRUD operations
MedicationRequest.prototype._collection = MedicationRequests;

//Add the transform to the collection
MedicationRequests._transform = function (document) {
  return new MedicationRequest(document);
};

export default { MedicationRequest, MedicationRequests };
