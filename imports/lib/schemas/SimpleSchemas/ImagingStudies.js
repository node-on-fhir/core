// imports/lib/schemas/SimpleSchemas/ImagingStudies.js
// Collection definition for ImagingStudy resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ImagingStudy.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let ImagingStudy = BaseModel.extend();

// Create collection
export let ImagingStudies = createFhirCollection('ImagingStudy', 'ImagingStudies');

//Assign a collection so the object knows how to perform CRUD operations
ImagingStudy.prototype._collection = ImagingStudies;

// Add the transform to the collection
ImagingStudies._transform = function (document) {
  return new ImagingStudy(document);
};

// Export
export default { ImagingStudy, ImagingStudies };
