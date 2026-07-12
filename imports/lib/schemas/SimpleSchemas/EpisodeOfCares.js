// imports/lib/schemas/SimpleSchemas/EpisodeOfCares.js
// Collection definition for EpisodeOfCare resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/EpisodeOfCare.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let EpisodeOfCare = BaseModel.extend();


export let EpisodeOfCares = createFhirCollection('EpisodeOfCare', 'EpisodeOfCares');

//Assign a collection so the object knows how to perform CRUD operations
EpisodeOfCare.prototype._collection = EpisodeOfCares;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
EpisodeOfCares._transform = function (document) {
  return new EpisodeOfCare(document);
};

export default { EpisodeOfCare, EpisodeOfCares };
