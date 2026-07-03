// imports/lib/schemas/SimpleSchemas/ExplanationOfBenefits.js
// Collection definition for ExplanationOfBenefit resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ExplanationOfBenefit.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let ExplanationOfBenefit = BaseModel.extend();

export let ExplanationOfBenefits = createFhirCollection('ExplanationOfBenefit', 'ExplanationOfBenefits');

//Assign a collection so the object knows how to perform CRUD operations
ExplanationOfBenefit.prototype._collection = ExplanationOfBenefits;

//Add the transform to the collection
ExplanationOfBenefits._transform = function (document) {
  return new ExplanationOfBenefit(document);
};
