// imports/lib/schemas/SimpleSchemas/Claims.js
// Collection definition for Claim resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Claim.json.
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// Create the FHIR Claims collection
export const Claims = createFhirCollection('Claim', 'Claims');

export default { Claims };
