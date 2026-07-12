// imports/lib/schemas/SimpleSchemas/DiagnosticReports.js
// Collection definition for DiagnosticReport resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/DiagnosticReport.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let DiagnosticReport = BaseModel.extend();

export let DiagnosticReports = createFhirCollection('DiagnosticReport', 'DiagnosticReports');

//Assign a collection so the object knows how to perform CRUD operations
DiagnosticReport.prototype._collection = DiagnosticReports;

//Add the transform to the collection
DiagnosticReports._transform = function (document) {
  return new DiagnosticReport(document);
};

export default { DiagnosticReport, DiagnosticReports };
