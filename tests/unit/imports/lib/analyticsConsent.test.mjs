// tests/unit/imports/lib/analyticsConsent.test.mjs
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// The lib reads window.localStorage; stub it for node.
function freshStore() {
  const backing = {};
  globalThis.window = {
    localStorage: {
      getItem: function(k) { return Object.prototype.hasOwnProperty.call(backing, k) ? backing[k] : null; },
      setItem: function(k, v) { backing[k] = String(v); }
    }
  };
}

const { getAnalyticsConsent, setAnalyticsConsent, onAnalyticsConsentChange, ANALYTICS_CONSENT_KEY } =
  require('../../../../imports/lib/analyticsConsent.js');

beforeEach(freshStore);

test('defaults to null (no decision yet — GA must NOT run)', function() {
  assert.equal(getAnalyticsConsent(), null);
});

test('granted and denied round-trip; junk values read as null', function() {
  setAnalyticsConsent('granted');
  assert.equal(getAnalyticsConsent(), 'granted');
  setAnalyticsConsent('denied');
  assert.equal(getAnalyticsConsent(), 'denied');
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'maybe');
  assert.equal(getAnalyticsConsent(), null);
});

test('rejects values other than granted/denied', function() {
  assert.throws(function() { setAnalyticsConsent('yes'); });
});

test('change listeners fire and unsubscribe works', function() {
  const seen = [];
  const off = onAnalyticsConsentChange(function(value) { seen.push(value); });
  setAnalyticsConsent('granted');
  off();
  setAnalyticsConsent('denied');
  assert.deepEqual(seen, ['granted']);
});

test('survives absent window/localStorage (SSR/desktop edge)', function() {
  delete globalThis.window;
  assert.equal(getAnalyticsConsent(), null);
  assert.doesNotThrow(function() { setAnalyticsConsent('granted'); });
});
