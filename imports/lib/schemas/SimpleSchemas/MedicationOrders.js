// imports/lib/schemas/SimpleSchemas/MedicationOrders.js
// Collection definition for MedicationOrder resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/MedicationOrder.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let MedicationOrder = BaseModel.extend();

export let MedicationOrders = createFhirCollection('MedicationOrder', 'MedicationOrders');

//Assign a collection so the object knows how to perform CRUD operations
MedicationOrder.prototype._collection = MedicationOrders;

//Add the transform to the collection
MedicationOrders._transform = function (document) {
  return new MedicationOrder(document);
};

export default { MedicationOrder, MedicationOrders };
