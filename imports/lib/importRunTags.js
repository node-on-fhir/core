// imports/lib/importRunTags.js
//
// Import-run provenance tags. Every resource created by an import pipeline
// (data-importer warehouse, dicom.* methods; facebook-parser/pdf-parser adopt
// later) carries two meta.tag codings: WHICH run created it (import-run UUID)
// and WHAT KIND of payload it came from (content type). These make imported
// data findable by meta.tag and flushable by run via importRuns.flush —
// generalizing the orbital dual-tag + clearMission pattern
// (extensions/orbital/lib/simulationTags.js).
//
// meta.source is deliberately NOT used: it is load-bearing elsewhere
// (smart-fetch dedup keys, Apple Health source label, pdf-parser job URNs).
//
// Authored as dependency-free CommonJS (BundleReferenceResolver precedent):
// the CI lib-unit-tests job runs `node --test` off a bare checkout with no
// npm install, and plain node classifies .js as CJS here. ESM import sites
// (rspack bundle, startup/both setup) interop fine. Registered as
// Meteor.ImportRunTags by imports/startup/both/importRunTagsSetup.js so npm
// workflow packages can consume it without importing host paths.

var IMPORT_RUN_TAG_SYSTEM = 'urn:honeycomb:import-run';
var IMPORT_TYPE_TAG_SYSTEM = 'urn:honeycomb:import-type';

// Canonical content-type codes. Not exhaustive — importers may pass others —
// but UI (Runs tab chips) and importers should prefer these spellings.
var IMPORT_TYPES = {
  APPLE_HEALTH: 'apple-health',
  DICOM: 'dicom',
  FHIR_BUNDLE: 'fhir-bundle',
  NDJSON: 'ndjson',
  REST_API: 'rest-api',
  ECG_WAV: 'ecg-wav',
  PCG_WAV: 'pcg-wav',
  IMAGE: 'image',
  VIDEO: 'video',
  PDF: 'pdf',
  EHI_EXPORT: 'ehi-export',
  SOCIAL_MEDIA: 'social-media'
};

/**
 * Build the meta.tag codings for an import run.
 * @param {Object} options
 * @param {string} options.importRunId - Run UUID (required for the run tag)
 * @param {string} [options.importType] - Content-type code (IMPORT_TYPES.*)
 * @returns {Array} FHIR Coding[] for meta.tag
 */
function buildImportRunTags(options) {
  options = options || {};
  var tags = [];
  if (options.importRunId) {
    tags.push({
      system: IMPORT_RUN_TAG_SYSTEM,
      code: options.importRunId,
      display: 'Import Run ' + options.importRunId
    });
  }
  if (options.importType) {
    tags.push({
      system: IMPORT_TYPE_TAG_SYSTEM,
      code: options.importType,
      display: 'Import Type: ' + options.importType
    });
  }
  return tags;
}

/**
 * Merge import-run tags into a resource's meta.tag, idempotently — an
 * existing coding with the same system+code is never duplicated, and
 * existing tags from other systems are preserved. Mutates and returns
 * the resource (matches how the warehouse pipeline handles resources).
 * @param {Object} resource - FHIR resource (plain object)
 * @param {Object} options - Same shape as buildImportRunTags
 * @returns {Object} the resource
 */
function applyImportRunTags(resource, options) {
  if (!resource || typeof resource !== 'object') {
    return resource;
  }
  var newTags = buildImportRunTags(options);
  if (newTags.length === 0) {
    return resource;
  }
  if (!resource.meta || typeof resource.meta !== 'object') {
    resource.meta = {};
  }
  if (!Array.isArray(resource.meta.tag)) {
    resource.meta.tag = [];
  }
  newTags.forEach(function(tag) {
    var exists = resource.meta.tag.some(function(existing) {
      return existing && existing.system === tag.system && existing.code === tag.code;
    });
    if (!exists) {
      resource.meta.tag.push(tag);
    }
  });
  return resource;
}

/**
 * Mongo selector matching every resource stamped with the given run id.
 * @param {string} importRunId
 * @returns {Object} selector using $elemMatch on meta.tag
 */
function importRunTagQuery(importRunId) {
  return {
    'meta.tag': {
      $elemMatch: {
        system: IMPORT_RUN_TAG_SYSTEM,
        code: importRunId
      }
    }
  };
}

module.exports = {
  IMPORT_RUN_TAG_SYSTEM: IMPORT_RUN_TAG_SYSTEM,
  IMPORT_TYPE_TAG_SYSTEM: IMPORT_TYPE_TAG_SYSTEM,
  IMPORT_TYPES: IMPORT_TYPES,
  buildImportRunTags: buildImportRunTags,
  applyImportRunTags: applyImportRunTags,
  importRunTagQuery: importRunTagQuery
};
