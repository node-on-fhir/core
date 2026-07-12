// imports/lib/schemas/SimpleSchemas/OperationOutcomes.js
// Collection definition for OperationOutcome resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/OperationOutcome.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let OperationOutcomes = createFhirCollection('OperationOutcome', 'OperationOutcomes');

// create the object using our BaseModel
let OperationOutcome = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
OperationOutcome.prototype._collection = OperationOutcomes;

//Add the transform to the collection
OperationOutcomes._transform = function (document) {
  return new OperationOutcome(document);
};

export default { OperationOutcome, OperationOutcomes };
