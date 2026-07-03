// imports/lib/schemas/SimpleSchemas/Immunizations.js
// Collection definition for Immunization resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Immunization.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Immunization = BaseModel.extend();

export let Immunizations = createFhirCollection('Immunization', 'Immunizations');

//Assign a collection so the object knows how to perform CRUD operations
Immunization.prototype._collection = Immunizations;

//Add the transform to the collection
Immunizations._transform = function (document) {
  return new Immunization(document);
};

export default { Immunization, Immunizations };
