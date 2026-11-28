// npmPackages/provider-directory/tests/directoryDialog.test.mjs
// Run from the repo root: node --test npmPackages/provider-directory/tests/directoryDialog.test.mjs

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getDirectoryDialog,
  subscribeDirectoryDialog,
  openDirectoryDialog,
  closeDirectoryDialog,
  toggleDirectoryDialog,
  claimDirectoryDialogHost,
  releaseDirectoryDialogHost,
  isDirectoryDialogHostOwner,
  getDirectoryDialogHostOwner,
  resetDirectoryDialog
} from '../client/directoryDialog.mjs';

beforeEach(function() {
  resetDirectoryDialog();
});

test('starts closed with defaults', function() {
  assert.deepEqual({ ...getDirectoryDialog() }, {
    open: false, component: null, title: '', maxWidth: 'sm', json: null, returnKey: null
  });
});

test('open sets every field; omitted fields fall back to defaults', function() {
  openDirectoryDialog({ component: 'CareTeamDetail', title: 'New Team', maxWidth: 'md', json: { a: 1 } });
  const snapshot = getDirectoryDialog();
  assert.equal(snapshot.open, true);
  assert.equal(snapshot.component, 'CareTeamDetail');
  assert.equal(snapshot.title, 'New Team');
  assert.equal(snapshot.maxWidth, 'md');
  assert.deepEqual(snapshot.json, { a: 1 });
  assert.equal(snapshot.returnKey, null);

  openDirectoryDialog({ component: 'TaskDetail' });
  assert.equal(getDirectoryDialog().title, '');
  assert.equal(getDirectoryDialog().maxWidth, 'sm');
  assert.equal(getDirectoryDialog().json, null);

  openDirectoryDialog();
  assert.equal(getDirectoryDialog().open, true);
  assert.equal(getDirectoryDialog().component, null);
});

test('a second open does not inherit the previous returnKey', function() {
  openDirectoryDialog({ component: 'SearchValueSetsDialog', returnKey: 'MainSearch.state' });
  assert.equal(getDirectoryDialog().returnKey, 'MainSearch.state');
  openDirectoryDialog({ component: 'SearchStatesDialog' });
  assert.equal(getDirectoryDialog().returnKey, null);
});

test('close flips open only and keeps component/title/returnKey', function() {
  openDirectoryDialog({ component: 'SearchCodeSystemDialog', title: 'T', maxWidth: 'md', returnKey: 'MainSearch.insurancePlan' });
  closeDirectoryDialog();
  const snapshot = getDirectoryDialog();
  assert.equal(snapshot.open, false);
  assert.equal(snapshot.component, 'SearchCodeSystemDialog');
  assert.equal(snapshot.title, 'T');
  assert.equal(snapshot.returnKey, 'MainSearch.insurancePlan');
});

test('toggle opens when closed and closes when open', function() {
  toggleDirectoryDialog({ component: 'OrganizationDetail', title: 'New Organization' });
  assert.equal(getDirectoryDialog().open, true);
  assert.equal(getDirectoryDialog().component, 'OrganizationDetail');
  toggleDirectoryDialog({ component: 'OrganizationDetail', title: 'New Organization' });
  assert.equal(getDirectoryDialog().open, false);
});

test('snapshots are frozen, replaced on change, and stable between changes', function() {
  const initial = getDirectoryDialog();
  assert.equal(getDirectoryDialog(), initial);

  openDirectoryDialog({ component: 'A' });
  const opened = getDirectoryDialog();
  assert.notEqual(opened, initial);
  assert.equal(initial.open, false);
  assert.equal(getDirectoryDialog(), opened);
  assert.ok(Object.isFrozen(opened));
  assert.throws(function() { opened.open = false; }, TypeError);

  closeDirectoryDialog();
  const closed = getDirectoryDialog();
  assert.notEqual(closed, opened);
  assert.equal(opened.open, true);

  // closing an already-closed dialog is a no-op (same snapshot, no notification)
  let calls = 0;
  subscribeDirectoryDialog(function() { calls++; });
  closeDirectoryDialog();
  assert.equal(getDirectoryDialog(), closed);
  assert.equal(calls, 0);
});

test('subscribe notifies on open/close; unsubscribe stops notifications', function() {
  let callsA = 0;
  let callsB = 0;
  const unsubscribeA = subscribeDirectoryDialog(function() { callsA++; });
  subscribeDirectoryDialog(function() { callsB++; });

  openDirectoryDialog({ component: 'A' });
  closeDirectoryDialog();
  assert.equal(callsA, 2);
  assert.equal(callsB, 2);

  unsubscribeA();
  openDirectoryDialog({ component: 'A' });
  assert.equal(callsA, 2);
  assert.equal(callsB, 3);
});

test('host ownership: first claimant owns, second does not', function() {
  assert.equal(getDirectoryDialogHostOwner(), null);
  assert.equal(isDirectoryDialogHostOwner('a'), false);
  assert.equal(claimDirectoryDialogHost('a'), true);
  assert.equal(claimDirectoryDialogHost('b'), false);
  assert.equal(isDirectoryDialogHostOwner('a'), true);
  assert.equal(isDirectoryDialogHostOwner('b'), false);
  // re-claiming is idempotent and does not reorder
  assert.equal(claimDirectoryDialogHost('b'), false);
  assert.equal(claimDirectoryDialogHost('a'), true);
  assert.equal(getDirectoryDialogHostOwner(), 'a');
});

test('host ownership: releasing the owner hands over to the next claimant', function() {
  claimDirectoryDialogHost('a');
  claimDirectoryDialogHost('b');
  claimDirectoryDialogHost('c');
  releaseDirectoryDialogHost('b'); // non-owner release changes nothing for the owner
  assert.equal(getDirectoryDialogHostOwner(), 'a');
  releaseDirectoryDialogHost('a');
  assert.equal(getDirectoryDialogHostOwner(), 'c');
  releaseDirectoryDialogHost('c');
  assert.equal(getDirectoryDialogHostOwner(), null);
  releaseDirectoryDialogHost('never-claimed'); // harmless
  assert.equal(claimDirectoryDialogHost('d'), true);
});

test('host ownership changes notify subscribers', function() {
  let calls = 0;
  subscribeDirectoryDialog(function() { calls++; });
  claimDirectoryDialogHost('a');
  claimDirectoryDialogHost('a'); // idempotent: no second notification
  claimDirectoryDialogHost('b');
  releaseDirectoryDialogHost('a');
  assert.equal(calls, 3);
});

test('an open dialog survives owner handoff but closes when the last host releases', function() {
  claimDirectoryDialogHost('a');
  claimDirectoryDialogHost('b');
  openDirectoryDialog({ component: 'A', returnKey: 'MainSearch.state' });
  releaseDirectoryDialogHost('a');
  assert.equal(getDirectoryDialog().open, true);
  releaseDirectoryDialogHost('b');
  assert.equal(getDirectoryDialog().open, false);
  // a host mounting later does not resurrect it
  claimDirectoryDialogHost('c');
  assert.equal(getDirectoryDialog().open, false);
});
