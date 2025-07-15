
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { fetch } from 'meteor/fetch';

import { fetchCertificate } from './OAuthEndpoints';

let log = console.log;

Meteor.methods({
    getAsset: async function (path) {
        let file = await Assets.getTextAsync(path);
        return file;
    },
    fetchCertificate: async function (url) {
        fetchCertificate(url);
    },
    geocodeAddress: async function(address) {
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
            console.log('Server-side geocoding address:', address);
            
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            
            if (data.status === 'OK' && data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                console.log('Successfully geocoded to:', location);
                return {
                    latitude: location.lat,
                    longitude: location.lng,
                    formattedAddress: data.results[0].formatted_address
                };
            } else if (data.status === 'ZERO_RESULTS') {
                throw new Meteor.Error('no-results', 'No coordinates found for this address');
            } else if (data.status === 'REQUEST_DENIED' && data.error_message && data.error_message.includes('referer restrictions')) {
                console.error('API Key restriction error:', data);
                throw new Meteor.Error('api-key-restriction', 
                    'The Google Maps API key has HTTP referrer restrictions that prevent server-side geocoding. ' +
                    'Please create a separate API key with no restrictions or IP restrictions for geocoding, ' +
                    'and add it to settings.private.google.maps.geocodingApiKey');
            } else {
                console.error('Geocoding error:', data);
                throw new Meteor.Error('geocoding-failed', `Geocoding failed: ${data.status}. ${data.error_message || ''}`);
            }
        } catch (err) {
            if (err instanceof Meteor.Error) {
                throw err;
            }
            console.error('Geocoding error:', err);
            throw new Meteor.Error('geocoding-error', 'Failed to geocode address');
        }
    }
});
