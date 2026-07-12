// imports/lib/schemas/SimpleSchemas/Substances.js
// Collection definition for Substance resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Substance.json.
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// Create the collection
export const Substances = createFhirCollection('Substance', 'Substances');

export default { Substances };
