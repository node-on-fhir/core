// tests/unit/npmPackages/data-importer/classifyZip.test.mjs
//
// Unit test for the zip classifier that fixes the "every .zip is Apple Health" bug.
// Fixtures built in-memory with fflate zipSync; run under `node --test`. Imports
// fflate, so this runs in a CI job that has node_modules (NOT the dependency-free
// lib-unit job — see memory lib-test-tier-constraints).
//
//   npm run test:classify-zip

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';

import { classifyZip, classifyEntryName } from '../../../../npmPackages/data-importer/client/classifyZip.js';

function makeZip(entries) {
  const files = {};
  for (const [name, val] of Object.entries(entries)) {
    files[name] = val instanceof Uint8Array ? val : strToU8(typeof val === 'string' ? val : JSON.stringify(val));
  }
  return zipSync(files);
}

function asFile(bytes, name) {
  return new File([bytes], name);
}

test('classifyEntryName matches Apple Health and Facebook top-level markers', function() {
  assert.equal(classifyEntryName('apple_health_export/export.xml'), 'apple-health');
  assert.equal(classifyEntryName('your_facebook_activity/posts/your_posts_1.json'), 'facebook');
  assert.equal(classifyEntryName('connections/friends/your_friends.json'), 'facebook');
  assert.equal(classifyEntryName('personal_information/profile_information/profile_information.json'), 'facebook');
  assert.equal(classifyEntryName('random/other/file.txt'), null);
  assert.equal(classifyEntryName(''), null);
});

test('classifyZip → apple-health for an Apple Health export', async function() {
  const zip = makeZip({
    'apple_health_export/export.xml': '<!DOCTYPE HealthData>\n<HealthData/>',
    'apple_health_export/export_cda.xml': '<ClinicalDocument/>'
  });
  assert.equal(await classifyZip(asFile(zip, 'export.zip')), 'apple-health');
});

test('classifyZip → facebook for a Facebook export (media-only, first entry marks it)', async function() {
  const zip = makeZip({
    'your_facebook_activity/posts/media/photo_0001.jpg': new Uint8Array([1, 2, 3, 4]),
    'connections/friends/your_friends.json': { friends: [{ name: 'Alice' }] }
  });
  assert.equal(await classifyZip(asFile(zip, 'facebook-export.zip')), 'facebook');
});

test('classifyZip → facebook for a JSON-format Facebook export', async function() {
  const zip = makeZip({
    'personal_information/profile_information/profile_information.json': { profile_v2: {} },
    'your_facebook_activity/messages/inbox/thread/message_1.json': { messages: [] }
  });
  assert.equal(await classifyZip(asFile(zip, 'fb.zip')), 'facebook');
});

test('classifyZip → unknown for an unrelated zip', async function() {
  const zip = makeZip({
    'stuff/readme.txt': 'hello',
    'data/records.json': [{ x: 1 }]
  });
  assert.equal(await classifyZip(asFile(zip, 'misc.zip')), 'unknown');
});

test('classifyZip → unknown for a non-file / streamless input', async function() {
  assert.equal(await classifyZip(null), 'unknown');
  assert.equal(await classifyZip({}), 'unknown');
});
