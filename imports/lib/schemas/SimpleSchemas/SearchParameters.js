// imports/lib/schemas/SimpleSchemas/SearchParameters.js
// Collection definition for SearchParameter resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/SearchParameter.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// // create the object using our BaseModel
let SearchParameter = BaseModel.extend();

export let SearchParameters = createFhirCollection('SearchParameter', 'SearchParameters');

// //Assign a collection so the object knows how to perform CRUD operations
SearchParameter.prototype._collection = SearchParameters;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.SearchParameters = new Mongo.Collection('HL7.Resources.SearchParameters');



// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
// SearchParameters._transform = function (document) {
//   return new SearchParameter(document);
// };
