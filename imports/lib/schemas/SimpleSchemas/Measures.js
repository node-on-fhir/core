// imports/lib/schemas/SimpleSchemas/Measures.js
// Collection definition for Measure resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Measure.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Measure = BaseModel.extend();

let Measures = createFhirCollection('Measure', 'Measures');

//Assign a collection so the object knows how to perform CRUD operations
Measure.prototype._collection = Measures;

// NOTE: no collection _transform in the original file (it was commented out).

export { Measure, Measures }
