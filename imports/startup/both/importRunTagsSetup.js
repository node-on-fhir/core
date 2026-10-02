// imports/startup/both/importRunTagsSetup.js
//
// Registers the import-run provenance tag helpers as Meteor.ImportRunTags on
// both client and server (Meteor.Logger pattern), so npm workflow packages
// (data-importer, and later facebook-parser/pdf-parser) can stamp resources
// without importing host paths:
//
//   const ImportRunTags = Meteor.ImportRunTags;
//   if (ImportRunTags) { ImportRunTags.applyImportRunTags(resource, { importRunId, importType }); }

import { Meteor } from 'meteor/meteor';
import ImportRunTags from '/imports/lib/importRunTags.js';

Meteor.ImportRunTags = ImportRunTags;
