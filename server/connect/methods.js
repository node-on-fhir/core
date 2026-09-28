// server/connect/methods.js
//
// Patient Records Connect — SMART standalone patient launch against an
// external EHR (Epic/Cerner/...), driven by the spider's conformance sub-doc
// on the selected Endpoint record.
//
//   connect.checkEnabled    — settings-gated probe for the UI (3-layer pattern)
//   connect.beginLaunch     — PKCE pair + state → vendor authorize URL
//   connect.completeLaunch  — state validation + server-side code exchange
//
// Token posture (campaign constraint): EPHEMERAL. Tokens live in the
// in-memory Meteor.EhrTokenVault only, are consumed by the record pull
// (pacio.fetchPatientEverything with a sessionToken), and expire/are deleted
// after use. No refresh tokens, no persistence.
//
// Campaign: fable/2026-07-01-patient-records-connect.md (Task 6, amended:
// discovery comes from the Endpoint record's conformance.smart.* rather than
// a separate discovery pass).

import crypto from 'crypto';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { fetch } from 'meteor/fetch';
import { get, set } from 'lodash';
import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints.js';
import { ConnectedSources } from '/imports/collections/ConnectedSources.js';
import { buildAuthorizeUrl, buildTokenExchangeBody } from '/imports/lib/SmartLaunch.js';

const log = (Meteor.Logger ? Meteor.Logger.for('Connect') : console);

const PENDING_LAUNCH_TTL_MS = 10 * 60 * 1000;   // authorize round-trip window
const LIVE_TOKEN_TTL_MS = 55 * 60 * 1000;       // just under the typical 1h access token

// state -> { endpointId, userId, codeVerifier, vendor, tokenEndpoint, fhirBaseUrl, clientId, createdAt }
const pendingLaunches = new Map();
// sessionToken -> { accessToken, patient, fhirBaseUrl, endpointId, vendor, userId, createdAt }
const liveTokens = new Map();

function sweepExpired() {
  const now = Date.now();
  for (const [state, pending] of pendingLaunches) {
    if (now - pending.createdAt > PENDING_LAUNCH_TTL_MS) {
      pendingLaunches.delete(state);
    }
  }
  for (const [token, handle] of liveTokens) {
    if (now - handle.createdAt > LIVE_TOKEN_TTL_MS) {
      liveTokens.delete(token);
    }
  }
}

// The vault other server modules (pacio-core's fetch method) read the bearer
// handle from — registered on the Meteor namespace so workflow packages don't
// need a cross-boundary import. Lazy consumers only; tokens never leave the
// server process.
Meteor.EhrTokenVault = {
  get: function(sessionToken) {
    sweepExpired();
    return liveTokens.get(sessionToken) || null;
  },
  delete: function(sessionToken) {
    return liveTokens.delete(sessionToken);
  },
  size: function() {
    sweepExpired();
    return liveTokens.size;
  }
};

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function smartConnectSettings() {
  return get(Meteor, 'settings.private.smartConnect', {});
}

function configuredVendors() {
  const vendors = get(smartConnectSettings(), 'vendors', {});
  return Object.keys(vendors).filter(function(vendor) {
    return !!get(vendors, [vendor, 'clientId']);
  });
}

// Vendor scope resolution: settings string, optionally intersected with the
// tenant's advertised scopes_supported (Cerner posture: explicit .rs list,
// wildcards not honored — over-asking fails the whole authorization).
export function resolveScopes(vendorConfig, scopesSupported) {
  const configured = (get(vendorConfig, 'scopes', '') ||
    'openid fhirUser launch/patient patient/*.read').trim();
  const supported = Array.isArray(scopesSupported) ? scopesSupported : [];
  if (!get(vendorConfig, 'intersectWithSupported', false) || !supported.length) {
    return configured;
  }
  const kept = configured.split(/\s+/).filter(function(scope) {
    // Keep protocol scopes unconditionally; resource scopes must be advertised.
    if (!scope.startsWith('patient/')) {
      return true;
    }
    return supported.includes(scope);
  });
  return kept.join(' ');
}

Meteor.ServerMethods.define('connect.checkEnabled', {
  description: 'Settings-gated probe: is Patient Records Connect enabled, and for which vendors?',
  requireAuth: false,
  positionalParams: [],
  schemaObject: { type: 'object', properties: {} }
}, async function(params, context){
  return {
    enabled: !!get(smartConnectSettings(), 'enabled', false),
    configuredVendors: configuredVendors(),
    redirectUri: get(smartConnectSettings(), 'redirectUri', '')
  };
});

// Endpoints the spider has graded ready for a standalone patient launch —
// the picker feed for /patient-fetch. Core method (no dependency on which
// hydration extension is loaded).
Meteor.ServerMethods.define('connect.listLaunchableEndpoints', {
  description: 'List probed Endpoints with conformance.patientLaunchable = true.',
  requireAuth: true,
  positionalParams: [],
  schemaObject: { type: 'object', properties: {} }
}, async function(params, context){
  const rows = await Endpoints.find(
    { 'conformance.patientLaunchable': true },
    { sort: { name: 1 }, limit: 200 }
  ).fetchAsync();
  return rows.map(function(row) {
    return {
      endpointId: row._id,
      name: get(row, 'name', ''),
      address: get(row, 'address', ''),
      vendor: get(row, 'conformance.vendor', 'unknown'),
      fhirVersion: get(row, 'conformance.fhirVersion', ''),
      healthTag: get(row, 'conformance.healthTag', '')
    };
  });
});

// Hand-seeded sandbox Endpoints only — feeds the /patient-fetch "Sandbox
// servers" card. Seed lineage is meta.source 'urn:honeycomb:seed:*' (lantern
// vendorEndpointMappers); bulk hydration stamps 'urn:honeycomb:hydration:*',
// so this selector can never return the bulk directory imports.
Meteor.ServerMethods.define('connect.listSandboxEndpoints', {
  description: 'List hand-seeded sandbox Endpoints (meta.source urn:honeycomb:seed:*).',
  requireAuth: true,
  positionalParams: [],
  schemaObject: { type: 'object', properties: {} }
}, async function(params, context){
  const rows = await Endpoints.find(
    { 'meta.source': { $regex: '^urn:honeycomb:seed:' } },
    { sort: { name: 1 }, limit: 20 }
  ).fetchAsync();
  return rows.map(function(row) {
    return {
      endpointId: row._id,
      name: get(row, 'name', ''),
      address: get(row, 'address', ''),
      vendor: get(row, 'conformance.vendor', ''),
      healthTag: get(row, 'conformance.healthTag', ''),
      patientLaunchable: !!get(row, 'conformance.patientLaunchable')
    };
  });
});

Meteor.ServerMethods.define('connect.beginLaunch', {
  description: 'Begin a SMART standalone patient launch against a probed Endpoint (PKCE S256).',
  requireAuth: true,
  positionalParams: ['endpointId'],
  schemaObject: {
    type: 'object',
    properties: { endpointId: { type: 'string' } },
    required: ['endpointId']
  }
}, async function(params, context){
  sweepExpired();

  const settings = smartConnectSettings();
  if (!get(settings, 'enabled', false)) {
    throw new Meteor.Error('feature-disabled',
      'Patient Records Connect is not enabled. Set Meteor.settings.private.smartConnect.enabled to true.');
  }
  const redirectUri = get(settings, 'redirectUri', '');
  if (!redirectUri) {
    throw new Meteor.Error('feature-disabled',
      'No redirect URI configured (Meteor.settings.private.smartConnect.redirectUri).');
  }

  // _id-only lookup (never id||_id).
  const endpoint = await Endpoints.findOneAsync({ _id: get(params, 'endpointId') });
  if (!endpoint) {
    throw new Meteor.Error('not-found', 'Endpoint not found');
  }

  const conformance = get(endpoint, 'conformance', {});
  const authorizationEndpoint = get(conformance, 'smart.authorizationEndpoint', '');
  const tokenEndpoint = get(conformance, 'smart.tokenEndpoint', '');
  if (!authorizationEndpoint || !tokenEndpoint) {
    throw new Meteor.Error('not-probed',
      'This endpoint has no SMART conformance data yet — run the conformance probe first.');
  }

  const vendor = get(conformance, 'vendor', 'unknown');
  const vendorConfig = get(settings, ['vendors', vendor], null);
  if (!vendorConfig || !get(vendorConfig, 'clientId')) {
    throw new Meteor.Error('feature-disabled',
      'No client_id configured for vendor "' + vendor +
      '" (Meteor.settings.private.smartConnect.vendors.' + vendor + '.clientId).');
  }

  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
  const state = Random.id(32);

  pendingLaunches.set(state, {
    endpointId: endpoint._id,
    userId: context.userId,
    codeVerifier: codeVerifier,
    vendor: vendor,
    tokenEndpoint: tokenEndpoint,
    fhirBaseUrl: get(endpoint, 'address', ''),
    clientId: get(vendorConfig, 'clientId'),
    createdAt: Date.now()
  });

  const scope = resolveScopes(vendorConfig, get(conformance, 'smart.scopesSupported', []));
  const authorizeUrl = buildAuthorizeUrl({
    authorizationEndpoint: authorizationEndpoint,
    clientId: get(vendorConfig, 'clientId'),
    redirectUri: redirectUri,
    scope: scope,
    state: state,
    codeChallenge: codeChallenge,
    aud: get(endpoint, 'address', '')
  });

  log.info('beginLaunch', { endpointId: endpoint._id, vendor: vendor });
  return { authorizeUrl: authorizeUrl };
});

Meteor.ServerMethods.define('connect.completeLaunch', {
  description: 'Validate launch state and exchange the authorization code server-side (token stays in memory).',
  requireAuth: true,
  positionalParams: ['code', 'state'],
  schemaObject: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      state: { type: 'string' }
    },
    required: ['code', 'state']
  }
}, async function(params, context){
  sweepExpired();

  const pending = pendingLaunches.get(get(params, 'state'));
  if (!pending) {
    throw new Meteor.Error('invalid-state', 'Unknown or expired launch state — start the connection again.');
  }
  pendingLaunches.delete(get(params, 'state'));

  if (pending.userId && pending.userId !== context.userId) {
    throw new Meteor.Error('not-authorized', 'Launch state belongs to a different session.');
  }

  const body = buildTokenExchangeBody({
    code: get(params, 'code'),
    redirectUri: get(smartConnectSettings(), 'redirectUri', ''),
    clientId: pending.clientId,
    codeVerifier: pending.codeVerifier
  });

  const response = await fetch(pending.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: body
  });

  const text = await response.text();
  if (!response.ok) {
    log.error('completeLaunch token exchange failed', { status: response.status });
    throw new Meteor.Error('token-exchange-failed',
      'Vendor token endpoint returned HTTP ' + response.status);
  }

  let token;
  try {
    token = JSON.parse(text);
  } catch (parseError) {
    throw new Meteor.Error('token-exchange-failed', 'Vendor token response was not JSON');
  }
  if (!token.access_token) {
    throw new Meteor.Error('token-exchange-failed', 'Vendor token response carried no access_token');
  }

  const sessionToken = Random.id(32);
  liveTokens.set(sessionToken, {
    accessToken: token.access_token,
    patient: get(token, 'patient', ''),
    fhirBaseUrl: pending.fhirBaseUrl,
    endpointId: pending.endpointId,
    vendor: pending.vendor,
    userId: context.userId,
    createdAt: Date.now()
  });

  // Provenance record — no tokens.
  await ConnectedSources.upsertAsync(
    { userId: context.userId, endpointId: pending.endpointId },
    {
      $set: {
        userId: context.userId,
        endpointId: pending.endpointId,
        vendor: pending.vendor,
        fhirBaseUrl: pending.fhirBaseUrl,
        patientFhirId: get(token, 'patient', ''),
        lastConnectedAt: new Date(),
        status: 'connected'
      }
    }
  );

  log.info('completeLaunch token acquired', {
    endpointId: pending.endpointId,
    vendor: pending.vendor,
    hasPatientContext: !!get(token, 'patient')
  });
  return {
    sessionToken: sessionToken,
    patient: get(token, 'patient', ''),
    fhirBaseUrl: pending.fhirBaseUrl,
    endpointId: pending.endpointId,
    vendor: pending.vendor
  };
});
