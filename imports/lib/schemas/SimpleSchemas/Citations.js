// imports/lib/schemas/SimpleSchemas/Citations.js
//
// FHIR R4B Citation — the bibliographic citation source attribute for
// evidence-based Decision Support Interventions (§ 170.315(b)(11)(iv)(A)(1)).
//
// Collection definition for Citation resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Citation.json.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let Citations = createFhirCollection('Citation', 'Citations');

let Citation = BaseModel.extend();
Citation.prototype._collection = Citations;
Citations._transform = function (document) {
  return new Citation(document);
};

export default { Citation, Citations };
