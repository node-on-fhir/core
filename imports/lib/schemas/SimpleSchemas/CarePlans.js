// imports/lib/schemas/SimpleSchemas/CarePlans.js
// Collection definition for CarePlan resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/CarePlan.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let CarePlan = BaseModel.extend();

export let CarePlans = createFhirCollection('CarePlan', 'CarePlans');

//Assign a collection so the object knows how to perform CRUD operations
CarePlan.prototype._collection = CarePlans;

//Add the transform to the collection
CarePlans._transform = function (document) {
  return new CarePlan(document);
};

export default { CarePlan, CarePlans };
