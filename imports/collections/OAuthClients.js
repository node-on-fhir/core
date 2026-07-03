// imports/collections/OAuthClients.js
// The live OAuthClients collection (OAuth client registrations, tokens, and
// SMART launch context). Validated against the hand-written JSON Schema in
// imports/lib/schemas-extra/OAuthClients.schema.json; enforcement is enabled
// by listing 'OAuthClients' in settings.private.fhir.schemaValidation.strictCollections.
import { createFhirCollection } from '/imports/lib/ValidatedCollection';
import FhirValidator from '/imports/lib/FhirValidator.js';
import oauthClientSchema from '/imports/lib/schemas-extra/OAuthClients.schema.json';

FhirValidator.registerSchema('OAuthClient', oauthClientSchema);

export const OAuthClients = createFhirCollection('OAuthClient', 'OAuthClients');
