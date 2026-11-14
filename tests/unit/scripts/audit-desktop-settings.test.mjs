// tests/unit/scripts/audit-desktop-settings.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { auditDesktopExtensions, scanText } = require('../../../scripts/audit-desktop-settings.js');

function makeFixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'audit-fixture-'));
  mkdirSync(join(root, 'extensions', 'desktop-testgame', 'settings'), { recursive: true });
  return root;
}

test('clean settings and scripts produce zero findings', function() {
  const root = makeFixtureRoot();
  writeFileSync(join(root, 'extensions', 'desktop-testgame', 'package.json'),
    JSON.stringify({ scripts: { dev: 'EXTRA_WORKFLOWS=@orbital/core node scripts/dev.js' } }));
  writeFileSync(join(root, 'extensions', 'desktop-testgame', 'settings', 'settings.test.json'),
    JSON.stringify({ private: { stripe: { secretKey: '' }, accounts: { password: 'random_password' } } }));
  const findings = auditDesktopExtensions(root);
  assert.equal(findings.length, 0);
  rmSync(root, { recursive: true, force: true });
});

test('detects a Google API key in package.json scripts', function() {
  const root = makeFixtureRoot();
  // synthetic key matching the AIza[35] shape — NOT a real credential
  const fakeKey = 'AIza' + 'A'.repeat(35);
  writeFileSync(join(root, 'extensions', 'desktop-testgame', 'package.json'),
    JSON.stringify({ scripts: { dev: 'GOOGLE_MAPS_API_KEY=' + fakeKey + ' node scripts/dev.js' } }));
  const findings = auditDesktopExtensions(root);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].pattern, 'Google API key');
  assert.match(findings[0].source, /desktop-testgame\/package\.json/);
  // preview must never contain the full secret
  assert.ok(!findings[0].preview.includes(fakeKey));
  rmSync(root, { recursive: true, force: true });
});

test('detects Stripe live keys and private key blocks in settings', function() {
  const root = makeFixtureRoot();
  writeFileSync(join(root, 'extensions', 'desktop-testgame', 'settings', 'settings.prod.json'),
    JSON.stringify({ private: {
      stripe: { secretKey: 'sk_live_' + 'B'.repeat(24) },
      x509: { key: '-----BEGIN RSA PRIVATE KEY-----\nMIIE...' }
    } }));
  const findings = auditDesktopExtensions(root);
  const patterns = findings.map(function(f) { return f.pattern; }).sort();
  assert.deepEqual(patterns, ['Private key block', 'Stripe live secret']);
  rmSync(root, { recursive: true, force: true });
});

test('detects an SMTP MAIL_URL with embedded credentials', function() {
  const root = makeFixtureRoot();
  writeFileSync(join(root, 'extensions', 'desktop-testgame', 'settings', 'settings.mail.json'),
    JSON.stringify({ private: { MAIL_URL: 'smtps://apikey:SG.fakepass@smtp.sendgrid.net:465' } }));
  const findings = auditDesktopExtensions(root);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].pattern, 'SMTP URL with credentials');
  rmSync(root, { recursive: true, force: true });
});

test('missing extensions directory returns empty findings (CI-safe)', function() {
  const root = mkdtempSync(join(tmpdir(), 'audit-empty-'));
  assert.deepEqual(auditDesktopExtensions(root), []);
  rmSync(root, { recursive: true, force: true });
});

test('scanText reports source label verbatim', function() {
  const findings = [];
  scanText('token xoxb-' + '1'.repeat(12) + '-abc', 'myfile.json', findings);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].source, 'myfile.json');
  assert.equal(findings[0].pattern, 'Slack token');
});
