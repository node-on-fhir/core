// imports/lib/schemas/SimpleSchemas/Networks.js
// Collection definition for Network resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Network.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Network = BaseModel.extend();

export let Networks = createFhirCollection('Network', 'Networks');

//Assign a collection so the object knows how to perform CRUD operations
Network.prototype._collection = Networks;

//Add the transform to the collection
Networks._transform = function (document) {
  return new Network(document);
};

export default { Network, Networks };
