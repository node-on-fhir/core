// /imports/lib/schemas/SimpleSchemas/ServiceRequests.js
// Collection definition for ServiceRequest resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ServiceRequest.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let ServiceRequest = BaseModel.extend();

export let ServiceRequests = createFhirCollection('ServiceRequest', 'ServiceRequests');

//Assign a collection so the object knows how to perform CRUD operations
ServiceRequest.prototype._collection = ServiceRequests;

//Add the transform to the collection
ServiceRequests._transform = function (document) {
  return new ServiceRequest(document);
};

export { ServiceRequest }
