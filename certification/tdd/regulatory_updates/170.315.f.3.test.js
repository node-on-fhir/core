// certification/tdd/regulatory_updates/170.315.f.3.test.js
// ONC § 170.315(f)(3) - Reportable Laboratory Tests and Values/Results — BEHAVIORAL

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-f3-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.f.3', 'lab-reporting', 'public-health'],

  /**
   * § 170.315(f)(3) - Transmission to Public Health Agencies:
   * Reportable Laboratory Tests and Values/Results
   *
   * Regulatory posture: updated criterion, minimum-standard code-set deadline
   * 2025-12-31 (PASSED) — LOINC/SNOMED CT code sets for HL7 v2.5.1 ELR.
   *
   * Implementation: npmPackages/lab-test-reporting → /lab-test-reporting
   * Methods: labTestReporting.generateReport / submitToAgency /
   *          validateReportableTest / getReportingStatus
   * Package-level precedent: npmPackages/lab-test-reporting/tests/nightwatch/170.315.f.3.test.js
   * BDD: certification/bdd/170.315-f-3-reportable-laboratory.feature
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
        'ONC 170.315.f.3 - Provider session established');
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
        name: [{ use: 'official', text: 'RegUpd Elr', family: 'Elr', given: ['RegUpd'] }],
        gender: 'female',
        birthDate: '1991-07-07'
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
        'ONC 170.315.f.3 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. UI - lab test reporting surface renders': function (browser) {
    browser
      .url('http://localhost:3000/lab-test-reporting')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('lab-test-reporting',
      'ONC 170.315.f.3 - /lab-test-reporting route reachable');
    takeScreenshot(browser, 'regulatory-updates_170.315.f.3_lab-reporting.png', '170.315.f.3');
  },

  '04. DETECT - reportable test recognition (LOINC-coded)': function (browser) {
    browser.executeAsync(function (done) {
      // LOINC 94500-6: SARS-CoV-2 RNA NAA+probe — canonical reportable result.
      Meteor.call('labTestReporting.validateReportableTest', { system: 'http://loinc.org', code: '94500-6' }, function (err, result) {
        done({ ok: !err, error: err ? (err.reason || err.message) : null, result: result || null });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[f.3] validateReportableTest(94500-6):', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.f.3 - Reportable-test recognition responds (' + JSON.stringify(v.error) + ')');
    });
  },

  '05. TRANSMIT - report generation + agency reporting status respond': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      Meteor.call('labTestReporting.generateReport', patientFhirId, function (genErr, report) {
        var gen = { ok: !genErr, error: genErr ? (genErr.reason || genErr.message) : null, hasReport: !!report };
        Meteor.call('labTestReporting.getReportingStatus', function (stErr, status) {
          done({
            generate: gen,
            status: { ok: !stErr, error: stErr ? (stErr.reason || stErr.message) : null }
          });
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[f.3] generateReport:', JSON.stringify(v.generate), 'reportingStatus:', JSON.stringify(v.status));
      browser.assert.ok(v.generate && v.generate.ok,
        'ONC 170.315.f.3 - ELR report generation responds');
      browser.assert.ok(v.status && v.status.ok,
        'ONC 170.315.f.3 - Agency reporting status responds');
    });
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.f.3', 'Reportable laboratory transmission (behavioral)', [
      'Provider auth + patient context',
      '/lab-test-reporting surface renders',
      'LOINC reportable-test recognition responds',
      'Report generation + reporting status respond'
    ]);
    browser.end();
  }
};
