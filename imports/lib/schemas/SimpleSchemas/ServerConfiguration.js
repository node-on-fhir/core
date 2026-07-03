// imports/lib/schemas/SimpleSchemas/ServerConfiguration.js
// Collection definition for ServerConfiguration resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/ServerConfiguration.json.

import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export let ServerConfiguration = createFhirCollection('ServerConfiguration', 'ServerConfiguration');

export default { ServerConfiguration };
