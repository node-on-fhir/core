// tests/rpc/methods/medications.test.mjs
//
// Exemplar deep method suite (Stage 1, docs/RPC-TESTING.md): a full CRUD
// round-trip for the medications catalog over POST /api/rpc — real pipeline,
// real Mongo, no browser. Self-cleaning: everything it creates it removes,
// so it is safe against a development database.
//
// This is the PATTERN file: copy it for other crown-jewel methods.

import test from 'node:test';
import assert from 'node:assert/strict';
import { rpcCall, rpcEnvelope, mintToken } from '../lib/rpcClient.mjs';

const marker = 'rpc-test-' + process.pid + '-' + Math.floor(Math.random() * 1e9);

test('medications: full CRUD round-trip over /api/rpc', async function(t) {
  const token = await mintToken();
  let medicationId = null;

  await t.test('create returns the new _id', async function() {
    medicationId = await rpcCall('medications.create', {
      resourceType: 'Medication',
      status: 'active',
      code: {
        coding: [{ system: 'http://snomed.info/sct', code: '387458008', display: 'Aspirin' }],
        text: 'Aspirin (' + marker + ')'
      },
      manufacturer: { display: 'RPC Test Pharma ' + marker }
    }, { token });
    assert.equal(typeof medicationId, 'string');
    assert.ok(medicationId.length > 0);
  });

  await t.test('get returns the created record', async function() {
    const medication = await rpcCall('medications.get', { medicationId }, { token });
    assert.equal(medication._id, medicationId);
    assert.equal(medication.code.text, 'Aspirin (' + marker + ')');
    assert.equal(medication.status, 'active');
  });

  await t.test('update persists changes', async function() {
    await rpcCall('medications.update', {
      medicationId,
      medicationData: { status: 'inactive' }
    }, { token });
    const medication = await rpcCall('medications.get', { medicationId }, { token });
    assert.equal(medication.status, 'inactive');
  });

  await t.test('remove deletes; get then reports not-found (mapped, not internal)', async function() {
    await rpcCall('medications.remove', { medicationId }, { token });
    const envelope = await rpcEnvelope('medications.get', { medicationId }, { token });
    assert.ok(envelope.error, 'get after remove must error');
    assert.equal(envelope.error.data && envelope.error.data.error, 'not-found');
    assert.notEqual(envelope.error.code, -32603);
  });
});
