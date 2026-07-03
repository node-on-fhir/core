// imports/lib/schemas/SimpleSchemas/InboundRequests.js
// Collection definition for InboundRequest resources (app-internal, non-FHIR).
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/InboundRequest.json (no JSON schema
// exists for this app-internal collection; documents pass through unvalidated).
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export const InboundRequests = createFhirCollection('InboundRequest', 'InboundRequests');
