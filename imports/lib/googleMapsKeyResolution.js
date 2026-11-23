// imports/lib/googleMapsKeyResolution.js
//
// BYOK resolution for the Google Maps JavaScript API key. Desktop game
// builds ship with NO bundled key (bundled keys are public + billable to
// us); players save their own via userApiKeys (provider 'googleMaps').
// Operator-managed web deployments may still provide a deployment-wide key
// in settings.public.google.maps.apiKey, which takes precedence.
// CJS on purpose: Meteor client AND node --test.

var MAPS_PROVIDER_ID = 'googleMaps';

function resolveMapsKey(options) {
  options = options || {};
  var settingsKey = typeof options.settingsKey === 'string' ? options.settingsKey.trim() : '';
  if (settingsKey) {
    return { apiKey: settingsKey, source: 'settings' };
  }
  var userEntry = options.userEntry;
  var userKey = (userEntry && typeof userEntry.value === 'string') ? userEntry.value.trim() : '';
  if (userKey) {
    return { apiKey: userKey, source: 'user' };
  }
  return { apiKey: null, source: null };
}

module.exports = {
  MAPS_PROVIDER_ID: MAPS_PROVIDER_ID,
  resolveMapsKey: resolveMapsKey
};
