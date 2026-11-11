// imports/lib/campaignAttribution.js
//
// First-touch + latest-touch UTM attribution in localStorage. Captured once
// per app start (client/main.jsx) BEFORE the router strips/changes the URL.
// Attribution is first-party functional data (disclosed in the privacy
// policy); it reaches GA only through trackEvent's consent gate, and reaches
// Mongo as business data on explicit submissions. CJS: client + node --test.

var ATTRIBUTION_STORAGE_KEY = 'campaignAttribution';
var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function storage() {
  try {
    return (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
  } catch (err) { return null; }
}

function parseUtmParams(search) {
  var out = {};
  var query = typeof search === 'string' ? search.replace(/^\?/, '') : '';
  if (!query) { return out; }
  query.split('&').forEach(function(pair) {
    var parts = pair.split('=');
    var key = decodeURIComponent(parts[0] || '');
    if (UTM_KEYS.indexOf(key) === -1) { return; }
    var value = decodeURIComponent((parts[1] || '').replace(/\+/g, ' ')).trim();
    if (value) { out[key] = value.slice(0, 120); }
  });
  return out;
}

function read() {
  var store = storage();
  if (!store) { return { first: null, latest: null }; }
  try {
    var raw = store.getItem(ATTRIBUTION_STORAGE_KEY);
    var parsed = raw ? JSON.parse(raw) : null;
    return (parsed && typeof parsed === 'object')
      ? { first: parsed.first || null, latest: parsed.latest || null }
      : { first: null, latest: null };
  } catch (err) { return { first: null, latest: null }; }
}

function captureAttribution(search, nowIso) {
  var utm = parseUtmParams(search);
  var current = read();
  if (Object.keys(utm).length === 0) { return current; }
  var landingPage = (typeof window !== 'undefined' && window.location) ? window.location.pathname : '';
  var touch = Object.assign({}, utm, { at: nowIso, landingPage: landingPage });
  var next = { first: current.first || touch, latest: touch };
  var store = storage();
  if (store) {
    try { store.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next)); } catch (err) { /* quota/blocked */ }
  }
  return next;
}

function getAttribution() { return read(); }

module.exports = {
  ATTRIBUTION_STORAGE_KEY: ATTRIBUTION_STORAGE_KEY,
  parseUtmParams: parseUtmParams,
  captureAttribution: captureAttribution,
  getAttribution: getAttribution
};
