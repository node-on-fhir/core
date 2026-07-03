// imports/lib/schemas/SimpleSchemas/Subscriptions.js
// Collection definition for Subscription resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Subscription.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Subscription = BaseModel.extend();

export let Subscriptions = createFhirCollection('Subscription', 'Subscriptions');

//Assign a collection so the object knows how to perform CRUD operations
Subscription.prototype._collection = Subscriptions;

//Add the transform to the collection
Subscriptions._transform = function (document) {
  return new Subscription(document);
};

export default { Subscription, Subscriptions };
