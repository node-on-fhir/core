// tests/unit/imports/lib/campaignAttribution.test.mjs
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

function freshWindow(pathname) {
  const backing = {};
  globalThis.window = {
    location: { pathname: pathname || '/homepage' },
    localStorage: {
      getItem: function(k) { return Object.prototype.hasOwnProperty.call(backing, k) ? backing[k] : null; },
      setItem: function(k, v) { backing[k] = String(v); }
    }
  };
}

const { parseUtmParams, captureAttribution, getAttribution } =
  require('../../../../imports/lib/campaignAttribution.js');

beforeEach(function() { freshWindow('/mars-to-table'); });

test('parseUtmParams extracts only the five utm keys', function() {
  assert.deepEqual(
    parseUtmParams('?utm_source=postcard&utm_campaign=mars-society-2026&foo=bar'),
    { utm_source: 'postcard', utm_campaign: 'mars-society-2026' }
  );
  assert.deepEqual(parseUtmParams(''), {});
  assert.deepEqual(parseUtmParams('?plain=1'), {});
});

test('first visit with UTMs sets both first and latest touch with landing page', function() {
  const result = captureAttribution('?utm_source=linkedin&utm_campaign=launch', '2026-11-10T00:00:00Z');
  assert.equal(result.first.utm_source, 'linkedin');
  assert.equal(result.first.at, '2026-11-10T00:00:00Z');
  assert.equal(result.first.landingPage, '/mars-to-table');
  assert.deepEqual(result.first, result.latest);
});

test('later UTM visit updates latest, preserves first', function() {
  captureAttribution('?utm_source=linkedin&utm_campaign=launch', '2026-11-01T00:00:00Z');
  const result = captureAttribution('?utm_source=youtube&utm_campaign=trailer', '2026-11-10T00:00:00Z');
  assert.equal(result.first.utm_source, 'linkedin');
  assert.equal(result.latest.utm_source, 'youtube');
});

test('UTM-less visit changes nothing; bookmarks and direct entry work', function() {
  captureAttribution('?utm_source=linkedin', '2026-11-01T00:00:00Z');
  const result = captureAttribution('', '2026-11-10T00:00:00Z');
  assert.equal(result.latest.utm_source, 'linkedin');
  assert.deepEqual(getAttribution(), result);
});

test('no storage, no UTMs -> null touches, never throws', function() {
  delete globalThis.window;
  assert.deepEqual(getAttribution(), { first: null, latest: null });
  assert.doesNotThrow(function() { captureAttribution('?utm_source=x', '2026-11-10T00:00:00Z'); });
});
