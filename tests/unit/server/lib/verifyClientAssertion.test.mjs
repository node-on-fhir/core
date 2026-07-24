// server/lib/verifyClientAssertion.test.mjs
//
// CR-1 reproduction + regression test (security audit 2026-07-01).
//
// The hole: the /oauth/token client_credentials + jwt-bearer path decoded the
// client_assertion and issued a system access_token WITHOUT verifying the JWT
// signature (OAuthEndpoints.js had a literal "TODO: Verify JWT signature"). Any
// party could forge an assertion for a registered backend-services client and
// receive a system/*.* bearer token.
//
// These tests drive server/lib/verifyClientAssertion.js — the extracted,
// pure verification helper that BOTH /oauth/token call sites now use before
// issuing a token: the client_credentials + jwt-bearer path (the original CR-1
// hole) and the SMART-asymmetric path (unified onto the same helper 2026-07-24,
// which also gained the alg-whitelist hardening these tests assert).
// Run: node --test tests/unit/server/lib/verifyClientAssertion.test.mjs
//
// Placement: tests/unit/ mirrors the source tree (tests/unit/server/lib/ ↔
// server/lib/). See .claude/rules/testing/test-organization.md.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createPublicKey, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

import { verifyClientAssertionSignature } from '../../../../server/lib/verifyClientAssertion.js';

// --- helpers ---------------------------------------------------------------

// Make an RSA keypair and its public JWK (with a kid), as a registered client
// would publish in its JWKS.
function makeKeypair(kid) {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' });
  jwk.kid = kid;
  jwk.alg = 'RS256';
  jwk.use = 'sig';
  return { privateKey, publicJwk: jwk };
}

function signAssertion(privateKey, kid, claims = {}) {
  const iss = claims.iss || 'backend-client-123';
  return jwt.sign(
    { iss, sub: iss, aud: 'https://example.org/oauth/token', jti: randomUUID(), ...claims },
    privateKey,
    { algorithm: 'RS256', keyid: kid, expiresIn: '5m' }
  );
}

// --- the vulnerability: wrong-key signatures must be rejected ---------------

test('rejects an assertion signed by a key that is NOT the client\'s registered key', async () => {
  const attacker = makeKeypair('kid-attacker');
  const registered = makeKeypair('kid-registered');

  // Attacker forges an assertion for a client whose JWKS holds a DIFFERENT key.
  const forged = signAssertion(attacker.privateKey, 'kid-attacker');
  const client = { _id: 'backend-client-123', jwks: { keys: [registered.publicJwk] } };

  const result = await verifyClientAssertionSignature({ client, clientAssertion: forged });
  assert.equal(result.verified, false, 'forged assertion must NOT verify');
});

test('rejects when the kid in the assertion is not present in the client JWKS', async () => {
  const registered = makeKeypair('kid-registered');
  const other = makeKeypair('kid-missing');
  const assertion = signAssertion(other.privateKey, 'kid-missing');
  const client = { _id: 'c1', jwks: { keys: [registered.publicJwk] } };

  const result = await verifyClientAssertionSignature({ client, clientAssertion: assertion });
  assert.equal(result.verified, false);
});

test('rejects a client that has no key material (no jwks, no jwks_uri)', async () => {
  const kp = makeKeypair('kid-1');
  const assertion = signAssertion(kp.privateKey, 'kid-1');
  const client = { _id: 'c1' };

  const result = await verifyClientAssertionSignature({ client, clientAssertion: assertion });
  assert.equal(result.verified, false);
  assert.match(result.reason, /no.*key|jwks/i);
});

test('rejects the alg=none downgrade even for a registered client', async () => {
  const registered = makeKeypair('kid-registered');
  // Unsigned token with alg:none.
  const noneToken = jwt.sign({ iss: 'c1', sub: 'c1' }, '', { algorithm: 'none' });
  const client = { _id: 'c1', jwks: { keys: [registered.publicJwk] } };

  const result = await verifyClientAssertionSignature({ client, clientAssertion: noneToken });
  assert.equal(result.verified, false, 'alg=none must never verify');
});

// --- the legitimate path still works ---------------------------------------

test('accepts an assertion correctly signed by the client\'s registered inline JWKS key', async () => {
  const kp = makeKeypair('kid-good');
  const assertion = signAssertion(kp.privateKey, 'kid-good');
  const client = { _id: 'backend-client-123', jwks: { keys: [kp.publicJwk] } };

  const result = await verifyClientAssertionSignature({ client, clientAssertion: assertion });
  assert.equal(result.verified, true, result.reason);
  assert.equal(result.payload.iss, 'backend-client-123');
});

test('resolves JWKS from jwks_uri via the injected fetch and verifies', async () => {
  const kp = makeKeypair('kid-remote');
  const assertion = signAssertion(kp.privateKey, 'kid-remote');
  const client = { _id: 'c1', jwks_uri: 'https://client.example/jwks.json' };

  // Injected fetch stub — keeps the unit test offline.
  const fetchImpl = async function(url) {
    assert.equal(url, 'https://client.example/jwks.json');
    return { ok: true, json: async () => ({ keys: [kp.publicJwk] }) };
  };

  const result = await verifyClientAssertionSignature({ client, clientAssertion: assertion, fetchImpl });
  assert.equal(result.verified, true, result.reason);
});

test('rejects an expired assertion even with a valid signature', async () => {
  const kp = makeKeypair('kid-exp');
  // Signed correctly but already expired.
  const expired = jwt.sign(
    { iss: 'c1', sub: 'c1', exp: Math.floor(Date.now() / 1000) - 60 },
    kp.privateKey,
    { algorithm: 'RS256', keyid: 'kid-exp' }
  );
  const client = { _id: 'c1', jwks: { keys: [kp.publicJwk] } };

  const result = await verifyClientAssertionSignature({ client, clientAssertion: expired });
  assert.equal(result.verified, false);
  assert.match(result.reason, /expired|exp/i);
});
