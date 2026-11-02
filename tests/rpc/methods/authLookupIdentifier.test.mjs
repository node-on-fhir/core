// tests/rpc/methods/authLookupIdentifier.test.mjs
//
// Integration tests for auth.lookupIdentifier — the one-door AuthCard's
// email-first existence check (design handoff 2026-11-01). Requires a booted
// TEST_RUN server (settings.honeycomb.tdd.json). The method is unauthenticated
// by design (it runs before login) and must never leak the user id.
//
//   node --test tests/rpc/methods/authLookupIdentifier.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { rpcCall, rpcEnvelope } from '../lib/rpcClient.mjs';

const marker = 'lookupid' + String(process.pid) + String(Date.now()).slice(-5);
const seededUsername = marker;
const seededEmail = marker + '@onedoor-test.example.com';

test('auth.lookupIdentifier', async function(t) {
  // Seed one user via the rpcTest fixture (test.createTestUser is a legacy
  // Meteor.methods method — invisible over /api/rpc).
  await rpcCall('rpcTest.mintLoginToken', {
    username: seededUsername,
    email: seededEmail
  });

  await t.test('known email → exists:true, no suggestedUsername, no user id leak', async function() {
    const result = await rpcCall('auth.lookupIdentifier', { identifier: seededEmail });
    assert.equal(result.exists, true);
    assert.equal(result.suggestedUsername, undefined);
    assert.equal(result.hasPasskey, false, 'no WebAuthn service → hasPasskey false');
    assert.ok(!('userId' in result) && !('_id' in result), 'must never return the user id');
  });

  await t.test('known email is case-insensitive and trimmed', async function() {
    const sloppy = '  ' + seededEmail.toUpperCase() + '  ';
    const result = await rpcCall('auth.lookupIdentifier', { identifier: sloppy });
    assert.equal(result.exists, true);
  });

  await t.test('known username → exists:true', async function() {
    const result = await rpcCall('auth.lookupIdentifier', { identifier: seededUsername });
    assert.equal(result.exists, true);
  });

  await t.test('unknown email → exists:false + suggestedUsername from local-part', async function() {
    const result = await rpcCall('auth.lookupIdentifier', {
      identifier: 'House.MD-' + marker + '@gmail.com'
    });
    assert.equal(result.exists, false);
    assert.equal(result.suggestedUsername, 'house.md-' + marker);
  });

  await t.test('local-part under 3 chars → no suggestion', async function() {
    const result = await rpcCall('auth.lookupIdentifier', { identifier: 'ab@nowhere-' + marker + '.com' });
    assert.equal(result.exists, false);
    assert.equal(result.suggestedUsername, undefined);
  });

  await t.test('suggestion strips disallowed chars and caps at 30', async function() {
    const noisy = 'A+b!c#d$e%f^g&h*i(j)k_l-m.n~o`p=q[r]s{t}u|v;w:x,y<z>0123456789';
    const result = await rpcCall('auth.lookupIdentifier', { identifier: noisy + '@x-' + marker + '.org' });
    assert.equal(result.exists, false);
    assert.ok(result.suggestedUsername.length <= 30);
    assert.match(result.suggestedUsername, /^[a-z0-9_.-]+$/);
  });

  await t.test('empty / oversized identifier → exists:false, never throws', async function() {
    const empty = await rpcCall('auth.lookupIdentifier', { identifier: '   ' });
    assert.equal(empty.exists, false);
    const oversized = await rpcCall('auth.lookupIdentifier', { identifier: 'a'.repeat(300) + '@x.com' });
    assert.equal(oversized.exists, false);
  });

  await t.test('non-string identifier → rpc error (check failed)', async function() {
    const envelope = await rpcEnvelope('auth.lookupIdentifier', { identifier: 42 });
    assert.ok(envelope.error, 'number identifier must be rejected');
  });

  await t.test('rate limit: 11 rapid calls → at least one rejection', async function() {
    // DDP rate limit is per-connection; the HTTP pipeline enforces its own
    // limiter. Fire 11 rapid calls and expect >=1 'too-many-requests' style
    // rejection once implemented. Soft assertion shape: count errors.
    const attempts = [];
    for (let i = 0; i < 11; i++) {
      attempts.push(rpcEnvelope('auth.lookupIdentifier', { identifier: 'rl' + i + '-' + marker + '@x.com' }));
    }
    const envelopes = await Promise.all(attempts);
    const rejected = envelopes.filter(function(e) { return !!e.error; });
    assert.ok(rejected.length >= 1, 'expected the limiter to reject within 11 rapid calls, got 0 rejections');
  });
});
