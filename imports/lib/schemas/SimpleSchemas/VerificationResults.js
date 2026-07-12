// imports/lib/schemas/SimpleSchemas/VerificationResults.js
// Collection definition for VerificationResult resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/VerificationResult.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let VerificationResult = BaseModel.extend();

export let VerificationResults = createFhirCollection('VerificationResult', 'VerificationResults');

//Assign a collection so the object knows how to perform CRUD operations
VerificationResult.prototype._collection = VerificationResults;

//Add the transform to the collection
VerificationResults._transform = function (document) {
  return new VerificationResult(document);
};

export default { VerificationResult, VerificationResults };
