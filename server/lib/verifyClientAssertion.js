// server/lib/verifyClientAssertion.js
//
// CR-1 remediation (security audit 2026-07-01): verify the signature of a
// client_assertion JWT against the registered client's public key BEFORE the
// /oauth/token client_credentials + jwt-bearer flow issues a system token.
//
// Pure and dependency-light (jsonwebtoken + node:crypto, injectable fetch) so
// it unit-tests offline — see verifyClientAssertion.test.mjs. The endpoint
// (server/OAuthEndpoints.js) is the only production caller.
//
// Mirrors the already-correct SMART-asymmetric verification block further down
// OAuthEndpoints.js (resolve JWKS inline-or-jwks_uri → find key by kid →
// JWK→PEM → jwt.verify) but hardens the algorithm handling: only asymmetric
// signing algorithms are permitted, so a forged alg:none or an HS* algorithm-
// confusion attempt (HMAC-signing with the public key as the secret) can never
// verify.

import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';

// Asymmetric signature algorithms only. Deliberately excludes 'none' and the
// HS* family — a client_assertion is proof-of-possession of a PRIVATE key, so
// symmetric/none algorithms are never valid here and allowing them opens
// alg-confusion / downgrade attacks.
const ALLOWED_ALGS = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512'];

// Resolve a client's JWKS: inline `client.jwks` wins; otherwise fetch
// `client.jwks_uri`. Returns { keys: [...] } or null. fetchImpl is injectable
// for tests; production passes meteor/fetch.
async function resolveJwks(client, fetchImpl) {
  if (client && client.jwks && Array.isArray(client.jwks.keys)) {
    return client.jwks;
  }
  if (client && client.jwks_uri && typeof fetchImpl === 'function') {
    try {
      const response = await fetchImpl(client.jwks_uri);
      if (response && response.ok) {
        const body = await response.json();
        if (body && Array.isArray(body.keys)) {
          return body;
        }
      }
      return null;
    } catch (fetchError) {
      return null;
    }
  }
  return null;
}

// Verify a client_assertion JWT against the registered client's public key.
//
//   client         — the OAuthClients record (carries jwks or jwks_uri)
//   clientAssertion — the raw JWT string
//   fetchImpl      — optional fetch for jwks_uri resolution (meteor/fetch in prod)
//
// Returns { verified: boolean, reason?: string, payload?: object }. NEVER
// throws — the caller treats any non-verified result as invalid_client.
export async function verifyClientAssertionSignature({ client, clientAssertion, fetchImpl } = {}) {
  if (!clientAssertion) {
    return { verified: false, reason: 'no client_assertion provided' };
  }

  let decoded;
  try {
    decoded = jwt.decode(clientAssertion, { complete: true });
  } catch (decodeError) {
    return { verified: false, reason: 'client_assertion could not be decoded' };
  }
  if (!decoded || !decoded.header) {
    return { verified: false, reason: 'client_assertion could not be decoded' };
  }

  const alg = decoded.header.alg;
  if (!alg || !ALLOWED_ALGS.includes(alg)) {
    // Covers alg:none and the HS* algorithm-confusion class.
    return { verified: false, reason: `disallowed or missing alg: ${alg || '(none)'}` };
  }

  const jwks = await resolveJwks(client, fetchImpl);
  if (!jwks || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
    return { verified: false, reason: 'client has no jwks / jwks_uri key material' };
  }

  // Select the key: by kid when the header names one, else the sole key.
  const kid = decoded.header.kid;
  let jwk;
  if (kid) {
    jwk = jwks.keys.find(function(k) { return k.kid === kid; });
    if (!jwk) {
      return { verified: false, reason: `no key in client JWKS matches kid ${kid}` };
    }
  } else if (jwks.keys.length === 1) {
    jwk = jwks.keys[0];
  } else {
    return { verified: false, reason: 'client_assertion header has no kid and client publishes multiple keys' };
  }

  let pem;
  try {
    pem = createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
  } catch (keyError) {
    return { verified: false, reason: 'client public key could not be parsed' };
  }

  try {
    // Pin the algorithm to the (already whitelisted) header alg; jwt.verify
    // enforces exp when present.
    const payload = jwt.verify(clientAssertion, pem, { algorithms: [alg] });
    return { verified: true, payload };
  } catch (verifyError) {
    return { verified: false, reason: verifyError && verifyError.message ? verifyError.message : 'signature verification failed' };
  }
}

export default { verifyClientAssertionSignature };
