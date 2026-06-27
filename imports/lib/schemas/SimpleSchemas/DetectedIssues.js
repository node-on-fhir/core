// imports/lib/schemas/SimpleSchemas/DetectedIssues.js
//
// FHIR R4B DetectedIssue — used by Decision Support Interventions
// (§ 170.315(b)(11)) to record the "actively presented" alert produced when a
// DSI fires against an order / patient context.

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export let DetectedIssues = new Mongo.Collection('DetectedIssues');

// create the object using our BaseModel
let DetectedIssue = BaseModel.extend();

// Assign a collection so the object knows how to perform CRUD operations
DetectedIssue.prototype._collection = DetectedIssues;

// Add the transform to the collection
DetectedIssues._transform = function (document) {
  return new DetectedIssue(document);
};

// Minimal, unattached schema (kept for documentation/parity; the rest of the
// SimpleSchemas in this directory leave attachSchema commented out as well).
let DetectedIssueR4Schema = new SimpleSchema({
  "_id": { type: String, optional: true },
  "id": { type: String, optional: true },
  "meta": { type: Object, optional: true, blackbox: true },
  "resourceType": { type: String, defaultValue: "DetectedIssue" },
  "identifier": { type: Array, optional: true },
  "identifier.$": { type: Object, optional: true, blackbox: true },
  "status": { type: String, optional: true },          // registered | preliminary | final | amended ...
  "code": { type: Object, optional: true, blackbox: true },
  "severity": { type: String, optional: true },        // high | moderate | low
  "patient": { type: Object, optional: true, blackbox: true },
  "identifiedDateTime": { type: String, optional: true },
  "author": { type: Object, optional: true, blackbox: true },
  "implicated": { type: Array, optional: true },
  "implicated.$": { type: Object, optional: true, blackbox: true },
  "evidence": { type: Array, optional: true },
  "evidence.$": { type: Object, optional: true, blackbox: true },
  "detail": { type: String, optional: true },
  "reference": { type: String, optional: true },
  "mitigation": { type: Array, optional: true },
  "mitigation.$": { type: Object, optional: true, blackbox: true },
  "extension": { type: Array, optional: true },
  "extension.$": { type: Object, optional: true, blackbox: true }
});

// DetectedIssues.attachSchema(DetectedIssueR4Schema);

export default { DetectedIssue, DetectedIssues, DetectedIssueR4Schema };
