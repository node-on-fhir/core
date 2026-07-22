// certification/tdd/regulatory_updates/170.315.j.20.test.js
// ONC § 170.315(j)(20) - Workflow Triggers for DSI: Clients — GAP PUNCH-LIST

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-j20-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.j.20', 'cds-hooks', 'dsi-client', 'hti-4', 'gap'],

  /**
   * § 170.315(j)(20) - Workflow Triggers for Decision Support
   * Interventions: Clients (HTI-4 NEW criterion)
   *
   * Standard: HL7 CDS Hooks (client role).
   *
   * STATUS: PARTIAL (2026-07 scan). npmPackages/decision-support fires DSI
   * evaluation SERVER-side (server/hooks.js on ServiceRequest insert / ToC
   * incorporation) and server/CdsHooksEndpoints.js has a stub /cds-services.
   * The CLIENT-side workflow triggers (patient-view, order-select,
   * order-sign fired from the UI, cards rendered in-workflow) do not exist.
   *
   * IMPLEMENTATION CONTRACT (extend npmPackages/decision-support):
   *   - settings.private.cdsHooks.servers: [{ baseUrl, name }] (in-package
   *     mock CDS service when unset)
   *   - Meteor method 'cdsHooks.client.discover' → { services: [...] }
   *   - Meteor method 'cdsHooks.client.fire' (hookType, context) →
   *     { cards: [...] } for 'patient-view' | 'order-select' | 'order-sign',
   *     assembling hook context + prefetch server-side
   *   - UI wiring: chart open fires patient-view; order composer fires
   *     order-select; signing fires order-sign; cards rendered in-workflow;
   *     suggestion acceptance applies proposed resource changes
   *   - Meteor method 'cdsHooks.client.getInvocations' → audit trail
   *   - failures never block the clinical workflow
   *
   * BDD: certification/bdd/170.315-j-20-workflow-triggers-dsi-clients.feature
   */

  before: function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .windowSize('current', 1400, 900)
      .pause(3000);
  },

  '01. Provider authenticated': function (browser) {
    browser.executeAsync(function (creds, done) {
      if (typeof Meteor !== 'undefined' && Meteor.userId()) { done({ loggedIn: true }); return; }
      Meteor.loginWithPassword(creds.username, creds.password, function (err) {
        done({ loggedIn: !err && !!Meteor.userId(), error: err ? (err.reason || err.message) : null });
      });
    }, [{ username: 'demouser', password: 'password2025' }], function (result) {
      browser.assert.ok(result.value && result.value.loggedIn,
        'ONC 170.315.j.20 - Provider session established');
    });
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Test patient created and selected': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{ use: 'official', text: 'RegUpd Hooks', family: 'Hooks', given: ['RegUpd'] }],
        gender: 'female',
        birthDate: '1979-03-03'
      }, function (insertErr, mongoId) {
        if (insertErr) { done({ ok: false, error: insertErr.message }); return; }
        Meteor.call('patients.findOne', mongoId, function (findErr, patient) {
          if (findErr || !patient) { done({ ok: false, error: 'patient lookup failed' }); return; }
          Session.set('selectedPatientId', patient.id);
          Session.set('selectedPatient', patient);
          done({ ok: true });
        });
      });
    }, [testPatientFhirId], function (result) {
      browser.assert.ok(result.value && result.value.ok,
        'ONC 170.315.j.20 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. SUBSTRATE - DSI server-side evaluation exists (should pass today)': function (browser) {
    browser
      .url('http://localhost:3000/decision-support')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('decision-support',
      'ONC 170.315.j.20 - /decision-support (b.11 DSI surface) reachable — the substrate the client triggers extend');
    takeScreenshot(browser, 'regulatory-updates_170.315.j.20_dsi-client.png', '170.315.j.20');
  },

  '04. DISCOVERY - CDS service discovery as a client (GAP until implemented)': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('cdsHooks.client.discover', function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          ok: !err,
          error: msg || null,
          serviceCount: result && result.services ? result.services.length : 0
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[j.20] cdsHooks.client.discover probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.j.20): cdsHooks.client.discover not implemented — the EHR never performs CDS Hooks service discovery as a client');
      } else {
        browser.assert.ok(v.ok && v.serviceCount > 0,
          'ONC 170.315.j.20 - Client discovery returns at least one CDS service');
      }
    });
  },

  '05. TRIGGERS - patient-view / order-select / order-sign firing (GAP until implemented)': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      var draftOrder = {
        resourceType: 'MedicationRequest',
        status: 'draft',
        intent: 'order',
        subject: { reference: 'Patient/' + patientFhirId },
        medicationCodeableConcept: {
          coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '197361', display: 'Lisinopril 10 MG Oral Tablet' }]
        }
      };
      function probe(hookType, context, cb) {
        Meteor.call('cdsHooks.client.fire', hookType, context, function (err, result) {
          var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
          cb({
            hook: hookType,
            methodMissing: !!err && /method .*not found|404/i.test(msg),
            ok: !err,
            cardCount: result && result.cards ? result.cards.length : 0
          });
        });
      }
      probe('patient-view', { patientId: patientFhirId }, function (pv) {
        probe('order-select', { patientId: patientFhirId, draftOrders: [draftOrder] }, function (os) {
          probe('order-sign', { patientId: patientFhirId, draftOrders: [draftOrder] }, function (osign) {
            done({ patientView: pv, orderSelect: os, orderSign: osign });
          });
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[j.20] hook firing probes:', JSON.stringify(v));
      ['patientView', 'orderSelect', 'orderSign'].forEach(function (key) {
        var p = v[key] || {};
        if (p.methodMissing) {
          browser.verify.fail('GAP(170.315.j.20): ' + p.hook + ' hook is never fired by the client — cdsHooks.client.fire missing');
        } else {
          browser.assert.ok(p.ok,
            'ONC 170.315.j.20 - ' + p.hook + ' invocation responds with cards structure');
        }
      });
    });
  },

  '06. AUDIT - invocation record accessible (GAP until implemented)': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('cdsHooks.client.getInvocations', function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          ok: !err,
          count: Array.isArray(result) ? result.length : 0
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[j.20] getInvocations probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.j.20): no client-side hook invocation audit trail (cdsHooks.client.getInvocations missing)');
      } else {
        browser.assert.ok(v.ok, 'ONC 170.315.j.20 - Hook invocation audit trail accessible');
      }
    });
  },

  '07. Completion': function (browser) {
    logTestCompletion(browser, '170.315.j.20', 'CDS Hooks client triggers (gap punch-list)', [
      'Provider auth + patient context',
      'Substrate: /decision-support (b.11) renders',
      'GAP (red): client service discovery missing',
      'GAP (red): patient-view / order-select / order-sign never fired from UI',
      'GAP (red): invocation audit trail missing',
      'Contract: cdsHooks.client.discover / fire / getInvocations + settings.private.cdsHooks.servers'
    ]);
    browser.end();
  }
};
