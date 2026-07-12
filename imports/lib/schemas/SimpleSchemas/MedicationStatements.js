// imports/lib/schemas/SimpleSchemas/MedicationStatements.js
// Collection definition for MedicationStatement resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/MedicationStatement.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let MedicationStatement = BaseModel.extend();

export let MedicationStatements = createFhirCollection('MedicationStatement', 'MedicationStatements');

//Assign a collection so the object knows how to perform CRUD operations
MedicationStatement.prototype._collection = MedicationStatements;

//Add the transform to the collection
MedicationStatements._transform = function (document) {
  return new MedicationStatement(document);
};

export default { MedicationStatement, MedicationStatements };
