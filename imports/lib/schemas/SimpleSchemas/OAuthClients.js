// imports/lib/schemas/SimpleSchemas/OAuthClients.js
// Collection definition for OAuthClient resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/OAuthClient.json.
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// // create the object using our BaseModel
// // OAuthClient = BaseModel.extend();
// OAuthClient = BaseModel.extend();

// //Assign a collection so the object knows how to perform CRUD operations
// OAuthClient.prototype._collection = OAuthClients;

OAuthClients = createFhirCollection('OAuthClient', 'OAuthClients');


// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// OAuthClients._transform = function (document) {
//   return new OAuthClient(document);
// };

export default { OAuthClient, OAuthClients };
