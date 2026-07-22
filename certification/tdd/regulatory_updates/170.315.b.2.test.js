// certification/tdd/regulatory_updates/170.315.b.2.test.js
// ONC § 170.315(b)(2) - Clinical Information Reconciliation and Incorporation — BEHAVIORAL

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-b2-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.b.2', 'reconciliation'],

  /**
   * § 170.315(b)(2) - Clinical Information Reconciliation and Incorporation
   *
   * Regulatory posture: updated criterion, standards-update deadline
   * 2025-12-31 (PASSED) — reconcile medications, allergies, and problems
   * from a transition-of-care summary into the local record.
   *
   * Implementation: pacio-core medication management → /medication-management
   * Methods: pacio.medicationReconciliation.save / .discontinue
   * Package-level precedent: npmPackages/pacio-core/tests/nightwatch/170.315.b.2.test.js
   * BDD: certification/bdd/170.315-b-2-clinical-information-reconciliation.feature
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
        'ONC 170.315.b.2 - Provider session established');
    });
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Test patient with pre-existing medication list': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{ use: 'official', text: 'RegUpd Reconcile', family: 'Reconcile', given: ['RegUpd'] }],
        gender: 'male',
        birthDate: '1958-06-21'
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
        'ONC 170.315.b.2 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. ACCESS - medication management (reconciliation surface) renders': function (browser) {
    browser
      .url('http://localhost:3000/medication-management')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('medication-management',
      'ONC 170.315.b.2 - /medication-management route reachable');
    takeScreenshot(browser, 'regulatory-updates_170.315.b.2_reconciliation.png', '170.315.b.2');
  },

  '04. RECONCILE - save a reconciled medication into the local record': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      var reconciledMed = {
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        subject: { reference: 'Patient/' + patientFhirId },
        medicationCodeableConcept: {
          coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '197361', display: 'Lisinopril 10 MG Oral Tablet' }],
          text: 'Lisinopril 10 MG Oral Tablet'
        },
        note: [{ text: 'Incorporated from transition-of-care summary (b)(2) reconciliation' }]
      };
      Meteor.call('pacio.medicationReconciliation.save', reconciledMed, function (err, result) {
        done({ ok: !err, error: err ? (err.reason || err.message) : null, result: result || null });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[b.2] reconciliation.save:', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.b.2 - Reconciled medication incorporated into the local record (' + JSON.stringify(v.error) + ')');
    });
  },

  '05. RECONCILE - discontinue path responds (removal during reconciliation)': function (browser) {
    browser.executeAsync(function (done) {
      // Method existence + guarded behavior: discontinuing a nonexistent id
      // must respond with a controlled error, not method-not-found.
      Meteor.call('pacio.medicationReconciliation.discontinue', 'nonexistent-med-id', function (err, result) {
        var reason = err ? (err.reason || err.message || '') : '';
        var methodMissing = err && (err.error === 404 || /not found/i.test(String(err.error)) && /method/i.test(reason));
        done({ methodMissing: !!methodMissing, ok: !err || !methodMissing, reason: reason });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[b.2] reconciliation.discontinue probe:', JSON.stringify(v));
      browser.assert.ok(!v.methodMissing,
        'ONC 170.315.b.2 - medicationReconciliation.discontinue capability present (' + v.reason + ')');
    });
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.b.2', 'Clinical information reconciliation (behavioral)', [
      'Provider auth + patient context',
      '/medication-management reconciliation surface renders',
      'Reconciled medication saved into local record',
      'Discontinue path present and guarded'
    ]);
    browser.end();
  }
};
