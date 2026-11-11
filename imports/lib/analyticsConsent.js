// imports/lib/analyticsConsent.js
//
// Consent state for analytics cookies (GA4 via react-ga4 in App.jsx).
// EU ePrivacy/GDPR: non-essential cookies require consent BEFORE they are
// set, so App.jsx defers ReactGA.initialize until this reads 'granted'.
// CJS on purpose: Meteor client AND node --test.

var ANALYTICS_CONSENT_KEY = 'analyticsConsent';
var listeners = [];

function storage() {
  try {
    return (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
  } catch (err) {
    return null; // storage blocked (private mode, desktop webview policy)
  }
}

function getAnalyticsConsent() {
  var store = storage();
  if (!store) { return null; }
  var value = store.getItem(ANALYTICS_CONSENT_KEY);
  return (value === 'granted' || value === 'denied') ? value : null;
}

function setAnalyticsConsent(value) {
  if (value !== 'granted' && value !== 'denied') {
    throw new Error('analyticsConsent must be "granted" or "denied", got: ' + value);
  }
  var store = storage();
  if (store) {
    store.setItem(ANALYTICS_CONSENT_KEY, value);
  }
  listeners.forEach(function(listener) {
    try { listener(value); } catch (err) { /* one bad listener must not block the rest */ }
  });
}

function onAnalyticsConsentChange(listener) {
  listeners.push(listener);
  return function unsubscribe() {
    listeners = listeners.filter(function(candidate) { return candidate !== listener; });
  };
}

module.exports = {
  ANALYTICS_CONSENT_KEY: ANALYTICS_CONSENT_KEY,
  getAnalyticsConsent: getAnalyticsConsent,
  setAnalyticsConsent: setAnalyticsConsent,
  onAnalyticsConsentChange: onAnalyticsConsentChange
};
