// tests/unit/imports/lib/importRunTags.test.mjs
//
// Unit tests for the import-run provenance tag builder. Dependency-free CJS
// subject — runs in the bare-checkout lib-unit-tests tier (node --test, no
// npm install).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import ImportRunTags from '../../../../imports/lib/importRunTags.js';

const {
  IMPORT_RUN_TAG_SYSTEM,
  IMPORT_TYPE_TAG_SYSTEM,
  IMPORT_TYPES,
  buildImportRunTags,
  applyImportRunTags,
  importRunTagQuery
} = ImportRunTags;

test('buildImportRunTags emits run + type codings', function() {
  const tags = buildImportRunTags({ importRunId: 'run-abc123', importType: IMPORT_TYPES.APPLE_HEALTH });
  assert.equal(tags.length, 2);
  assert.deepEqual(tags[0], {
    system: IMPORT_RUN_TAG_SYSTEM,
    code: 'run-abc123',
    display: 'Import Run run-abc123'
  });
  assert.equal(tags[1].system, IMPORT_TYPE_TAG_SYSTEM);
  assert.equal(tags[1].code, 'apple-health');
});

test('buildImportRunTags omits missing pieces', function() {
  assert.equal(buildImportRunTags({}).length, 0);
  assert.equal(buildImportRunTags({ importRunId: 'x' }).length, 1);
  assert.equal(buildImportRunTags({ importType: 'dicom' }).length, 1);
  assert.equal(buildImportRunTags().length, 0);
});

test('applyImportRunTags creates meta.tag when absent', function() {
  const resource = { resourceType: 'Observation' };
  applyImportRunTags(resource, { importRunId: 'run-1', importType: 'dicom' });
  assert.equal(resource.meta.tag.length, 2);
  assert.equal(resource.meta.tag[0].code, 'run-1');
});

test('applyImportRunTags preserves existing tags from other systems', function() {
  const resource = {
    resourceType: 'Observation',
    meta: { source: 'Apple Health', tag: [{ system: 'https://example.org/other', code: 'keep-me' }] }
  };
  applyImportRunTags(resource, { importRunId: 'run-2', importType: 'apple-health' });
  assert.equal(resource.meta.tag.length, 3);
  assert.equal(resource.meta.tag[0].code, 'keep-me');
  assert.equal(resource.meta.source, 'Apple Health'); // meta.source untouched
});

test('applyImportRunTags is idempotent (no duplicate system+code)', function() {
  const resource = { resourceType: 'Patient' };
  applyImportRunTags(resource, { importRunId: 'run-3', importType: 'fhir-bundle' });
  applyImportRunTags(resource, { importRunId: 'run-3', importType: 'fhir-bundle' });
  assert.equal(resource.meta.tag.length, 2);
});

test('applyImportRunTags allows a second distinct run tag', function() {
  // Re-importing a resource under a new run keeps both run tags — flushable by either.
  const resource = { resourceType: 'Patient' };
  applyImportRunTags(resource, { importRunId: 'run-a' });
  applyImportRunTags(resource, { importRunId: 'run-b' });
  assert.equal(resource.meta.tag.length, 2);
  const codes = resource.meta.tag.map(function(t) { return t.code; });
  assert.deepEqual(codes.sort(), ['run-a', 'run-b']);
});

test('applyImportRunTags tolerates junk input (permissive-in)', function() {
  assert.equal(applyImportRunTags(null, { importRunId: 'x' }), null);
  assert.equal(applyImportRunTags(undefined, {}), undefined);
  const resource = { resourceType: 'Observation', meta: { tag: 'not-an-array' } };
  applyImportRunTags(resource, { importRunId: 'run-4' });
  assert.equal(resource.meta.tag.length, 1); // normalized to array
});

test('applyImportRunTags with no options is a no-op', function() {
  const resource = { resourceType: 'Observation' };
  applyImportRunTags(resource, {});
  assert.equal(resource.meta, undefined);
});

test('importRunTagQuery builds the $elemMatch selector', function() {
  assert.deepEqual(importRunTagQuery('run-9'), {
    'meta.tag': { $elemMatch: { system: IMPORT_RUN_TAG_SYSTEM, code: 'run-9' } }
  });
});
