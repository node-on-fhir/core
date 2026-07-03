// imports/lib/schemas/SimpleSchemas/SupplyRequests.js
// Collection definition for SupplyRequest resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/SupplyRequest.json.
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// Create the collection
export const SupplyRequests = createFhirCollection('SupplyRequest', 'SupplyRequests');

export default SupplyRequests;
