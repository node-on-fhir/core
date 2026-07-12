// imports/lib/schemas/SimpleSchemas/SupplyDeliveries.js
// Collection definition for SupplyDelivery resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/SupplyDelivery.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let SupplyDelivery = BaseModel.extend();

export let SupplyDeliveries = createFhirCollection('SupplyDelivery', 'SupplyDeliveries');

//Assign a collection so the object knows how to perform CRUD operations
SupplyDelivery.prototype._collection = SupplyDeliveries;

//Add the transform to the collection
SupplyDeliveries._transform = function (document) {
  return new SupplyDelivery(document);
};

export { SupplyDelivery };
