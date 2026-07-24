// tests/rpc/methods/compositions.test.mjs
//
// Exemplar suite for compositions.insert — the method whose name collision
// zombie-booted the lunar sim (see rpc-alias-collision hardening in
// ServerMethodsCore). A standing regression test that core OWNS this name and
// the handler actually works end-to-end. Self-cleaning.

import test from 'node:test';
import assert from 'node:assert/strict';
import { rpcCall, rpcEnvelope, mintToken } from '../lib/rpcClient.mjs';

const marker = 'rpc-test-' + process.pid + '-' + Math.floor(Math.random() * 1e9);

test('compositions.insert resolves to CORE (generic insert, not the old IPS variant)', async function(t) {
  const token = await mintToken();
  let compositionId = null;

  await t.test('insert a minimal generic Composition', async function() {
    compositionId = await rpcCall('compositions.insert', {
      resourceType: 'Composition',
      status: 'preliminary',
      type: { text: 'RPC test note (' + marker + ')' },
      subject: { display: 'rpc-test subject' },
      title: 'RPC round-trip ' + marker
    }, { token });
    assert.equal(typeof compositionId, 'string');
    assert.ok(compositionId.length > 0);
  });

  await t.test('missing required field → mapped invalid-composition error, not -32603', async function() {
    const e = await rpcEnvelope('compositions.insert', {
      resourceType: 'Composition'
      // no type/status/subject
    }, { token });
    assert.ok(e.error, 'must reject');
    assert.notEqual(e.error.code, -32603);
    assert.equal(e.error.data && e.error.data.error, 'invalid-composition');
  });

  await t.test('cleanup: remove the test composition', async function() {
    const removed = await rpcCall('compositions.remove', { compositionId }, { token });
    assert.ok(removed >= 0);
  });
});
