// imports/lib/schemas/SimpleSchemas/StructureDefinitions.js
// Collection definition for StructureDefinition resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/StructureDefinition.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let StructureDefinition = BaseModel.extend();

export let StructureDefinitions = createFhirCollection('StructureDefinition', 'StructureDefinitions');

//Assign a collection so the object knows how to perform CRUD operations
StructureDefinition.prototype._collection = StructureDefinitions;

// NOTE: transform was not active in the original file — left disabled.
// StructureDefinitions._transform = function (document) {
//   return new StructureDefinition(document);
// };
