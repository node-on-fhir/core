// certification/tdd/regulatory_updates/170.315.j.21.test.js
// ONC § 170.315(j)(21) - Subscriptions: Client — GAP PUNCH-LIST

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.j.21', 'subscriptions', 'hti-4', 'gap'],

  /**
   * § 170.315(j)(21) - Subscriptions: Client (HTI-4 NEW criterion)
   *
   * Standard: HL7 FHIR Subscriptions R5 Backport IG
   * (hl7.fhir.uv.subscriptions-backport) — topic-based subscriptions on R4.
   *
   * STATUS: NOT IMPLEMENTED (2026-07 scan). Only a Subscription schema
   * skeleton exists (imports/lib/schemas/SimpleSchemas/Subscriptions.js).
   * This test is the documented-gap punch list / implementation contract.
   *
   * IMPLEMENTATION CONTRACT (new package, suggested
   * npmPackages/fhir-subscriptions; in-package mock topic server for cert
   * evidence like prescription-benefit's mock PBM):
   *   - Meteor method 'fhirSubscriptions.create' ({ serverUrl, topic,
   *     payloadType }) → POSTs the backport-profile Subscription (rest-hook
   *     channel → this system's notification endpoint), returns
   *     { subscriptionId, status }
   *   - Meteor method 'fhirSubscriptions.list' → local subscription registry
   *     with lifecycle states (requested | active | error | off)
   *   - Meteor method 'fhirSubscriptions.getStatus' (subscriptionId) →
   *     $status result incl. events-since-start (dropped-event recovery)
   *   - WebApp rest-hook receiver: POST /fhir-subscriptions/rest-hook —
   *     accepts handshake/heartbeat/event-notification Bundles
   *     (type=history, SubscriptionStatus first entry), 200 on handshake
   *   - notifications persisted for audit; id-only payload resolution
   *     fetches referenced resources
   *
   * BDD: certification/bdd/170.315-j-21-subscriptions-client.feature
   */

  before: function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .windowSize('current', 1400, 900)
      .pause(3000);
  },

  '01. User authenticated': function (browser) {
    browser.executeAsync(function (creds, done) {
      if (typeof Meteor !== 'undefined' && Meteor.userId()) { done({ loggedIn: true }); return; }
      Meteor.loginWithPassword(creds.username, creds.password, function (err) {
        done({ loggedIn: !err && !!Meteor.userId(), error: err ? (err.reason || err.message) : null });
      });
    }, [{ username: 'demouser', password: 'password2025' }], function (result) {
      browser.assert.ok(result.value && result.value.loggedIn,
        'ONC 170.315.j.21 - Session established');
    });
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. CREATE - topic-based subscription on an external server (GAP until implemented)': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('fhirSubscriptions.create', {
        serverUrl: 'http://localhost:3000/mock-subscription-server',
        topic: 'http://hl7.org/SubscriptionTopic/admission-discharge',
        payloadType: 'id-only'
      }, function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          ok: !err,
          error: msg || null,
          subscriptionId: result ? result.subscriptionId : null,
          status: result ? result.status : null
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[j.21] fhirSubscriptions.create probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.j.21): fhirSubscriptions.create not implemented — the system cannot subscribe to topics on an external FHIR server');
      } else {
        browser.assert.ok(v.ok && v.subscriptionId,
          'ONC 170.315.j.21 - Subscription created with an id and lifecycle status');
      }
    });
  },

  '03. RECEIVE - rest-hook notification endpoint (GAP until implemented)': function (browser) {
    browser.executeAsync(function (done) {
      // Handshake notification per the backport IG: Bundle(type=history)
      // whose first entry is a SubscriptionStatus with type 'handshake'.
      var handshake = {
        resourceType: 'Bundle',
        type: 'history',
        entry: [{
          resource: {
            resourceType: 'SubscriptionStatus',
            status: 'requested',
            type: 'handshake',
            subscription: { reference: 'Subscription/test-handshake' }
          }
        }]
      };
      fetch('/fhir-subscriptions/rest-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/fhir+json' },
        body: JSON.stringify(handshake)
      }).then(function (res) {
        done({ status: res.status, reachable: res.status !== 404 });
      }).catch(function (e) {
        done({ status: -1, reachable: false, error: String(e) });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[j.21] rest-hook endpoint probe:', JSON.stringify(v));
      if (!v.reachable) {
        browser.verify.fail('GAP(170.315.j.21): no rest-hook notification receiver — POST /fhir-subscriptions/rest-hook returns ' + v.status + '; handshake/heartbeat/event Bundles cannot be received');
      } else {
        browser.assert.ok(v.status >= 200 && v.status < 300,
          'ONC 170.315.j.21 - rest-hook endpoint accepts a handshake notification (HTTP ' + v.status + ')');
      }
    });
  },

  '04. LIFECYCLE - subscription registry and $status (GAP until implemented)': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('fhirSubscriptions.list', function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          ok: !err,
          count: Array.isArray(result) ? result.length : (result && result.subscriptions ? result.subscriptions.length : 0)
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[j.21] fhirSubscriptions.list probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.j.21): no local subscription registry (fhirSubscriptions.list missing) — lifecycle states and $status recovery are unmanaged');
      } else {
        browser.assert.ok(v.ok,
          'ONC 170.315.j.21 - Subscription registry responds');
      }
    });
    takeScreenshot(browser, 'regulatory-updates_170.315.j.21_subscriptions.png', '170.315.j.21');
  },

  '05. Completion': function (browser) {
    logTestCompletion(browser, '170.315.j.21', 'Subscriptions client (gap punch-list)', [
      'Session established',
      'GAP (red): subscription creation on external servers missing',
      'GAP (red): rest-hook notification receiver missing',
      'GAP (red): subscription registry / $status recovery missing',
      'Contract: fhirSubscriptions.create / list / getStatus + POST /fhir-subscriptions/rest-hook'
    ]);
    browser.end();
  }
};
