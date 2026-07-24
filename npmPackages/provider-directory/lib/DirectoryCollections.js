// npmPackages/provider-directory/lib/DirectoryCollections.js
//
// The CMS National Directory (directory.cms.gov) bulk public-use files are loaded
// into a dedicated dotted "Directory.*" namespace so the (very large, raw,
// unvalidated) national mirror coexists with the host app's own
// Organizations / Practitioners / etc. collections without colliding.
//
// These collections are INTENTIONALLY kept out of:
//   - server/publications/autopublish.js  (its slice(0,-1) singularizer mangles
//     dotted names, and we must never auto-publish millions of docs to a client)
//   - the FHIR REST registry              (a dotted name isn't a FHIR resourceType)
// Access is server-side only: estimatedDocumentCount() for counts and
// rawCollection().bulkWrite() for bulk load. No SimpleSchema is attached — rows
// are written through the raw driver with no validation.
//
// Isomorphic: imported by both client.js and server/index.js.

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

// Manifest resource_name (singular, parsed from /downloads/manifest.json filenames) -> dotted collection key
// (pluralized per the Directory.* namespace convention the user specified).
export const DIRECTORY_RESOURCES = [
  { resourceName: 'Practitioner',            key: 'Directory.Practitioners' },
  { resourceName: 'PractitionerRole',        key: 'Directory.PractitionerRoles' },
  { resourceName: 'Organization',            key: 'Directory.Organizations' },
  { resourceName: 'OrganizationAffiliation', key: 'Directory.OrganizationAffiliations' },
  { resourceName: 'Location',                key: 'Directory.Locations' },
  { resourceName: 'Endpoint',                key: 'Directory.Endpoints' }
];

// Instantiate each collection exactly once (this module is imported on both
// client and server; Mongo.Collection must not be constructed twice for a name).
const __byKey = {};
const __byResourceName = {};
DIRECTORY_RESOURCES.forEach(function (entry) {
  const collection = new Mongo.Collection(entry.key);
  __byKey[entry.key] = collection;
  __byResourceName[entry.resourceName] = collection;
});

// resource_name -> collection (e.g. DirectoryCollections['Practitioner'])
export const DirectoryCollections = __byResourceName;

// Resolve a Directory collection by its manifest resource_name.
export function getDirectoryCollection(resourceName) {
  return __byResourceName[resourceName];
}

// Register into the host registries so Collections['Directory.X'] lookups resolve
// on both sides. Guarded — host globals may not exist yet at our load order
// (npmPackages/CLAUDE.md load-order gotcha). The feature itself imports the
// collections directly and does NOT depend on these registries.
export function registerDirectoryCollections() {
  if (Meteor.isServer) {
    if (!global.Collections) { global.Collections = {}; }
    if (!Meteor.Collections) { Meteor.Collections = {}; }
    DIRECTORY_RESOURCES.forEach(function (entry) {
      global.Collections[entry.key] = __byKey[entry.key];
      Meteor.Collections[entry.key] = __byKey[entry.key];
    });
  }
  if (Meteor.isClient && typeof window !== 'undefined') {
    if (!window.Collections) { window.Collections = {}; }
    DIRECTORY_RESOURCES.forEach(function (entry) {
      window.Collections[entry.key] = __byKey[entry.key];
      if (Meteor.Collections) { Meteor.Collections[entry.key] = __byKey[entry.key]; }
    });
  }
}

export default DirectoryCollections;
