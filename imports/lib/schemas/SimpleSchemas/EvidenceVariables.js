// imports/lib/schemas/SimpleSchemas/EvidenceVariables.js
// Collection definition for EvidenceVariable resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/EvidenceVariable.json.
//
// FHIR R4B EvidenceVariable — defines the population/exposure/criteria a
// Decision Support Intervention evaluates against.

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let EvidenceVariables = createFhirCollection('EvidenceVariable', 'EvidenceVariables');

let EvidenceVariable = BaseModel.extend();
EvidenceVariable.prototype._collection = EvidenceVariables;
EvidenceVariables._transform = function (document) {
  return new EvidenceVariable(document);
};

export default { EvidenceVariable, EvidenceVariables };
