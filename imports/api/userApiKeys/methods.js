// imports/api/userApiKeys/methods.js
//
// Per-user saved API keys (LLM providers + arbitrary third-party services).
// Stored on the user document under the top-level `apiKeys` field:
//   apiKeys: [{ _id, provider, label, value, createdAt, updatedAt }]
//
// SECURITY: `apiKeys` is intentionally NOT in the accounts.currentUser
// publication field list (imports/accounts/server/startup.js) — values never
// reach the client via subscription. `list` returns masked values only; the
// full value is handed out solely through `reveal`/`getForProvider`, both
// owner-scoped. Values are stored plaintext in Mongo (same posture as
// settings-file keys); at-rest encryption is a possible follow-up.

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('userApiKeys') : console);

// Known LLM providers get one slot each (upsert by provider); everything else
// is a 'custom' line item (label + value, any number of them).
export const KNOWN_API_PROVIDERS = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (ChatGPT)',
  google: 'Google (Gemini)',
  xai: 'xAI (Grok)'
};

function maskValue(value) {
  const str = String(value || '');
  if (str.length <= 8) { return '••••'; }
  return str.slice(0, 5) + '••••' + str.slice(-4);
}

// Same header-safety rule the pdf-parser enforces: single line, printable
// ASCII — anything else was a bad paste, not a key.
function assertKeyValue(value) {
  const cleaned = String(value || '').trim();
  if (!cleaned) {
    throw new Meteor.Error('invalid-key', 'API key value is empty');
  }
  if (cleaned.length > 4096 || !/^[\x21-\x7E]+$/.test(cleaned)) {
    throw new Meteor.Error('invalid-key',
      'API keys are a single line of printable characters with no spaces — check what was pasted');
  }
  return cleaned;
}

async function getUserApiKeys(userId) {
  const user = await Meteor.users.findOneAsync({ _id: userId }, { fields: { apiKeys: 1 } });
  return get(user, 'apiKeys', []);
}

Meteor.ServerMethods.define('userApiKeys.list', {
  description: 'List the current user\'s saved API keys with masked values.',
  requireAuth: true,
  schemaObject: { type: 'object', properties: {} }
}, async function(params, context) {
  const keys = await getUserApiKeys(context.userId);
  return keys.map(function(entry) {
    return {
      keyId: entry._id,
      provider: entry.provider,
      label: entry.label,
      maskedValue: maskValue(entry.value),
      updatedAt: entry.updatedAt
    };
  });
});

Meteor.ServerMethods.define('userApiKeys.save', {
  description: 'Save (upsert) an API key on the current user\'s profile. Known providers keep one slot each; custom entries upsert by keyId.',
  requireAuth: true,
  schemaObject: {
    type: 'object',
    properties: {
      provider: { type: 'string' },
      label: { type: 'string' },
      value: { type: 'string' },
      keyId: { type: 'string' }
    },
    required: ['provider', 'value']
  }
}, async function(params, context) {
  const provider = get(params, 'provider', 'custom');
  const value = assertKeyValue(get(params, 'value'));
  const isKnown = Boolean(KNOWN_API_PROVIDERS[provider]);
  const label = String(get(params, 'label') || KNOWN_API_PROVIDERS[provider] || 'API key').trim().slice(0, 120);
  const now = new Date();

  const keys = await getUserApiKeys(context.userId);
  const requestedKeyId = get(params, 'keyId');
  const existing = keys.find(function(entry) {
    if (requestedKeyId) { return entry._id === requestedKeyId; }
    return isKnown && entry.provider === provider;
  });

  let keyId;
  if (existing) {
    keyId = existing._id;
    await Meteor.users.updateAsync(
      { _id: context.userId, 'apiKeys._id': keyId },
      { $set: { 'apiKeys.$.value': value, 'apiKeys.$.label': label, 'apiKeys.$.provider': provider, 'apiKeys.$.updatedAt': now } }
    );
  } else {
    keyId = Random.id();
    await Meteor.users.updateAsync(
      { _id: context.userId },
      { $push: { apiKeys: { _id: keyId, provider: provider, label: label, value: value, createdAt: now, updatedAt: now } } }
    );
  }

  log.info && log.info('API key saved', { userId: context.userId, provider: provider, keyId: keyId, updated: Boolean(existing) });
  return { keyId: keyId, updated: Boolean(existing) };
});

Meteor.ServerMethods.define('userApiKeys.remove', {
  description: 'Remove a saved API key from the current user\'s profile.',
  requireAuth: true,
  schemaObject: {
    type: 'object',
    properties: { keyId: { type: 'string' } },
    required: ['keyId']
  }
}, async function(params, context) {
  const keyId = get(params, 'keyId');
  const removed = await Meteor.users.updateAsync(
    { _id: context.userId },
    { $pull: { apiKeys: { _id: keyId } } }
  );
  log.info && log.info('API key removed', { userId: context.userId, keyId: keyId });
  return { removed: removed > 0 };
});

Meteor.ServerMethods.define('userApiKeys.reveal', {
  description: 'Return the full value of one of the current user\'s saved API keys.',
  requireAuth: true,
  schemaObject: {
    type: 'object',
    properties: { keyId: { type: 'string' } },
    required: ['keyId']
  }
}, async function(params, context) {
  const keyId = get(params, 'keyId');
  const keys = await getUserApiKeys(context.userId);
  const entry = keys.find(function(candidate) { return candidate._id === keyId; });
  if (!entry) {
    throw new Meteor.Error('not-found', 'No saved API key with that id');
  }
  return { keyId: entry._id, provider: entry.provider, label: entry.label, value: entry.value };
});

Meteor.ServerMethods.define('userApiKeys.getForProvider', {
  description: 'Return the current user\'s saved key for a known provider (e.g. anthropic, openai, xai), or null.',
  requireAuth: true,
  schemaObject: {
    type: 'object',
    properties: { provider: { type: 'string' } },
    required: ['provider']
  }
}, async function(params, context) {
  const provider = get(params, 'provider');
  const keys = await getUserApiKeys(context.userId);
  const entry = keys.find(function(candidate) { return candidate.provider === provider; });
  if (!entry) { return null; }
  return { keyId: entry._id, provider: entry.provider, label: entry.label, value: entry.value };
});
