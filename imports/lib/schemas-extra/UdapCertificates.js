// imports/lib/schemas-extra/UdapCertificates.js
// Collection definition for UdapCertificate records (app-internal, non-FHIR).
// SimpleSchema definition removed 2026-07 (JSON Schema migration): validation
// now lives in imports/lib/FhirValidator.js against the hand-written
// ./UdapCertificates.schema.json, registered as a custom schema.
// NOTE: the previous `_transform` referenced an undefined UdapCertificate
// class (it would have thrown on any read) — removed rather than preserved.
import { createFhirCollection } from '/imports/lib/ValidatedCollection';
import FhirValidator from '/imports/lib/FhirValidator.js';
import udapCertificateSchema from './UdapCertificates.schema.json';

FhirValidator.registerSchema('UdapCertificate', udapCertificateSchema);

export let UdapCertificates = createFhirCollection('UdapCertificate', 'UdapCertificates');
