// imports/lib/schemas/SimpleSchemas/ConceptMaps.js
// Collection definition for ConceptMap resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ConceptMap.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let ConceptMaps = createFhirCollection('ConceptMap', 'ConceptMaps');

// create the object using our BaseModel
let ConceptMap = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
ConceptMap.prototype._collection = ConceptMaps;


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
ConceptMaps._transform = function (document) {
  return new ConceptMap(document);
};

export default { ConceptMap, ConceptMaps };
