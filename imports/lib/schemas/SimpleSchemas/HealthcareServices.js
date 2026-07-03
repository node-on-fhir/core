// imports/lib/schemas/SimpleSchemas/HealthcareServices.js
// Collection definition for HealthcareService resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/HealthcareService.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let HealthcareService = BaseModel.extend();

export let HealthcareServices = createFhirCollection('HealthcareService', 'HealthcareServices');

//Assign a collection so the object knows how to perform CRUD operations
HealthcareService.prototype._collection = HealthcareServices;

//Add the transform to the collection
HealthcareServices._transform = function (document) {
  return new HealthcareService(document);
};

export default { HealthcareService, HealthcareServices };
