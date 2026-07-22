// certification/tdd/regulatory_updates/170.315.f.4.test.js
// ONC § 170.315(f)(4) - Transmission to Cancer Registries — BEHAVIORAL

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-f4-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.f.4', 'cancer-registry', 'public-health'],

  /**
   * § 170.315(f)(4) - Transmission to Cancer Registries
   *
   * Regulatory posture: updated criterion, minimum-standard code-set deadline
   * 2025-12-31 (PASSED) — cancer case data with updated code sets (HL7 CDA
   * cancer event report).
   *
   * Implementation: npmPackages/cancer-registry-reporting → /cancer-registry-reporting
   * Methods: cancerRegistry.generateReport / submitToRegistry / validateCaseData
   * BDD: certification/bdd/170.315-f-4-cancer-registries.feature
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
        'ONC 170.315.f.4 - Provider session established');
    });
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Test patient with a cancer diagnosis': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{ use: 'official', text: 'RegUpd Oncology', family: 'Oncology', given: ['RegUpd'] }],
        gender: 'female',
        birthDate: '1955-01-25'
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
        'ONC 170.315.f.4 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. UI - cancer registry reporting surface renders': function (browser) {
    browser
      .url('http://localhost:3000/cancer-registry-reporting')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('cancer-registry-reporting',
      'ONC 170.315.f.4 - /cancer-registry-reporting route reachable');
    takeScreenshot(browser, 'regulatory-updates_170.315.f.4_cancer-registry.png', '170.315.f.4');
  },

  '04. VALIDATE - cancer case data validation responds': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      var caseData = {
        patientId: patientFhirId,
        condition: {
          coding: [{ system: 'http://snomed.info/sct', code: '254837009', display: 'Malignant neoplasm of breast' }]
        },
        diagnosisDate: '2026-05-01'
      };
      Meteor.call('cancerRegistry.validateCaseData', caseData, function (err, result) {
        done({ ok: !err, error: err ? (err.reason || err.message) : null, result: result || null });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[f.4] validateCaseData:', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.f.4 - Cancer case data validation responds (' + JSON.stringify(v.error) + ')');
    });
  },

  '05. TRANSMIT - registry report generation responds': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      Meteor.call('cancerRegistry.generateReport', patientFhirId, function (err, report) {
        done({ ok: !err, error: err ? (err.reason || err.message) : null, hasReport: !!report });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[f.4] generateReport:', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.f.4 - Cancer registry report generation responds');
    });
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.f.4', 'Cancer registry transmission (behavioral)', [
      'Provider auth + patient context',
      '/cancer-registry-reporting surface renders',
      'Case data validation responds',
      'Registry report generation responds'
    ]);
    browser.end();
  }
};
