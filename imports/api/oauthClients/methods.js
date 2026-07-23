// imports/api/oauthClients/methods.js
//
// AUTH POSTURE NOTE (rpc migration): these are admin CRUD helpers over the
// OAuthClients registry (mark-verified, edit whitelisted client fields). They
// do NOT mint or validate tokens and are NOT part of the public OAuth dynamic
// client-registration flow (which lives in the OAuth server routes). Both
// methods were guarded by `if (!this.userId) throw` pre-migration, so the
// requireAuth default (true) preserves the exact auth posture.

import { Meteor } from 'meteor/meteor';

import { OAuthClients } from '/imports/collections/OAuthClients';

Meteor.ServerMethods.define('oauthClients.validate', {
  description: 'Mark a registered OAuth client record as verified',
  phi: false,
  positionalParams: ['oauthClientId'],
  schemaObject: {
    type: 'object',
    properties: { oauthClientId: { type: 'string' } },
    required: ['oauthClientId']
  }
}, async function(params, context){
  const existing = await OAuthClients.findOneAsync({ _id: params.oauthClientId });
  if (!existing) {
    throw new Meteor.Error('not-found', 'OAuth client not found.');
  }

  context.log.info('Validating client', { _id: params.oauthClientId });
  const result = await OAuthClients.updateAsync(
    { _id: params.oauthClientId },
    { $set: { verified: true } }
  );
  return result;
});

Meteor.ServerMethods.define('oauthClients.update', {
  description: 'Update the whitelisted editable fields of a registered OAuth client',
  phi: false,
  positionalParams: ['oauthClientId', 'updateData'],
  schemaObject: {
    type: 'object',
    properties: {
      oauthClientId: { type: 'string' },
      updateData: { type: 'object' }
    },
    required: ['oauthClientId', 'updateData']
  }
}, async function(params, context){
  const oauthClientId = params.oauthClientId;
  const updateData = params.updateData;

  const existing = await OAuthClients.findOneAsync({ _id: oauthClientId });
  if (!existing) {
    throw new Meteor.Error('not-found', 'OAuth client not found.');
  }

  // Only allow updating specific editable fields (client_id and client_secret are NOT editable)
  const allowedFields = [
    'client_name', 'scope', 'redirect_uris', 'grant_types', 'response_types',
    'token_endpoint_auth_method', 'pkce_enabled', 'pkce_method',
    'auth_request_method', 'launch_uri', 'jwks_uri', 'tos_uri'
  ];

  const updates = {};
  allowedFields.forEach(function(field) {
    if (updateData.hasOwnProperty(field)) {
      updates[field] = updateData[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new Meteor.Error('no-fields', 'No valid fields to update.');
  }

  context.log.info('Updating client', { _id: oauthClientId, fields: Object.keys(updates) });
  const result = await OAuthClients.updateAsync(
    { _id: oauthClientId },
    { $set: updates }
  );
  return result;
});
