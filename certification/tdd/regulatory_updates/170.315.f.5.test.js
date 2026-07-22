// certification/tdd/regulatory_updates/170.315.f.5.test.js
// ONC § 170.315(f)(5) - Electronic Case Reporting — BEHAVIORAL + DOCUMENTED GAP

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-f5-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.f.5', 'case-reporting', 'public-health'],

  /**
   * § 170.315(f)(5) - Transmission to Public Health Agencies:
   * Electronic Case Reporting
   *
   * Regulatory posture: updated criterion, standards-update deadline
   * 2025-12-31 (PASSED) — eICR generation (eICR FHIR/CDA) and RR
   * (Reportability Response) processing.
   *
   * Implementation: npmPackages/case-reporting → /case-reporting
   * Methods: caseReporting.generateEcr / submitToPublicHealth / processRrReceived
   *
   * DOCUMENTED GAP (expected red until closed): transmission to a public
   * health agency endpoint is a stub (per 2026-07 codebase scan the package
   * is an eICR framework — generation is real, outbound transmission is
   * simulated). The GAP step below fails while that remains true.
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
        'ONC 170.315.f.5 - Provider session established');
    });
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Test patient with a reportable condition': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{ use: 'official', text: 'RegUpd Ecr', family: 'Ecr', given: ['RegUpd'] }],
        gender: 'male',
        birthDate: '1988-12-12'
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
        'ONC 170.315.f.5 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. UI - case reporting surface renders': function (browser) {
    browser
      .url('http://localhost:3000/case-reporting')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('case-reporting',
      'ONC 170.315.f.5 - /case-reporting route reachable');
    takeScreenshot(browser, 'regulatory-updates_170.315.f.5_case-reporting.png', '170.315.f.5');
  },

  '04. GENERATE - eICR generation for a reportable condition': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      var trigger = {
        patientId: patientFhirId,
        condition: {
          coding: [{ system: 'http://snomed.info/sct', code: '840539006', display: 'COVID-19' }]
        }
      };
      Meteor.call('caseReporting.generateEcr', trigger, function (err, ecr) {
        done({ ok: !err, error: err ? (err.reason || err.message) : null, hasEcr: !!ecr });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[f.5] generateEcr:', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.f.5 - eICR generation responds (' + JSON.stringify(v.error) + ')');
    });
  },

  '05. TRANSMIT - public health submission (documented gap if simulated)': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      Meteor.call('caseReporting.submitToPublicHealth', { patientId: patientFhirId }, function (err, result) {
        var payload = result || {};
        var marker = JSON.stringify(payload).toLowerCase();
        done({
          ok: !err,
          error: err ? (err.reason || err.message) : null,
          simulated: /simulat|mock|stub|demo|not.?configured/.test(marker),
          result: payload
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[f.5] submitToPublicHealth:', JSON.stringify(v).substring(0, 400));
      browser.assert.ok(v.ok,
        'ONC 170.315.f.5 - Submission method responds without error');
      if (v.simulated) {
        // GAP(170.315.f.5): outbound transmission to a public health agency
        // AIMS/eCR endpoint is simulated — generation exists, transport does not.
        browser.verify.fail('GAP(170.315.f.5): eICR transmission is simulated/stubbed — no real public-health agency transport is configured or implemented');
      }
    });
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.f.5', 'Electronic case reporting (behavioral + gap)', [
      'Provider auth + patient context',
      '/case-reporting surface renders',
      'eICR generation responds',
      'GAP (conditional red): outbound transmission simulated'
    ]);
    browser.end();
  }
};
