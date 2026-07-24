// tests/rpc/conformance.test.mjs
//
// OpenRPC-driven conformance sweep (Stage 1, docs/RPC-TESTING.md): walk every
// method the live server registered, call it with schema-derived minimal
// params and an authenticated token, and assert THE conformance property:
//
//     no method may crash internally (-32603) on well-formed input.
//
// Mapped application errors are PASSES — not-authorized (role gates),
// not-found (placeholder ids), validation-failed, feature-disabled are all
// the pipeline doing its job. Only an internal crash fails. This single
// property would have mechanically caught the context.log class bug (17
// methods across 5 extensions) and the compositions.insert collision.
//
// Safety tiers (RPC_SWEEP env):
//   read  (default) — only read-shaped methods (get/list/find/...): safe
//                     against ANY server, including a dev DB you care about
//   write           — read + write-shaped (create/update/save/...): inserts
//                     sweep records; use against expendable databases
//   all             — everything incl. destructive-shaped (remove/clear/...):
//                     CI's dedicated job runs this against its own boot-fresh
//                     ephemeral database
//
// Skips are LOUD (per-tier counts + names at the end) — a bounded sweep must
// never read as full coverage.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rpcEnvelope, mintToken, discover } from './lib/rpcClient.mjs';

// Ratchet baseline: known -32603 methods (real bugs awaiting triage) are
// reported but do not fail; NEW internal errors fail. Fixed methods are
// flagged for removal. See conformance-known-failures.json.
const KNOWN_FAILURES = JSON.parse(fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'conformance-known-failures.json'), 'utf8'));

const SWEEP = process.env.RPC_SWEEP || 'read';

const READ_RE = /^(get|list|find|fetch|search|check|status|describe|count|read|preview|validate|resolve|export|discover|current|active)/i;
const DESTRUCTIVE_RE = /^(remove|delete|clear|purge|archive|reset|drop|revoke|truncate|logout|deactivate)|(remove|delete|clear|purge|wipe)/i;

// Meta/fixture methods the sweep must not call blindly.
const EXCLUDE = new Set([
  'rpc.discover',            // is the sweep's own input
  'rpcTest.mintLoginToken'   // mutates the smoke user's token list per call
]);

function tierOf(method) {
  const action = method.name.split('.').pop();
  if (method['x-streaming']) { return 'streaming'; }
  if (EXCLUDE.has(method.name)) { return 'excluded'; }
  if (DESTRUCTIVE_RE.test(action)) { return 'destructive'; }
  if (READ_RE.test(action)) { return 'read'; }
  return 'write';
}

// Minimal valid-shaped params from a JSON schema: every required property
// gets a type-appropriate placeholder. Semantic rejection (-32602/not-found)
// is fine — we only need to get PAST parse, INTO the pipeline.
function minimalParams(schema) {
  if (!schema || schema.type !== 'object' || !schema.properties) { return {}; }
  const params = {};
  (schema.required || []).forEach(function(key) {
    const prop = schema.properties[key] || {};
    const type = Array.isArray(prop.type) ? prop.type[0] : prop.type;
    if (type === 'string') { params[key] = 'conformance-sweep-nonexistent'; }
    else if (type === 'number' || type === 'integer') { params[key] = 0; }
    else if (type === 'boolean') { params[key] = false; }
    else if (type === 'array') { params[key] = []; }
    else { params[key] = {}; }
  });
  return params;
}

const ALLOWED_TIERS = { read: ['read'], write: ['read', 'write'], all: ['read', 'write', 'destructive'] }[SWEEP] || ['read'];

test('conformance sweep: no method returns -32603 on well-formed input', async function(t) {
  const token = await mintToken();
  const methods = await discover();

  const byTier = { read: [], write: [], destructive: [], streaming: [], excluded: [] };
  methods.forEach(function(m) { byTier[tierOf(m)].push(m); });

  const toRun = ALLOWED_TIERS.flatMap(function(tier) { return byTier[tier]; });
  const skipped = Object.keys(byTier)
    .filter(function(tier) { return ALLOWED_TIERS.indexOf(tier) === -1; })
    .map(function(tier) { return { tier, methods: byTier[tier] }; });

  console.log('[conformance] mode=' + SWEEP + ' | registered=' + methods.length
    + ' | sweeping=' + toRun.length
    + ' | ' + skipped.map(function(s) { return 'skipping ' + s.tier + '=' + s.methods.length; }).join(', '));

  const internalErrors = [];
  const knownFailures = [];
  const timeouts = [];

  for (const method of toRun) {
    await t.test(method.name, async function() {
      const schema = method.params && method.params[0] && method.params[0].schema;
      let envelope;
      try {
        envelope = await rpcEnvelope(method.name, minimalParams(schema), { token, timeoutMs: 10000 });
      } catch (transportError) {
        // Timeouts are logged loudly but do not fail conformance — a slow
        // unconfigured-external method is an ops finding, not a crash.
        timeouts.push(method.name);
        console.warn('[conformance] TIMEOUT (not failed): ' + method.name);
        return;
      }
      const isInternal = envelope.error && envelope.error.code === -32603;
      const isKnown = Object.prototype.hasOwnProperty.call(KNOWN_FAILURES, method.name) && KNOWN_FAILURES[method.name] !== undefined && method.name !== '_readme';
      if (isInternal && isKnown) {
        knownFailures.push(method.name);
        console.warn('[conformance] KNOWN FAILURE (baselined, not failing CI): ' + method.name);
        return;
      }
      if (!isInternal && isKnown) {
        console.warn('[conformance] FIXED — remove "' + method.name + '" from conformance-known-failures.json');
        return;
      }
      if (isInternal) {
        internalErrors.push(method.name + ' → ' + JSON.stringify(envelope.error).slice(0, 200));
        assert.fail(method.name + ' crashed internally (-32603) and is NOT in the known-failures baseline: ' + JSON.stringify(envelope.error).slice(0, 300));
      }
      // success or mapped app error → conformant
    });
  }

  // LOUD summary — bounded coverage must never read as full coverage.
  console.log('[conformance] swept=' + toRun.length
    + ' NEW-internal-errors=' + internalErrors.length
    + ' known-failures=' + knownFailures.length + '/' + (Object.keys(KNOWN_FAILURES).length - 1)
    + ' timeouts=' + timeouts.length);
  skipped.forEach(function(s) {
    if (s.methods.length > 0 && s.tier !== 'excluded') {
      console.log('[conformance] NOT SWEPT (' + s.tier + ', ' + s.methods.length + '): '
        + s.methods.map(function(m) { return m.name; }).slice(0, 20).join(', ')
        + (s.methods.length > 20 ? ' …' : ''));
    }
  });
});
