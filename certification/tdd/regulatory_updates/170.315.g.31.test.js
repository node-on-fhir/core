// certification/tdd/regulatory_updates/170.315.g.31.test.js
// ONC § 170.315(g)(31) - Prior Auth API: Coverage Requirements Discovery — GAP PUNCH-LIST

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-g31-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.g.31', 'prior-auth', 'crd', 'hti-4', 'gap'],

  /**
   * § 170.315(g)(31) - Provider Prior Authorization API:
   * Coverage Requirements Discovery (HTI-4 NEW criterion)
   *
   * Standard: HL7 Da Vinci CRD IG (CDS Hooks based).
   *
   * STATUS: NOT IMPLEMENTED (2026-07 scan) — this test is a documented-gap
   * punch list. It defines the implementation CONTRACT; each GAP step goes
   * green as the capability lands. Do NOT weaken assertions to pass.
   *
   * IMPLEMENTATION CONTRACT (what Opus builds; mock payer service ships
   * in-package like prescription-benefit's mock PBM):
   *   - settings.private.priorAuth.crd.serverUrl — payer CRD endpoint
   *     (mock responder used when unset, so certification evidence works
   *     without a live payer)
   *   - Meteor method 'priorAuth.crd.discover' → { services: [...] } from the
   *     payer's GET {base}/cds-services
   *   - Meteor method 'priorAuth.crd.invoke' (hookType, context) → structured
   *     { cards: [...], systemActions: [...] } for hookType 'order-select' |
   *     'order-sign' with draft order + Coverage prefetch
   *   - coverage-information extension from systemActions persisted onto the
   *     draft order
   *   - invocations recorded for audit (collection or
   *     'priorAuth.crd.getInvocations')
   *
   * BDD: certification/bdd/170.315-g-31-prior-auth-coverage-requirements-discovery.feature
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
        'ONC 170.315.g.31 - Provider session established');
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
        name: [{ use: 'official', text: 'RegUpd Crd', family: 'Crd', given: ['RegUpd'] }],
        gender: 'male',
        birthDate: '1962-02-02'
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
        'ONC 170.315.g.31 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. DISCOVERY - payer CRD service discovery (GAP until implemented)': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('priorAuth.crd.discover', function (err, result) {
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
      console.log('[g.31] crd.discover probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.g.31): priorAuth.crd.discover not implemented — no payer CRD service discovery exists');
      } else {
        browser.assert.ok(v.ok && v.serviceCount > 0,
          'ONC 170.315.g.31 - CRD discovery returns at least one payer service');
      }
    });
  },

  '04. INVOKE - order-select hook to payer CRD service (GAP until implemented)': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      var context = {
        patientId: patientFhirId,
        draftOrders: [{
          resourceType: 'ServiceRequest',
          status: 'draft',
          intent: 'order',
          subject: { reference: 'Patient/' + patientFhirId },
          code: { coding: [{ system: 'http://www.ama-assn.org/go/cpt', code: '70551', display: 'MRI brain without contrast' }] }
        }]
      };
      Meteor.call('priorAuth.crd.invoke', 'order-select', context, function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          ok: !err,
          error: msg || null,
          hasCards: !!(result && result.cards && result.cards.length),
          hasPriorAuthIndication: !!(result && JSON.stringify(result).toLowerCase().indexOf('prior') !== -1)
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[g.31] crd.invoke order-select probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.g.31): priorAuth.crd.invoke not implemented — order-select is never fired at a payer CRD service');
      } else {
        browser.assert.ok(v.ok && v.hasCards,
          'ONC 170.315.g.31 - order-select invocation returns CDS cards');
      }
    });
  },

  '05. ANNOTATE - coverage-information persisted on the order (GAP until implemented)': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('priorAuth.crd.getInvocations', function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          ok: !err,
          count: result && result.length ? result.length : 0
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[g.31] crd.getInvocations probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.g.31): no CRD invocation audit trail (priorAuth.crd.getInvocations missing) and no coverage-information annotation persistence');
      } else {
        browser.assert.ok(v.ok, 'ONC 170.315.g.31 - CRD invocation audit trail accessible');
      }
    });
    takeScreenshot(browser, 'regulatory-updates_170.315.g.31_crd.png', '170.315.g.31');
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.g.31', 'Prior auth CRD (gap punch-list)', [
      'Provider auth + patient context',
      'GAP (red): payer CRD service discovery missing',
      'GAP (red): order-select/order-sign CRD invocation missing',
      'GAP (red): coverage-information annotation + audit trail missing',
      'Contract: priorAuth.crd.discover / invoke / getInvocations + settings.private.priorAuth.crd'
    ]);
    browser.end();
  }
};
