// imports/api/share/methods.js
//
// Server choke point for sharing a FHIR resource to an external endpoint
// (the SEND action of ShareModalDialog). EVERY share flows through `share.send`,
// which is the single place to enforce export-time policy.
//
// The guard pipeline below is the architectural seam for the checks we know are
// coming — schema validation, license, provenance, encryption, and BILLING
// (per-action or subscription payment gate, e.g. via Stripe). This pass ships
// them as ordered, pass-through stubs with clear extension points; wiring real
// implementations means filling in a stub, not rerouting the flow.

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { fetch } from 'meteor/fetch';
import { get } from 'lodash';

// ─── Export-time guard pipeline ──────────────────────────────────────────────
// Each guard receives and returns a context object `{ endpointUrl, resource,
// resourceType, payload, userId }`. A guard may mutate the context (e.g.
// encryptPayload swapping in ciphertext) or throw a Meteor.Error to BLOCK the
// share (e.g. checkBilling when payment is required and absent). Run in order.

async function validateSchema(ctx) {
  // TODO: validate ctx.resource against its FHIR R4 profile before egress.
  console.log('[share.send] validateSchema (stub) —', ctx.resourceType, get(ctx.resource, '_id'));
  return ctx;
}

async function checkLicense(ctx) {
  // TODO: confirm this deployment is licensed to share this resource type / to
  // this destination. Throw Meteor.Error('license-required', ...) to block.
  console.log('[share.send] checkLicense (stub) — allowed');
  return ctx;
}

async function checkProvenance(ctx) {
  // TODO: stamp/verify Provenance for the outbound resource (who shared what,
  // when, to where) for the audit trail.
  console.log('[share.send] checkProvenance (stub) — noop');
  return ctx;
}

async function encryptPayload(ctx) {
  // TODO: optionally encrypt ctx.payload for the destination (e.g. when the
  // endpoint advertises a public key). For now the payload passes through.
  console.log('[share.send] encryptPayload (stub) — plaintext');
  return ctx;
}

async function checkBilling(ctx) {
  // TODO: gated sharing. Verify the user has an active subscription OR collect a
  // per-action payment (Stripe) before the resource leaves the building. Throw
  // Meteor.Error('payment-required', ...) to block until paid.
  //
  //   const allowed = await assertPaidOrSubscribed(ctx.userId);
  //   if (!allowed) throw new Meteor.Error('payment-required', 'Sharing requires payment.');
  console.log('[share.send] checkBilling (stub) — allowed (no charge)');
  return ctx;
}

const GUARD_PIPELINE = [
  validateSchema,
  checkLicense,
  checkProvenance,
  encryptPayload,
  checkBilling
];

// ─── Resource lookup ─────────────────────────────────────────────────────────
// Collections are registered by pluralized resource name (Compositions,
// Observations, …). Resolve from the host registry; _id lookup only (no `||`).

function resolveCollection(resourceType) {
  const registry = Meteor.Collections || global.Collections || {};
  return get(registry, resourceType + 's', null);
}

// ─── Minimal FHIR Bundle wrapper ─────────────────────────────────────────────
// Extension point: a richer transaction Bundle (Composition + referenced
// resources) can replace this. For now we relay the single resource.

function wrapInBundle(resource) {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [{ resource: resource }]
  };
}

Meteor.methods({
  'share.send': async function(params) {
    check(params, {
      endpointUrl:  String,
      resourceId:   String,
      resourceType: Match.Optional(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to share.');
    }

    const endpointUrl  = (params.endpointUrl || '').trim();
    const resourceId   = params.resourceId;
    const resourceType = params.resourceType || 'Composition';

    if (!endpointUrl) {
      throw new Meteor.Error('no-endpoint', 'A destination endpoint URL is required.');
    }

    const collection = resolveCollection(resourceType);
    if (!collection) {
      throw new Meteor.Error('collection-not-found', 'Unknown resource type: ' + resourceType);
    }

    const resource = await collection.findOneAsync({ _id: resourceId });
    if (!resource) {
      throw new Meteor.Error('not-found', resourceType + ' ' + resourceId + ' not found.');
    }

    console.log('[share.send] Sharing', resourceType, resourceId, '→', endpointUrl);

    // Build context and run the export-time guard pipeline. A guard throws to block.
    let ctx = {
      endpointUrl:  endpointUrl,
      resource:     resource,
      resourceType: resourceType,
      payload:      wrapInBundle(resource),
      userId:       this.userId
    };
    for (const guard of GUARD_PIPELINE) {
      ctx = await guard(ctx);
    }

    // POST the (possibly transformed) payload to the endpoint root.
    const url = endpointUrl.replace(/\/$/, '');
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json'
        },
        body: JSON.stringify(ctx.payload)
      });
    } catch (error) {
      console.error('[share.send] Network error:', error);
      throw new Meteor.Error('relay-failed', 'Could not reach endpoint: ' + get(error, 'message', String(error)));
    }

    if (!response.ok) {
      const text = await response.text().catch(function() { return ''; });
      console.error('[share.send] Endpoint rejected:', response.status, text);
      throw new Meteor.Error('relay-rejected',
        'Endpoint responded ' + response.status + (text ? (': ' + text.slice(0, 300)) : '.'));
    }

    const location = (response.headers && typeof response.headers.get === 'function')
      ? response.headers.get('location')
      : null;

    console.log('[share.send] Success', response.status, location || '');
    return { ok: true, status: response.status, location: location };
  }
});

console.log('[share] Server methods registered');
