// imports/lib/schemas/SimpleSchemas/ArtifactAssessments.js
// Collection definition for ArtifactAssessment resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ArtifactAssessment.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let ArtifactAssessments = createFhirCollection('ArtifactAssessment', 'ArtifactAssessments');

// create the object using our BaseModel
let ArtifactAssessment = BaseModel.extend();

//Assign a collection so the object knows how to perform CRUD operations
ArtifactAssessment.prototype._collection = ArtifactAssessments;

//Add the transform to the collection
ArtifactAssessments._transform = function (document) {
  return new ArtifactAssessment(document);
};

export default { ArtifactAssessment, ArtifactAssessments };
