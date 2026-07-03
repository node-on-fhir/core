// imports/lib/schemas/SimpleSchemas/InsurancePlans.js
// Collection definition for InsurancePlan resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/InsurancePlan.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let InsurancePlan = BaseModel.extend();

export let InsurancePlans = createFhirCollection('InsurancePlan', 'InsurancePlans');

//Assign a collection so the object knows how to perform CRUD operations
InsurancePlan.prototype._collection = InsurancePlans;

//Add the transform to the collection
InsurancePlans._transform = function (document) {
  return new InsurancePlan(document);
};

export default { InsurancePlan, InsurancePlans };
