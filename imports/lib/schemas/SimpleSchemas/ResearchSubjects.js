// imports/lib/schemas/SimpleSchemas/ResearchSubjects.js
// Collection definition for ResearchSubject resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ResearchSubject.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

let ResearchSubjects = createFhirCollection('ResearchSubject', 'ResearchSubjects');

// create the object using our BaseModel
let ResearchSubject = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
ResearchSubject.prototype._collection = ResearchSubjects;

//Add the transform to the collection
ResearchSubjects._transform = function (document) {
  return new ResearchSubject(document);
};

export { ResearchSubject, ResearchSubjects };
