// imports/lib/schemas/SimpleSchemas/ClinicalImpressions.js
// Collection definition for ClinicalImpression resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ClinicalImpression.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let ClinicalImpression = BaseModel.extend();

export let ClinicalImpressions = createFhirCollection('ClinicalImpression', 'ClinicalImpressions');

// Assign a collection so the object knows how to perform CRUD operations
ClinicalImpression.prototype._collection = ClinicalImpressions;

// Add the transform to the collection
ClinicalImpressions._transform = function (document) {
  return new ClinicalImpression(document);
};

export default { ClinicalImpression, ClinicalImpressions };
