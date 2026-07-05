// imports/lib/GoogleMapsLoader.js
// Guarded loader for the Google Maps JavaScript API.
//
// google-map-react's internal loader retries forever and surfaces unhandled
// promise rejections when the Maps script can't load (offline, blocked by a
// Content-Security-Policy script-src that omits maps.googleapis.com, bad
// key). Components should await ensureGoogleMapsScript() and only mount
// <GoogleMapReact> on success, rendering a graceful placeholder otherwise.

let scriptPromise = null;

export function isGoogleMapsLoaded() {
  return !!(typeof window !== 'undefined' && window.google && window.google.maps);
}

/**
 * Load the Maps JavaScript API once, with explicit failure detection.
 * CSP-blocked and network-failed scripts fire the element's error event;
 * the timeout is a backstop for hangs.
 * @param {string} apiKey - Google Maps API key
 * @param {Object} [options] - { timeoutMs } (default 10000)
 * @returns {Promise<boolean>} resolves true when window.google.maps is usable
 */
export function ensureGoogleMapsScript(apiKey, options = {}) {
  const timeoutMs = options.timeoutMs || 10000;

  if (isGoogleMapsLoaded()) {
    return Promise.resolve(true);
  }
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise(function(resolve, reject) {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(apiKey);
    script.async = true;

    const timer = setTimeout(function() {
      detach();
      reject(new Error('Timed out loading the Google Maps JavaScript API after ' + timeoutMs + 'ms'));
    }, timeoutMs);

    function detach() {
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
    }

    script.onload = function() {
      detach();
      resolve(true);
    };

    script.onerror = function() {
      detach();
      script.remove();
      reject(new Error('The Google Maps JavaScript API could not load — network failure, invalid key, or a Content-Security-Policy script-src that blocks maps.googleapis.com'));
    };

    document.head.appendChild(script);
  }).catch(function(error) {
    // Clear the cache so a later mount can retry (e.g. after connectivity returns)
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

export default { ensureGoogleMapsScript, isGoogleMapsLoaded };
