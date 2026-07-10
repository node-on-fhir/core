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
import { Random } from 'meteor/random';
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
// Fallback payload when no richer bundle builder is available for the type.

function wrapInBundle(resource) {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [{ resource: resource }]
  };
}

// Repair a narrative div for XHTML validity: bare ampersands in stored
// narratives (e.g. a section titled "Diagnoses & Problems") make external
// servers reject the whole payload (HAPI-1755). Escapes `&` that don't
// already start an entity; leaves markup untouched.
function repairNarrativeDiv(div) {
  return div.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

// Recursively repair every { text: { div } } narrative in a resource tree.
function repairNarrativesInPlace(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(repairNarrativesInPlace);
    return;
  }
  Object.keys(node).forEach(function(key) {
    const value = node[key];
    if (key === 'div' && typeof value === 'string') {
      node[key] = repairNarrativeDiv(value);
    } else if (value && typeof value === 'object') {
      repairNarrativesInPlace(value);
    }
  });
}

// Scrub every entry resource before egress: drop Mongo bookkeeping ("_id"
// parses as "extensions of the id primitive" in FHIR JSON — external servers
// reject the payload with HAPI-0450; the FHIR id lives in `id`) and repair
// narrative XHTML.
function stripMongoFields(bundle) {
  const clean = JSON.parse(JSON.stringify(bundle || {}));
  (Array.isArray(clean.entry) ? clean.entry : []).forEach(function(entry) {
    const resource = entry && entry.resource;
    if (!resource) return;
    if (!resource.id && resource._id) {
      resource.id = resource._id;
    }
    delete resource._id;
    delete resource._document;
    repairNarrativesInPlace(resource);
  });
  return clean;
}

// Build the outbound payload. Compositions get the full TOC document bundle
// when pacio-core is loaded (feature-detected via the method registry — no
// static dependency on the package); everything else ships as a minimal
// collection Bundle.
async function buildPayload(resource, resourceType, userId) {
  if (resourceType === 'Composition') {
    const generate = get(Meteor, ['server', 'method_handlers', 'pacio.tocBundle.generate'], null);
    if (typeof generate === 'function') {
      try {
        const bundle = await generate.call({ userId: userId }, resource._id);
        if (get(bundle, 'resourceType') === 'Bundle') {
          console.log('[share.send] Using pacio.tocBundle.generate document bundle (' + get(bundle, 'entry.length', 0) + ' entries)');
          return bundle;
        }
      } catch (error) {
        console.warn('[share.send] pacio.tocBundle.generate failed, falling back to minimal bundle:', get(error, 'message', String(error)));
      }
    }
  }
  return wrapInBundle(resource);
}

// ─── Secondary resources (mode-aware) ────────────────────────────────────────
// After the bundle lands on the destination, mode 'document' registers a
// DocumentReference there (same TOC-DocumentReference shape as
// pacio.tocDocumentReference.create); mode 'message' registers a discharge
// notification Communication there and keeps a local copy for the
// secure-messaging inbox / audit trail.

const TOC_DOC_REF_PROFILE = 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-DocumentReference';

function buildDestinationDocumentReference(resource, bundleLocation, userId) {
  const compositionRef = 'Composition/' + get(resource, 'id', get(resource, '_id'));
  return {
    resourceType: 'DocumentReference',
    meta: { profile: [TOC_DOC_REF_PROFILE] },
    status: 'current',
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: '18761-7',
        display: 'Transfer Summary Note'
      }]
    },
    category: [{
      coding: [{
        system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
        code: 'clinical-note',
        display: 'Clinical Note'
      }]
    }],
    subject: get(resource, 'subject', {}),
    date: new Date().toISOString(),
    author: [{ reference: 'Practitioner/' + userId }],
    description: get(resource, 'title', 'Transition of Care document'),
    content: [{
      attachment: {
        contentType: 'application/fhir+json',
        url: bundleLocation || compositionRef,
        creation: new Date().toISOString()
      }
    }],
    context: { related: [{ reference: compositionRef }] }
  };
}

function buildDischargeCommunication(resource, bundleLocation, userId) {
  const compositionRef = 'Composition/' + get(resource, 'id', get(resource, '_id'));
  return {
    resourceType: 'Communication',
    status: 'completed',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/communication-category',
        code: 'notification',
        display: 'Notification'
      }],
      text: 'Discharge / transition of care notification'
    }],
    subject: get(resource, 'subject', {}),
    sent: new Date().toISOString(),
    sender: { reference: 'Practitioner/' + userId },
    payload: [{
      contentReference: {
        reference: bundleLocation || compositionRef,
        display: get(resource, 'title', 'Transition of Care document')
      }
    }]
  };
}

// Strip references to resources the destination may not hold (local Patient /
// Practitioner ids), keeping human-readable display text. The shared Bundle
// carries the actual resources; these links are best-effort context.
function detachLocalReferences(resource) {
  const clean = JSON.parse(JSON.stringify(resource || {}));
  if (clean.subject) {
    delete clean.subject.reference;
    if (Object.keys(clean.subject).length === 0) delete clean.subject;
  }
  delete clean.author;
  delete clean.sender;
  delete clean.context;   // context.related → local Composition; the attachment url already points at the stored Bundle
  return clean;
}

async function postToEndpoint(baseUrl, path, body) {
  const url = baseUrl.replace(/\/$/, '') + (path ? '/' + path : '');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json'
    },
    body: JSON.stringify(body)
  });
  const location = (response.headers && typeof response.headers.get === 'function')
    ? response.headers.get('location')
    : null;
  return { response: response, location: location };
}

Meteor.methods({
  'share.send': async function(params) {
    check(params, {
      endpointUrl:  String,
      resourceId:   String,
      resourceType: Match.Optional(String),
      mode:         Match.Optional(Match.OneOf('document', 'message'))
    });

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to share.');
    }

    const endpointUrl  = (params.endpointUrl || '').trim();
    const resourceId   = params.resourceId;
    const resourceType = params.resourceType || 'Composition';
    const mode         = params.mode || 'document';

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

    console.log('[share.send] Sharing', resourceType, resourceId, '→', endpointUrl, '(mode: ' + mode + ')');

    // Build context and run the export-time guard pipeline. A guard throws to block.
    let ctx = {
      endpointUrl:  endpointUrl,
      resource:     resource,
      resourceType: resourceType,
      mode:         mode,
      payload:      stripMongoFields(await buildPayload(resource, resourceType, this.userId)),
      userId:       this.userId
    };
    for (const guard of GUARD_PIPELINE) {
      ctx = await guard(ctx);
    }

    // POST the (possibly transformed) payload as a stored Bundle resource
    // ({endpoint}/Bundle) — the receiving system retrieves it by id later
    // (the MITRE Pseudo-EHR pattern; e.g. GET .../Bundle/502).
    let bundlePost;
    try {
      bundlePost = await postToEndpoint(endpointUrl, 'Bundle', ctx.payload);
    } catch (error) {
      console.error('[share.send] Network error:', error);
      throw new Meteor.Error('relay-failed', 'Could not reach endpoint: ' + get(error, 'message', String(error)));
    }

    if (!bundlePost.response.ok) {
      const text = await bundlePost.response.text().catch(function() { return ''; });
      console.error('[share.send] Endpoint rejected:', bundlePost.response.status, text);
      throw new Meteor.Error('relay-rejected',
        'Endpoint responded ' + bundlePost.response.status + (text ? (': ' + text.slice(0, 300)) : '.'));
    }

    console.log('[share.send] Bundle accepted', bundlePost.response.status, bundlePost.location || '');

    // Secondary resource on the destination: DocumentReference (document mode)
    // or discharge-notification Communication (message mode). The bundle POST
    // already succeeded — a secondary failure is reported, not thrown.
    const secondaryType = (mode === 'message') ? 'Communication' : 'DocumentReference';
    const secondaryResource = (mode === 'message')
      ? buildDischargeCommunication(resource, bundlePost.location, this.userId)
      : buildDestinationDocumentReference(resource, bundlePost.location, this.userId);

    let secondary = { resourceType: secondaryType };
    try {
      let secondaryPost = await postToEndpoint(endpointUrl, secondaryType, secondaryResource);

      // Destinations with referential integrity reject references to resources
      // they don't hold (our local Patient/Practitioner ids — HAPI-1096). The
      // shared Bundle itself carries the patient, so retry once with the local
      // references detached (display text kept).
      if (!secondaryPost.response.ok && secondaryPost.response.status >= 400 && secondaryPost.response.status < 500) {
        const firstText = await secondaryPost.response.text().catch(function() { return ''; });
        console.warn('[share.send] Secondary ' + secondaryType + ' rejected (' + secondaryPost.response.status + '), retrying with local references detached:', firstText.slice(0, 200));
        const detached = detachLocalReferences(secondaryResource);
        secondaryPost = await postToEndpoint(endpointUrl, secondaryType, detached);
        secondary.detachedReferences = true;
      }

      secondary.status = secondaryPost.response.status;
      secondary.location = secondaryPost.location;
      if (!secondaryPost.response.ok) {
        const text = await secondaryPost.response.text().catch(function() { return ''; });
        secondary.error = 'Endpoint responded ' + secondaryPost.response.status + (text ? (': ' + text.slice(0, 300)) : '.');
        console.warn('[share.send] Secondary ' + secondaryType + ' rejected:', secondary.error);
      } else {
        console.log('[share.send] Secondary ' + secondaryType + ' accepted', secondaryPost.response.status, secondaryPost.location || '');
      }
    } catch (error) {
      secondary.error = get(error, 'message', String(error));
      console.warn('[share.send] Secondary ' + secondaryType + ' failed:', secondary.error);
    }

    // Message mode also keeps a local Communication so the share shows up in
    // the secure-messaging inbox / audit trail.
    if (mode === 'message') {
      const Communications = get(Meteor.Collections || global.Collections || {}, 'Communications', null);
      if (Communications && typeof Communications.insertAsync === 'function') {
        const localCommunication = Object.assign({}, secondaryResource, {
          _id: Random.id(),
          meta: {
            tag: [{ system: 'http://hl7.org/fhir/us/pacio-toc', code: 'toc-share', display: 'Transition of Care share' }],
            lastUpdated: new Date().toISOString()
          },
          note: [{ text: 'Shared to ' + endpointUrl }]
        });
        localCommunication.id = localCommunication._id;
        try {
          await Communications.insertAsync(localCommunication);
          console.log('[share.send] Local Communication recorded:', localCommunication._id);
        } catch (error) {
          console.warn('[share.send] Local Communication insert failed:', get(error, 'message', String(error)));
        }
      } else {
        console.warn('[share.send] Communications collection not available — no local copy recorded');
      }
    }

    return { ok: true, status: bundlePost.response.status, location: bundlePost.location, mode: mode, secondary: secondary };
  }
});

console.log('[share] Server methods registered');
