// tests/rpc/methods/pipeline.test.mjs
//
// Exemplar suite for the PIPELINE properties (Stage 1, docs/RPC-TESTING.md):
// the auth matrix, AJV validation, role gating, alias resolution, and error
// mapping — asserted over the real wire against rpcTest.* fixtures. Deeper
// than the CI smoke battery: exact codes, exact error data shapes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { rpcCall, rpcEnvelope, mintToken } from '../lib/rpcClient.mjs';

test('auth matrix on a guarded method', async function(t) {
  await t.test('no token → -32001 + HTTP 403', async function() {
    const e = await rpcEnvelope('rpcTest.guarded');
    assert.equal(e.error.code, -32001);
    assert.equal(e.status, 403);
    assert.equal(e.error.data.error, 'not-authorized');
  });

  await t.test('garbage bearer → -32001', async function() {
    const e = await rpcEnvelope('rpcTest.guarded', {}, { token: 'not-a-real-token' });
    assert.equal(e.error.code, -32001);
  });

  await t.test('minted token → success with userId', async function() {
    const token = await mintToken();
    const result = await rpcCall('rpcTest.guarded', {}, { token });
    assert.equal(result.secret, true);
    assert.equal(typeof result.userId, 'string');
  });
});

test('role gate: PINNED roles decide admission (never trust deployment defaultRole)', async function(t) {
  // Environments vary settings.private.accounts.defaultRole (the lunar-sim
  // profile grants every new user 'healthcare practitioner'!) — so role-gate
  // tests mint users with explicitly pinned roles.
  await t.test('role-less user is refused (mapped -32001, not internal)', async function() {
    const noRoles = await rpcCall('rpcTest.mintLoginToken', { username: 'rpc-smoke-noroles', roles: ['user'] });
    const e = await rpcEnvelope('rpcTest.practitionerOnly', {}, { token: noRoles.token });
    assert.ok(e.error, 'must be refused');
    assert.notEqual(e.error.code, -32603);
    assert.equal(e.error.code, -32001);
  });

  await t.test('practitioner-role user is admitted', async function() {
    const practitioner = await rpcCall('rpcTest.mintLoginToken', { username: 'rpc-smoke-practitioner', roles: ['healthcare practitioner'] });
    const result = await rpcCall('rpcTest.practitionerOnly', {}, { token: practitioner.token });
    assert.equal(result, 'admitted');
  });
});

test('AJV validation: exact -32602 with validation details', async function() {
  const e = await rpcEnvelope('rpcTest.sum', { a: 'not-a-number' });
  assert.equal(e.error.code, -32602);
  assert.equal(e.status, 400);
});

test('valid params compute through the pipeline', async function() {
  assert.equal(await rpcCall('rpcTest.sum', { a: 19, b: 23 }), 42);
});

test('alias resolves to the canonical handler', async function() {
  // rpcTestLegacyConcat is a registered alias of rpcTest.concat
  const viaAlias = await rpcCall('rpcTestLegacyConcat', { first: 'a', second: 'b' });
  const viaCanonical = await rpcCall('rpcTest.concat', { first: 'a', second: 'b' });
  assert.equal(viaAlias, viaCanonical);
  assert.equal(viaAlias, 'ab');
});

test('in-process invoke() path (server→server orchestration)', async function() {
  const result = await rpcCall('rpcTest.invokeProxy');
  assert.equal(result.viaInvoke, 42);
});

test('unknown method → -32601, HTTP 404', async function() {
  const e = await rpcEnvelope('rpcTest.doesNotExist');
  assert.equal(e.error.code, -32601);
  assert.equal(e.status, 404);
});
