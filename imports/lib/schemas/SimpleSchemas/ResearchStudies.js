// imports/lib/schemas/SimpleSchemas/ResearchStudies.js
// Collection definition for ResearchStudy resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ResearchStudy.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';


export let ResearchStudies = createFhirCollection('ResearchStudy', 'ResearchStudies');

// create the object using our BaseModel
let ResearchStudy = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
ResearchStudy.prototype._collection = ResearchStudies;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ResearchStudies._transform = function (document) {
  return new ResearchStudy(document);
};

export default { ResearchStudy, ResearchStudies };
