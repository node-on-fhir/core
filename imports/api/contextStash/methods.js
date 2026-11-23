// imports/api/contextStash/methods.js
//
// ContextSidebar stash methods. Every method requires auth and scopes every
// selector by the caller's userId — one user's stash is never reachable by
// another. Patient-linked stashes emit log.phi (ONC audit posture).
// Expiry contract (spec decision): CLEAR PATIENT and logout clear EVERYTHING,
// pins included — pinning only protects against cap eviction.
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { ContextStash } from '/imports/lib/schemas/SimpleSchemas/ContextStash';

const log = Meteor.Logger ? Meteor.Logger.for('context-sidebar') : console;

const STASH_CAP = 50;
const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1 MB per item

function payloadBytes(payload) {
  if (typeof payload === 'string') return payload.length;
  try {
    return JSON.stringify(payload).length;
  } catch (error) {
    return MAX_PAYLOAD_BYTES + 1; // unserializable → rejected by the size gate
  }
}

async function evictToCap(userId) {
  const count = await ContextStash.find({ userId: userId }).countAsync();
  if (count < STASH_CAP) return;
  // Evict oldest UNPINNED rows until under cap; a fully pinned stash is full.
  const overBy = count - STASH_CAP + 1;
  const victims = await ContextStash.find(
    { userId: userId, pinned: { $ne: true } },
    { sort: { createdAt: 1 }, limit: overBy, fields: { _id: 1 } }
  ).fetchAsync();
  if (victims.length < overBy) {
    throw new Meteor.Error('stash-full',
      'Stash is at ' + STASH_CAP + ' items and everything is pinned — unpin or remove something first.');
  }
  for (const victim of victims) {
    await ContextStash.removeAsync({ _id: victim._id, userId: userId });
  }
}

async function insertItem(item, context) {
  const kind = get(item, 'kind');
  if (kind !== 'fhir' && kind !== 'text') {
    throw new Meteor.Error('invalid-item', "kind must be 'fhir' or 'text'");
  }
  const payload = get(item, 'payload');
  const bytes = payloadBytes(payload);
  if (!payload || bytes > MAX_PAYLOAD_BYTES) {
    throw new Meteor.Error('payload-too-large', 'Stash items are capped at 1 MB');
  }

  await evictToCap(context.userId);

  const doc = {
    _id: Random.id(),
    userId: context.userId,
    patientId: get(item, 'patientId', null) || null,
    kind: kind,
    resourceType: get(item, 'resourceType', null) || null,
    label: String(get(item, 'label', '') || '').substring(0, 200),
    summary: String(get(item, 'summary', '') || '').substring(0, 300),
    payload: payload,
    bytes: bytes,
    source: {
      route: String(get(item, 'source.route', '') || '').substring(0, 200),
      sessionKey: get(item, 'source.sessionKey', null) || null
    },
    pinned: false,
    createdAt: new Date()
  };

  await ContextStash.insertAsync(doc);

  if (doc.patientId) {
    log.phi('stash patient-linked resource', null, {
      action: 'stash',
      resourceType: doc.resourceType,
      patientId: doc.patientId,
      userId: context.userId
    });
  } else {
    log.info('stashed item', { resourceType: doc.resourceType, kind: doc.kind, bytes: doc.bytes });
  }

  return doc._id;
}

Meteor.ServerMethods.define('contextStash.add', {
  description: 'Add one item to the caller\'s ContextSidebar stash',
  requireAuth: true
}, async function(params, context) {
  const stashId = await insertItem(get(params, 'item', {}), context);
  return { _id: stashId };
});

Meteor.ServerMethods.define('contextStash.addMany', {
  description: 'Add several items to the caller\'s stash (client pre-wraps asBundle)',
  requireAuth: true
}, async function(params, context) {
  const items = get(params, 'items', []);
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    throw new Meteor.Error('invalid-items', 'items must be a non-empty array (max 20)');
  }
  const ids = [];
  for (const item of items) {
    ids.push(await insertItem(item, context));
  }
  return { _ids: ids };
});

Meteor.ServerMethods.define('contextStash.remove', {
  description: 'Remove one of the caller\'s stash items',
  requireAuth: true
}, async function(params, context) {
  const removed = await ContextStash.removeAsync({
    _id: String(get(params, 'stashId', '')),
    userId: context.userId
  });
  return { removed: removed };
});

Meteor.ServerMethods.define('contextStash.pin', {
  description: 'Pin or unpin one of the caller\'s stash items',
  requireAuth: true
}, async function(params, context) {
  const updated = await ContextStash.updateAsync(
    { _id: String(get(params, 'stashId', '')), userId: context.userId },
    { $set: { pinned: !!get(params, 'pinned', true) } }
  );
  return { updated: updated };
});

Meteor.ServerMethods.define('contextStash.rename', {
  description: 'Rename one of the caller\'s stash items',
  requireAuth: true
}, async function(params, context) {
  const label = String(get(params, 'label', '') || '').substring(0, 200);
  if (!label) {
    throw new Meteor.Error('invalid-label', 'label is required');
  }
  const updated = await ContextStash.updateAsync(
    { _id: String(get(params, 'stashId', '')), userId: context.userId },
    { $set: { label: label } }
  );
  return { updated: updated };
});

Meteor.ServerMethods.define('contextStash.clear', {
  description: 'Clear the caller\'s ENTIRE stash (pins included — the expiry contract)',
  requireAuth: true
}, async function(params, context) {
  const removed = await ContextStash.removeAsync({ userId: context.userId });
  log.info('stash cleared', { userId: context.userId, removed: removed });
  return { removed: removed };
});

Meteor.ServerMethods.define('contextStash.clearUnpinned', {
  description: 'Clear the caller\'s unpinned stash items (the panel\'s Clear unpinned button)',
  requireAuth: true
}, async function(params, context) {
  const removed = await ContextStash.removeAsync({ userId: context.userId, pinned: { $ne: true } });
  return { removed: removed };
});

// Server-internal: full clear for a user — used by the Accounts.onLogout hook
// (no method context there). Not an rpc surface.
export async function clearStashForUser(userId) {
  if (!userId) return 0;
  const removed = await ContextStash.removeAsync({ userId: userId });
  if (removed > 0) {
    log.info('stash cleared on logout', { userId: userId, removed: removed });
  }
  return removed;
}
