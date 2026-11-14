// imports/lib/scrubEventParams.js
//
// Allowlist + PII filter for every GA4 event parameter. Anything not on the
// list is dropped; any string VALUE containing an email shape is dropped.
// This is the enforcement point for "no PII ever reaches GA4".
// CJS: Meteor client AND node --test.

var ALLOWED_PARAM_KEYS = [
  'product', 'page_path', 'cta_location', 'source', 'method',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'item_id', 'item_name', 'interest_area', 'value', 'currency'
];

var EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;

function scrubEventParams(params) {
  var out = {};
  if (!params || typeof params !== 'object') { return out; }
  Object.keys(params).forEach(function(key) {
    if (ALLOWED_PARAM_KEYS.indexOf(key) === -1) { return; }
    var value = params[key];
    var type = typeof value;
    if (type !== 'string' && type !== 'number' && type !== 'boolean') { return; }
    if (type === 'string' && EMAIL_PATTERN.test(value)) { return; }
    out[key] = value;
  });
  return out;
}

module.exports = { scrubEventParams: scrubEventParams, ALLOWED_PARAM_KEYS: ALLOWED_PARAM_KEYS };
