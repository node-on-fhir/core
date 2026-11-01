// imports/lib/scrubAnalyticsPath.js
//
// Privacy scrubber for analytics pageview paths. Honeycomb routes carry
// FHIR resource ids, Mongo _ids, UUIDs, and one-time tokens in the URL
// (/patients/:id, /vital-signs/:patientId/:observationId,
// /email-list/unsubscribe/:token, ?connect-code=... on the OAuth callback).
// None of that may reach Google Analytics — ids assigned to a patient are
// identifiers even when they look like random strings, and the FTC Health
// Breach Notification Rule reaches PHR-vendor telemetry that HIPAA doesn't.
//
// Strategy: report the route *shape*, not the URL. Query string and fragment
// are dropped unconditionally; any id-shaped path segment becomes ":id".
// Deliberately over-scrubs on ambiguity — a mangled pageview bucket is
// cheap, a leaked identifier is not.
//
// Pure and dependency-free: node --test via
// tests/unit/imports/lib/scrubAnalyticsPath.test.mjs (npm run test:analytics-scrub).

// Exact-path allowlist: static public routes that pass through verbatim even
// when a segment is id-shaped. These are fixed marketing/landing slugs with no
// PHI — e.g. "moonbase2026" is digit-bearing and would otherwise be scrubbed to
// :id (collapsing its pageviews into the generic id bucket in GA4). Only add
// paths that are hard-coded routes carrying zero identifiers. Compared
// case-insensitively against the full path (sans query/fragment).
const STATIC_PATH_ALLOWLIST = new Set([
  '/moonbase2026'
]);

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_SEGMENT = /^[0-9a-f]{16,}$/i;
const PURE_DIGITS = /^[0-9]+$/;
const HAS_DIGIT = /[0-9]/;
const HAS_UPPERCASE = /[A-Z]/;

function isIdShaped(segment) {
  if (PURE_DIGITS.test(segment)) {
    return true;
  }
  if (UUID_SEGMENT.test(segment) || HEX_SEGMENT.test(segment)) {
    return true;
  }
  // Anything digit-bearing of meaningful length: FHIR ids, Random.id,
  // LOINC-in-path, seed ids. Route words are lowercase kebab and the rare
  // digit-bearing ones ("r4") stay short.
  if (HAS_DIGIT.test(segment) && segment.length >= 6) {
    return true;
  }
  // Long mixed-case blobs without digits: base64ish tokens, the all-letter
  // tail of the Random.id distribution. Route words are lowercase kebab.
  if (HAS_UPPERCASE.test(segment) && segment.length >= 15) {
    return true;
  }
  return false;
}

export function scrubAnalyticsPath(pathname) {
  const raw = String(pathname || '');
  // Query string and fragment never ship — they carry OAuth codes and
  // search terms.
  const pathOnly = raw.split(/[?#]/)[0];
  if (!pathOnly || pathOnly === '/') {
    return '/';
  }
  // Known-safe static route — never scrub (preserves digit-bearing slugs).
  if (STATIC_PATH_ALLOWLIST.has(pathOnly.toLowerCase())) {
    return pathOnly;
  }
  const scrubbed = pathOnly.split('/').map(function(segment) {
    if (!segment) {
      return segment;   // preserve leading/duplicate slashes as-is
    }
    return isIdShaped(segment) ? ':id' : segment;
  }).join('/');
  return scrubbed || '/';
}

export default scrubAnalyticsPath;
