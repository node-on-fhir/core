
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { fetch } from 'meteor/fetch';

import { fetchCertificate } from './OAuthEndpoints';

// Imported directly (not via the Meteor.ServerMethods global) because this
// module is loaded from server/main.js BEFORE server/rpc/rpcSetup.js runs.
import ServerMethods from '/imports/lib/ServerMethods.js';

// requireAuth note: all three methods historically had NO auth guards.
// getAsset serves arbitrary bundled asset text and geocodeAddress spends the
// private Google Maps API quota, so requireAuth now applies (the default) —
// behavior change from the pre-migration guard-less state.

ServerMethods.define('assets.getText', {
  description: 'Read a bundled private asset file and return its text content',
  aliases: ['getAsset'],
  positionalParams: ['path'],
  schemaObject: {
    type: 'object',
    properties: { path: { type: 'string' } },
    required: ['path']
  }
}, async function(params, context) {
  let file = await Assets.getTextAsync(params.path);
  return file;
});

ServerMethods.define('certificates.fetch', {
  description: 'Fetch and cache an X.509 certificate from a remote URL for OAuth validation',
  aliases: ['fetchCertificate'],
  positionalParams: ['url'],
  schemaObject: {
    type: 'object',
    properties: { url: { type: 'string' } },
    required: ['url']
  }
}, async function(params, context) {
  fetchCertificate(params.url);
});

ServerMethods.define('geocoding.geocodeAddress', {
  description: 'Geocode a postal address to latitude/longitude via the Google Maps Geocoding API',
  aliases: ['geocodeAddress'],
  positionalParams: ['address'],
  schemaObject: {
    type: 'object',
    properties: { address: { type: 'string' } },
    required: ['address']
  }
}, async function(params, context) {
  const address = params.address;
  if (!address) {
    throw new Meteor.Error('invalid-address', 'Address is required');
  }

  // Get Google Maps API key from settings
  // Try to get a geocoding-specific key first, then fall back to regular key
  const apiKey = get(Meteor, 'settings.private.google.maps.geocodingApiKey') ||
                get(Meteor, 'settings.private.googleGeocoding.apiKey') ||
                process.env.GOOGLE_GEOCODING_API_KEY ||
                get(Meteor, 'settings.private.google.maps.apiKey') ||
                get(Meteor, 'settings.private.googleMapsApiKey') ||
                process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Meteor.Error('no-api-key', 'Google Maps API key not configured');
  }

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    context.log.info('Server-side geocoding address', { data: { address: address } });

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      context.log.info('Successfully geocoded', { data: location });
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address
      };
    } else if (data.status === 'ZERO_RESULTS') {
      throw new Meteor.Error('no-results', 'No coordinates found for this address');
    } else if (data.status === 'REQUEST_DENIED' && data.error_message && data.error_message.includes('referer restrictions')) {
      context.log.error('API Key restriction error', { data: data });
      throw new Meteor.Error('api-key-restriction',
          'The Google Maps API key has HTTP referrer restrictions that prevent server-side geocoding. ' +
          'Please create a separate API key with no restrictions or IP restrictions for geocoding, ' +
          'and add it to settings.private.google.maps.geocodingApiKey');
    } else {
      context.log.error('Geocoding error', { data: data });
      throw new Meteor.Error('geocoding-failed', `Geocoding failed: ${data.status}. ${data.error_message || ''}`);
    }
  } catch (err) {
    if (err instanceof Meteor.Error) {
      throw err;
    }
    context.log.error('Geocoding error', { message: err.message });
    throw new Meteor.Error('geocoding-error', 'Failed to geocode address');
  }
});
