// imports/accounts/server/lookupIdentifierMethods.js
//
// auth.lookupIdentifier — the one-door AuthCard's email-first existence check
// (design handoff 2026-11-01). Unauthenticated by design: it runs BEFORE
// login, from the AuthCard's `checking` state. The app already disclosed
// account existence pre-redesign ("No account found with this
// username/email"), so this changes nothing about the threat model — it just
// moves the check earlier. Returns ONLY what the card needs to render the
// next step; never the user id.

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { get } from 'lodash';

// Username suggestion from an email local-part: lowercase, strip anything
// outside [a-z0-9_.-], cap at 30 chars (create-step guard is 3-30). Under 3
// usable chars → no suggestion (user types their own).
function suggestUsername(identifier) {
  const base = (identifier.split('@')[0] || '').replace(/[^a-z0-9_.-]/g, '').slice(0, 30);
  return base.length >= 3 ? base : undefined;
}

ServerMethods.define('auth.lookupIdentifier', {
  description: 'Pre-auth account-existence check for the one-door AuthCard: email or username in, { exists, hasPasskey, suggestedUsername } out',
  // Public by design — the card calls this before any session exists. The
  // DDPRateLimiter rule below (plus the pipeline rate limit) is the guard.
  requireAuth: false,
  rateLimit: { calls: 10, intervalMs: 10000 },
  schemaObject: {
    type: 'object',
    properties: {
      identifier: { type: 'string' }
    },
    required: ['identifier']
  }
}, async function(params, context) {
  check(get(params, 'identifier'), String);

  const identifier = params.identifier.trim().toLowerCase();
  if (!identifier || identifier.length > 254) {
    return { exists: false };
  }

  const user = identifier.includes('@')
    ? await Accounts.findUserByEmail(identifier)
    : await Accounts.findUserByUsername(identifier);

  if (user) {
    return {
      exists: true,
      // Only what the card needs to pick the passkey vs passphrase path;
      // never the user id or any profile fields.
      hasPasskey: !!get(user, 'services.webauthn')
    };
  }

  return {
    exists: false,
    suggestedUsername: identifier.includes('@') ? suggestUsername(identifier) : undefined
  };
});

// Belt-and-suspenders for the DDP alias (ServerMethods registers one for
// Meteor.call compatibility); the HTTP /api/rpc path is limited by the
// pipeline rateLimit option above.
DDPRateLimiter.addRule(
  { type: 'method', name: 'auth.lookupIdentifier', connectionId: function() { return true; } },
  10,
  10000
);
