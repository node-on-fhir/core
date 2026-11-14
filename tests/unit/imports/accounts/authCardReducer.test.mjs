// tests/unit/imports/accounts/authCardReducer.test.mjs
//
// Unit tests for the one-door AuthCard state machine (design handoff
// 2026-11-01 + repo 2FA extension). Pure reducer — no Meteor, no React.
//
//   node --test tests/unit/imports/accounts/authCardReducer.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  authCardReducer,
  initialAuthCardState,
  isValidEmail,
  isValidUsername
} from '../../../../imports/accounts/client/authCardReducer.js';

function emailState(overrides) {
  return Object.assign(initialAuthCardState({ mode: 'signin' }), overrides);
}

test('initial states', async function(t) {
  await t.test('/signin starts at email step, unlocked, idle', function() {
    const s = initialAuthCardState({ mode: 'signin' });
    assert.equal(s.step, 'email');
    assert.equal(s.email, '');
    assert.equal(s.emailLocked, false);
    assert.equal(s.busy, false);
    assert.equal(s.error, null);
  });

  await t.test('/signup starts at create step with editable email', function() {
    const s = initialAuthCardState({ mode: 'signup' });
    assert.equal(s.step, 'create');
    assert.equal(s.emailLocked, false);
  });

  await t.test('returning-user navigation state opens password with chip filled', function() {
    const s = initialAuthCardState({ mode: 'signin', email: 'abbie@chronicle.health', step: 'password' });
    assert.equal(s.step, 'password');
    assert.equal(s.email, 'abbie@chronicle.health');
    assert.equal(s.emailLocked, true);
  });
});

test('email step', async function(t) {
  await t.test('SUBMIT_EMAIL with valid email → checking, busy', function() {
    const s = authCardReducer(emailState({ email: 'House@GMail.com ' }), { type: 'SUBMIT_EMAIL' });
    assert.equal(s.step, 'checking');
    assert.equal(s.busy, true);
    assert.equal(s.email, 'house@gmail.com', 'email lowercased + trimmed at submit');
  });

  await t.test('SUBMIT_EMAIL with invalid email → stays, field error', function() {
    const s = authCardReducer(emailState({ email: 'not-an-email' }), { type: 'SUBMIT_EMAIL' });
    assert.equal(s.step, 'email');
    assert.equal(s.busy, false);
    assert.equal(s.error.field, 'email');
  });

  await t.test('EMAIL_EXISTS → password, email locked, not busy', function() {
    const s = authCardReducer(emailState({ step: 'checking', email: 'a@b.co', busy: true }), { type: 'EMAIL_EXISTS' });
    assert.equal(s.step, 'password');
    assert.equal(s.emailLocked, true);
    assert.equal(s.busy, false);
  });

  await t.test('EMAIL_UNKNOWN → create with suggested username prefilled', function() {
    const s = authCardReducer(
      emailState({ step: 'checking', email: 'house@gmail.com', busy: true }),
      { type: 'EMAIL_UNKNOWN', suggestedUsername: 'house' }
    );
    assert.equal(s.step, 'create');
    assert.equal(s.username, 'house');
    assert.equal(s.emailLocked, true);
    assert.equal(s.error, null, 'happy path never shows red');
  });

  await t.test('EMAIL_UNKNOWN without suggestion leaves typed username alone', function() {
    const s = authCardReducer(
      emailState({ step: 'checking', email: 'ab@x.co', username: 'mytyped', busy: true }),
      { type: 'EMAIL_UNKNOWN' }
    );
    assert.equal(s.username, 'mytyped');
  });

  await t.test('CHECK_FAILED → back to email with toast flag', function() {
    const s = authCardReducer(emailState({ step: 'checking', busy: true }), { type: 'CHECK_FAILED' });
    assert.equal(s.step, 'email');
    assert.equal(s.busy, false);
    assert.equal(s.toast, "Couldn't reach the server");
  });
});

test('password step', async function(t) {
  const pw = function(overrides) {
    return emailState(Object.assign({ step: 'password', email: 'a@b.co', emailLocked: true }, overrides));
  };

  await t.test('SUBMIT_PASSWORD with passphrase → signingIn', function() {
    const s = authCardReducer(pw({ passphrase: 'x' }), { type: 'SUBMIT_PASSWORD' });
    assert.equal(s.step, 'signingIn');
    assert.equal(s.busy, true);
  });

  await t.test('SUBMIT_PASSWORD empty → stays with field error', function() {
    const s = authCardReducer(pw({ passphrase: '' }), { type: 'SUBMIT_PASSWORD' });
    assert.equal(s.step, 'password');
    assert.equal(s.error.field, 'passphrase');
  });

  await t.test('LOGIN_OK → signedIn', function() {
    const s = authCardReducer(pw({ step: 'signingIn', busy: true }), { type: 'LOGIN_OK' });
    assert.equal(s.step, 'signedIn');
  });

  await t.test('LOGIN_FAILED → password, neutral error, passphrase CLEARED', function() {
    const s = authCardReducer(
      pw({ step: 'signingIn', passphrase: 'wrong horse', busy: true }),
      { type: 'LOGIN_FAILED' }
    );
    assert.equal(s.step, 'password');
    assert.equal(s.passphrase, '', 'cleared on failure');
    assert.equal(s.error.field, 'passphrase');
    assert.match(s.error.message, /didn't match/);
  });

  await t.test('LOGIN_2FA_REQUIRED → twofactor step (repo extension)', function() {
    const s = authCardReducer(pw({ step: 'signingIn', busy: true }), { type: 'LOGIN_2FA_REQUIRED' });
    assert.equal(s.step, 'twofactor');
    assert.equal(s.busy, false);
  });

  await t.test('CHANGE_EMAIL from password keeps the email value', function() {
    const s = authCardReducer(pw({}), { type: 'CHANGE_EMAIL' });
    assert.equal(s.step, 'email');
    assert.equal(s.email, 'a@b.co');
    assert.equal(s.emailLocked, false);
  });
});

test('create step', async function(t) {
  const cr = function(overrides) {
    return emailState(Object.assign({
      step: 'create', email: 'house@gmail.com', emailLocked: true,
      username: 'house', passphrase: 'correct horse battery staple'
    }, overrides));
  };

  await t.test('SUBMIT_CREATE valid → creating', function() {
    const s = authCardReducer(cr({}), { type: 'SUBMIT_CREATE' });
    assert.equal(s.step, 'creating');
    assert.equal(s.busy, true);
  });

  await t.test('SUBMIT_CREATE short username → field error', function() {
    const s = authCardReducer(cr({ username: 'ab' }), { type: 'SUBMIT_CREATE' });
    assert.equal(s.step, 'create');
    assert.equal(s.error.field, 'username');
  });

  await t.test('SUBMIT_CREATE bad username chars → field error', function() {
    const s = authCardReducer(cr({ username: 'has spaces!' }), { type: 'SUBMIT_CREATE' });
    assert.equal(s.error.field, 'username');
  });

  await t.test('SUBMIT_CREATE passphrase under 12 → field error', function() {
    const s = authCardReducer(cr({ passphrase: 'elevenchars' }), { type: 'SUBMIT_CREATE' });
    assert.equal(s.step, 'create');
    assert.equal(s.error.field, 'passphrase');
  });

  await t.test('CREATE_OK → welcome', function() {
    const s = authCardReducer(cr({ step: 'creating', busy: true }), { type: 'CREATE_OK' });
    assert.equal(s.step, 'welcome');
    assert.equal(s.busy, false);
  });

  await t.test('CREATE_FAILED username taken → create + field error', function() {
    const s = authCardReducer(
      cr({ step: 'creating', busy: true }),
      { type: 'CREATE_FAILED', field: 'username', message: 'That username is taken — try another' }
    );
    assert.equal(s.step, 'create');
    assert.equal(s.error.field, 'username');
  });

  await t.test('CREATE_FAILED email raced into existence → auto-switch to password', function() {
    const s = authCardReducer(
      cr({ step: 'creating', busy: true }),
      { type: 'CREATE_FAILED', field: 'email', emailExists: true, message: 'Looks like you do have an account' }
    );
    assert.equal(s.step, 'password', 'email-exists race auto-switches to sign-in');
  });

  await t.test('CHANGE_EMAIL from create keeps email value', function() {
    const s = authCardReducer(cr({}), { type: 'CHANGE_EMAIL' });
    assert.equal(s.step, 'email');
    assert.equal(s.email, 'house@gmail.com');
  });
});

test('twofactor step (repo extension)', async function(t) {
  const tf = function(overrides) {
    return emailState(Object.assign({
      step: 'twofactor', email: 'a@b.co', emailLocked: true, passphrase: 'correct horse battery'
    }, overrides));
  };

  await t.test('SUBMIT_2FA with code → signingIn', function() {
    const s = authCardReducer(tf({ twoFactorCode: '123456' }), { type: 'SUBMIT_2FA' });
    assert.equal(s.step, 'signingIn');
    assert.equal(s.busy, true);
  });

  await t.test('SUBMIT_2FA empty code → stays with field error', function() {
    const s = authCardReducer(tf({ twoFactorCode: '' }), { type: 'SUBMIT_2FA' });
    assert.equal(s.step, 'twofactor');
    assert.equal(s.error.field, 'twoFactorCode');
  });

  await t.test('LOGIN_FAILED from 2FA returns to twofactor with error, code cleared', function() {
    const s = authCardReducer(tf({ step: 'signingIn', twoFactorCode: '000000', busy: true, from2fa: true }), { type: 'LOGIN_FAILED', invalidCode: true });
    assert.equal(s.step, 'twofactor');
    assert.equal(s.twoFactorCode, '');
  });
});

test('field edits and welcome', async function(t) {
  await t.test('SET_FIELD updates a field and clears its error', function() {
    const s0 = emailState({ error: { field: 'email', message: 'bad' } });
    const s = authCardReducer(s0, { type: 'SET_FIELD', field: 'email', value: 'x@y.co' });
    assert.equal(s.email, 'x@y.co');
    assert.equal(s.error, null);
  });

  await t.test('OPEN_WORKSTATION from welcome → done', function() {
    const s = authCardReducer(emailState({ step: 'welcome' }), { type: 'OPEN_WORKSTATION' });
    assert.equal(s.step, 'done');
  });

  await t.test('unknown action returns state unchanged', function() {
    const s0 = emailState({});
    const s = authCardReducer(s0, { type: 'NO_SUCH_ACTION' });
    assert.deepEqual(s, s0);
  });
});

test('validators', async function(t) {
  await t.test('isValidEmail', function() {
    assert.equal(isValidEmail('a@b.co'), true);
    assert.equal(isValidEmail('you@hospital.org'), true);
    assert.equal(isValidEmail('nope'), false);
    assert.equal(isValidEmail('a@'), false);
    assert.equal(isValidEmail(''), false);
  });

  await t.test('isValidUsername: 3-30 chars of [a-z0-9_.-]', function() {
    assert.equal(isValidUsername('house'), true);
    assert.equal(isValidUsername('h.o-u_se9'), true);
    assert.equal(isValidUsername('ab'), false);
    assert.equal(isValidUsername('a'.repeat(31)), false);
    assert.equal(isValidUsername('Has Caps'), false);
  });
});
