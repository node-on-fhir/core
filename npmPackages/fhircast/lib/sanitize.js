// npmPackages/fhircast/lib/sanitize.js
//
// Shared isomorphic utility for sanitizing dotted keys in FHIRcast events.
// MongoDB/Minimongo forbid dots in field names; FHIRcast STU3 wire format
// uses keys like "hub.topic" and "hub.event".

export function sanitizeDottedKeys(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeDottedKeys);
  var result = {};
  Object.keys(obj).forEach(function(key) {
    var safeKey = key.replace(/\./g, '_');
    result[safeKey] = sanitizeDottedKeys(obj[key]);
  });
  return result;
}
