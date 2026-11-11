import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { scrubEventParams, ALLOWED_PARAM_KEYS } = require('../../../../imports/lib/scrubEventParams.js');

test('passes allowlisted scalar params through', function() {
  assert.deepEqual(
    scrubEventParams({ product: 'mars-to-table', cta_location: 'hero', value: 3 }),
    { product: 'mars-to-table', cta_location: 'hero', value: 3 }
  );
});

test('drops non-allowlisted keys entirely', function() {
  assert.deepEqual(scrubEventParams({ email: 'a@b.com', name: 'Ada', product: 'x' }), { product: 'x' });
});

test('drops allowlisted keys whose VALUE contains an email address', function() {
  assert.deepEqual(scrubEventParams({ source: 'ref-a@b.com' }), {});
});

test('drops objects/arrays/functions; tolerates null/undefined input', function() {
  assert.deepEqual(scrubEventParams({ product: { nested: true } }), {});
  assert.deepEqual(scrubEventParams(null), {});
});

test('allowlist covers the funnel vocabulary', function() {
  ['product', 'page_path', 'cta_location', 'source', 'method',
   'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
   'item_id', 'item_name', 'interest_area', 'value', 'currency'
  ].forEach(function(key) { assert.ok(ALLOWED_PARAM_KEYS.indexOf(key) !== -1, key); });
});
