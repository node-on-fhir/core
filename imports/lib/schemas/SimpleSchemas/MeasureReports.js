// imports/lib/schemas/SimpleSchemas/MeasureReports.js
// Collection definition for MeasureReport resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/MeasureReport.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let MeasureReport = BaseModel.extend();

export let MeasureReports = createFhirCollection('MeasureReport', 'MeasureReports');

//Assign a collection so the object knows how to perform CRUD operations
MeasureReport.prototype._collection = MeasureReports;

// NOTE: no collection _transform in the original file (it was commented out).

export { MeasureReport }
