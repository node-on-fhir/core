// tests/unit/imports/api/email/parseMailUrl.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseMailUrlRedacted } = require('../../../../../imports/api/email/parseMailUrl.js');

test('parses host/port/protocol and flags credentials WITHOUT returning them', function() {
  const parsed = parseMailUrlRedacted('smtps://apikey:SG.secret@smtp.sendgrid.net:465');
  assert.deepEqual(parsed, { protocol: 'smtps', host: 'smtp.sendgrid.net', port: '465', hasCredentials: true });
  assert.ok(!JSON.stringify(parsed).includes('SG.secret'));
});

test('handles credential-free and default-port URLs', function() {
  assert.deepEqual(parseMailUrlRedacted('smtp://localhost'), { protocol: 'smtp', host: 'localhost', port: null, hasCredentials: false });
});

test('returns null for garbage and empty input', function() {
  assert.equal(parseMailUrlRedacted(''), null);
  assert.equal(parseMailUrlRedacted(undefined), null);
  assert.equal(parseMailUrlRedacted('not-a-url'), null);
});
