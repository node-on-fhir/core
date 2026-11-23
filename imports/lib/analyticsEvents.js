// imports/lib/analyticsEvents.js
//
// The ONLY module that talks to ReactGA. Composes: consent gate (legal-scrub
// Task 3), PHI path scrubbing, param allowlisting, page-view dedupe, and a
// dev-traffic gate. Everything else calls trackPageView / trackEvent.
//
// DEVIATION from brief: analyticsReady() checks consent + measurementId +
// dev gate but NOT the analyticsInitialized flag (which lives in App.jsx and
// cannot be imported here without a circular dependency). Instead,
// trackPageView/trackEvent additionally verify that window.gtag exists —
// gtag is only attached to window once ReactGA.initialize() runs — so any
// dispatch before initialization is safely suppressed with a debug log.

import ReactGA from 'react-ga4';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { getAnalyticsConsent, onAnalyticsConsentChange } from '/imports/lib/analyticsConsent';
import { scrubAnalyticsPath } from '/imports/lib/scrubAnalyticsPath';
import { scrubEventParams } from '/imports/lib/scrubEventParams';
import { getAttribution } from '/imports/lib/campaignAttribution';
import { createPageViewDeduper } from '/imports/lib/pageViewDeduper';

var deduper = createPageViewDeduper();

function debugEnabled() {
  return get(Meteor, 'settings.public.google.analytics.debug', false);
}

function gtagReady() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function analyticsReady() {
  if (!get(Meteor, 'settings.public.google.analytics.measurementId', '')) { return false; }
  if (getAnalyticsConsent() !== 'granted') { return false; }
  // Internal-traffic gate: dev instances stay silent unless explicitly opted in.
  if (Meteor.isDevelopment && !get(Meteor, 'settings.public.google.analytics.sendInDevelopment', false)) {
    return false;
  }
  return true;
}

export function trackPageView(pathname) {
  var scrubbed = scrubAnalyticsPath(pathname);
  if (!deduper.shouldTrack(scrubbed)) { return; }
  if (!analyticsReady()) {
    if (debugEnabled()) { console.info('[analytics] suppressed page_view', scrubbed); }
    return;
  }
  if (!gtagReady()) {
    // ReactGA.initialize has not run yet (consent granted but init pending).
    // The consent-grant replay in onAnalyticsConsentChange will fire after
    // initAnalyticsIfConsented, so this path should be rare.
    if (debugEnabled()) { console.info('[analytics] suppressed page_view (gtag not ready)', scrubbed); }
    return;
  }
  ReactGA.set({ page_location: window.location.origin + scrubbed, page_path: scrubbed });
  ReactGA.send({ hitType: 'pageview', page: scrubbed });
  if (debugEnabled()) { console.info('[analytics] page_view', scrubbed); }
}

export function trackEvent(name, params) {
  var latest = getAttribution().latest || {};
  var clean = scrubEventParams(Object.assign({}, latest, params));
  if (!analyticsReady()) {
    if (debugEnabled()) { console.info('[analytics] suppressed ' + name, clean); }
    return;
  }
  if (!gtagReady()) {
    if (debugEnabled()) { console.info('[analytics] suppressed ' + name + ' (gtag not ready)', clean); }
    return;
  }
  ReactGA.event(name, clean);
  if (debugEnabled()) { console.info('[analytics] ' + name, clean); }
}

// Consent-grant replay: the visitor's entry page fired pre-consent into the
// void. Reset the deduper and re-send the CURRENT page once, so consenting
// sessions get a landing page instead of "(not set)".
// ORDERING (verified on the wire, 2026-11-10): this module is imported near
// the TOP of App.jsx (via AnalyticsPageViews), so this listener registers
// BEFORE App.jsx's initAnalyticsIfConsented listener — running synchronously
// here would find gtag absent and the replay would be silently suppressed.
// Defer one macrotask so the entire listener chain (including initialization)
// completes before the replay dispatches.
onAnalyticsConsentChange(function(value) {
  if (value === 'granted' && typeof window !== 'undefined') {
    setTimeout(function() {
      deduper.reset();
      trackPageView(window.location.pathname);
    }, 0);
  }
});
