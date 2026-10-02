// tests/rpc/methods/importAttachmentPreview.test.mjs
//
// Regression guard for the client/server param-shape mismatch in
// importAttachment.preview (2026-08-31). The method briefly declared
// positionalParams:['params'] and read params.params.clientPatientId, while all
// four client callers send a FLAT { clientPatientId, payloadPatients }. Result:
// the server ALWAYS saw clientPatientId=null and collapsed every preview to
// stale-link/unlinked — even with a patient actively selected (the Facebook
// import "Profile link broken" false alarm).
//
// The unit tests (tests/unit/imports/lib/resolveImportPatient.test.mjs) call the
// pure core directly and so could never catch a method-layer unwrapping bug.
// This suite hits the METHOD over RPC with the exact flat shape the clients use.

import test from 'node:test';
import assert from 'node:assert/strict';
import { rpcCall } from '../lib/rpcClient.mjs';

const marker = 'rpc-attach-' + process.pid + '-' + Math.floor(Math.random() * 1e9);

test('importAttachment.preview honors a FLAT clientPatientId (param-shape regression)', async function(t) {
  // A clinician token: selection is unrestricted, so a selected id resolves to
  // source 'selected' (echoed, existence not required) regardless of the
  // caller's own profile link. No Patient setup needed — this isolates the
  // param-unwrapping behavior, which is the thing that regressed.
  const mint = await rpcCall('rpcTest.mintLoginToken', {
    username: 'attach-preview-' + marker,
    roles: ['healthcare provider']
  });
  const token = mint.token;
  const patientId = 'attach-pt-' + marker;

  await t.test('FLAT { clientPatientId } → source "selected", echoes the id', async function() {
    const result = await rpcCall('importAttachment.preview', {
      clientPatientId: patientId,
      payloadPatients: []
    }, { token });
    assert.equal(result.source, 'selected',
      'a selected id must resolve to "selected" — stale-link/unlinked here means the flat clientPatientId was dropped (the 2026-08-31 params.params bug)');
    assert.equal(result.patientId, patientId);
  });

  await t.test('no selection → NOT "selected" (proves the flat field actually drives the branch)', async function() {
    const result = await rpcCall('importAttachment.preview', {
      clientPatientId: null,
      payloadPatients: []
    }, { token });
    assert.notEqual(result.source, 'selected');
  });
});
