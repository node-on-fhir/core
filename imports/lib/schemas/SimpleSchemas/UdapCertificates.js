// imports/lib/schemas/SimpleSchemas/UdapCertificates.js
// Thin re-export: the live UdapCertificates collection is defined in
// imports/lib/schemas-extra/UdapCertificates.js. This file existed as fully
// commented-out dead code, but npmPackages/provider-directory/server/https.js
// imports { UdapCertificates } from this path (previously resolving to
// undefined — a latent bug). Re-exporting the real collection preserves the
// import path and fixes the resolution.
export { UdapCertificates } from '../../schemas-extra/UdapCertificates';
