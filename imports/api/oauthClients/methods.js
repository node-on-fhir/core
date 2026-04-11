// imports/api/oauthClients/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

import { OAuthClients } from '/imports/collections/OAuthClients';

Meteor.methods({
  'oauthClients.validate': async function(oauthClientId) {
    check(oauthClientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to validate OAuth clients.');
    }

    const existing = await OAuthClients.findOneAsync({ _id: oauthClientId });
    if (!existing) {
      throw new Meteor.Error('not-found', 'OAuth client not found.');
    }

    console.log('[oauthClients.validate] Validating client:', oauthClientId);
    const result = await OAuthClients.updateAsync(
      { _id: oauthClientId },
      { $set: { verified: true } }
    );
    return result;
  },

  'oauthClients.update': async function(oauthClientId, updateData) {
    check(oauthClientId, String);
    check(updateData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update OAuth clients.');
    }

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

    console.log('[oauthClients.update] Updating client:', oauthClientId, 'fields:', Object.keys(updates));
    const result = await OAuthClients.updateAsync(
      { _id: oauthClientId },
      { $set: updates }
    );
    return result;
  }
});
