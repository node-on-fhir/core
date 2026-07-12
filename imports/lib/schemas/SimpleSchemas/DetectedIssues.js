// imports/lib/schemas/SimpleSchemas/DetectedIssues.js
// Collection definition for DetectedIssue resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/DetectedIssue.json.
//
// FHIR R4B DetectedIssue — used by Decision Support Interventions
// (§ 170.315(b)(11)) to record the "actively presented" alert produced when a
// DSI fires against an order / patient context.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let DetectedIssues = createFhirCollection('DetectedIssue', 'DetectedIssues');

// create the object using our BaseModel
let DetectedIssue = BaseModel.extend();

// Assign a collection so the object knows how to perform CRUD operations
DetectedIssue.prototype._collection = DetectedIssues;

// Add the transform to the collection
DetectedIssues._transform = function (document) {
  return new DetectedIssue(document);
};

export default { DetectedIssue, DetectedIssues };
