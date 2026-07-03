// imports/lib/schemas/SimpleSchemas/Endpoints.js
// Collection definition for Endpoint resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Endpoint.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Endpoint = BaseModel.extend();


// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.Endpoints = new Mongo.Collection('HL7.Resources.Endpoints');
export let Endpoints = createFhirCollection('Endpoint', 'Endpoints');

//Assign a collection so the object knows how to perform CRUD operations
Endpoint.prototype._collection = Endpoints;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Endpoints._transform = function (document) {
  return new Endpoint(document);
};

export default { Endpoint, Endpoints };
