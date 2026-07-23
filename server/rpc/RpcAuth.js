// server/rpc/RpcAuth.js
// Dual-acceptance auth middleware for /api/rpc (Task 3 — HAND-WRITTEN,
// security-critical; migration loops never touch this file).
//
// Accepts `Authorization: Bearer <token>` where the token is EITHER an OAuth
// access token (external clients — resolved by FhirAuth.parseUserAuthorization,
// which also handles Basic auth and backend-services JWT) OR a Meteor login
// token (browser clients). Both yield the same context shape.
//
// Precedence (per the plan): OAuth/FhirAuth is tried FIRST; the Meteor
// login-token interpretation is the fallback. FhirAuth's own internal
// login-token fallback does NOT check token expiry, so whenever the resolved
// auth did not come through an OAuth/system path this middleware re-validates
// the token against `services.resume.loginTokens` INCLUDING the `when` +
// Accounts token-lifetime expiry. Every failure path returns a null user
// rather than throwing — the pipeline's requireAuth produces the 401/403, so
// authorization decisions stay in one place. This middleware never mints,
// refreshes, or extends tokens.

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { get } from 'lodash';
import { parseUserAuthorization } from '/server/lib/FhirAuth.js';

const log = (Meteor.Logger ? Meteor.Logger.for('RpcAuth') : console);

// 90 days — accounts-base's own DEFAULT_LOGIN_EXPIRATION fallback.
const DEFAULT_TOKEN_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;

function tokenLifetimeMs() {
  try {
    if (typeof Accounts._getTokenLifetimeMs === 'function') {
      return Accounts._getTokenLifetimeMs();
    }
  } catch (lifetimeError) {
    log.warn('Accounts._getTokenLifetimeMs unavailable, using default', { message: lifetimeError.message });
  }
  return DEFAULT_TOKEN_LIFETIME_MS;
}

function scopesFromScopeString(scope) {
  if (typeof scope !== 'string' || !scope.trim()) {
    return [];
  }
  return scope.trim().split(/\s+/);
}

function isOauthShaped(authContext) {
  return Boolean(
    get(authContext, 'isOAuthToken') ||
    get(authContext, 'isOAuthClient') ||
    get(authContext, 'isSystemAccount') ||
    get(authContext, 'role') === 'system' ||
    get(authContext, 'role') === 'SYSTEM'
  );
}

// Validate a bearer value as a Meteor login token: hashed lookup against
// services.resume.loginTokens, honoring the stamped `when` + token lifetime.
// Returns { userId, user } or null. Never throws.
async function resolveLoginToken(bearerToken) {
  try {
    const hashedToken = Accounts._hashLoginToken(bearerToken);
    const user = await Meteor.users.findOneAsync(
      { 'services.resume.loginTokens.hashedToken': hashedToken },
      { fields: { roles: 1, patientId: 1, practitionerId: 1, 'services.resume.loginTokens': 1 } }
    );
    if (!user) {
      return null;
    }
    const tokenRecord = get(user, 'services.resume.loginTokens', []).find(function(record) {
      return record.hashedToken === hashedToken;
    });
    if (!tokenRecord || !tokenRecord.when) {
      log.debug('Login token record missing or unstamped — rejecting');
      return null;
    }
    const ageMs = Date.now() - new Date(tokenRecord.when).getTime();
    if (ageMs > tokenLifetimeMs()) {
      log.debug('Login token expired', { ageMs });
      return null;
    }
    return { userId: user._id, user: user };
  } catch (tokenError) {
    log.warn('Login token resolution failed (treated as unauthenticated)', { message: tokenError.message });
    return null;
  }
}

/**
 * Resolve the auth context for an /api/rpc request.
 * @param {http.IncomingMessage} req
 * @param {Object} [deps] - test seam: { parseAuth } overrides the FhirAuth call
 * @returns {Promise<{userId: string|null, scopes: string[], via: 'oauth'|'loginToken'|null, role?: string, patientId?: string}>}
 */
async function resolveRpcAuth(req, deps) {
  const unauthenticated = { userId: null, scopes: [], via: null };
  const authHeader = get(req, 'headers.authorization', '');
  const hasSessionHeader = Boolean(get(req, 'headers.session'));

  // (1) Nothing to work with
  if (!authHeader && !hasSessionHeader) {
    return unauthenticated;
  }

  const parseAuth = get(deps, 'parseAuth', parseUserAuthorization);
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  // (2) FhirAuth first — OAuth tokens, client-credentials Basic auth,
  //     backend-services JWT (and its own non-expiry-checked fallbacks).
  let fhirAuthContext = false;
  try {
    fhirAuthContext = await parseAuth(req);
  } catch (parseError) {
    log.warn('parseUserAuthorization threw (treated as unauthenticated)', { message: parseError.message });
    fhirAuthContext = false;
  }

  if (fhirAuthContext && fhirAuthContext.userId && isOauthShaped(fhirAuthContext)) {
    return {
      userId: fhirAuthContext.userId,
      scopes: scopesFromScopeString(get(fhirAuthContext, 'scope', '')),
      via: 'oauth',
      role: get(fhirAuthContext, 'role'),
      patientId: get(fhirAuthContext, 'patientId', '')
    };
  }

  // (3) Meteor login-token fallback (also re-validates anything FhirAuth
  //     resolved via ITS login-token path, adding the expiry check).
  const candidateToken = bearerToken || get(req, 'headers.session') || null;
  if (candidateToken) {
    const resolved = await resolveLoginToken(candidateToken);
    if (resolved) {
      const FhirAuthModule = await import('/server/lib/FhirAuth.js');
      const role = FhirAuthModule.getAuthorizedRole(get(resolved.user, 'roles', []));
      return {
        userId: resolved.userId,
        scopes: [],
        via: 'loginToken',
        role: role,
        patientId: get(resolved.user, 'patientId', '')
      };
    }
  }

  return unauthenticated;
}

export { resolveRpcAuth };
