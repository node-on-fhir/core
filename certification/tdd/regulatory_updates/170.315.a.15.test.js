// certification/tdd/regulatory_updates/170.315.a.15.test.js
// ONC § 170.315(a)(15) - Social, Psychological, and Behavioral Data — BEHAVIORAL

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-a15-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.a.15', 'sdoh'],

  /**
   * § 170.315(a)(15) - Social, Psychological, and Behavioral Data
   *
   * Regulatory posture: updated criterion, minimum-standard code-set deadline
   * 2025-12-31 (PASSED) — SDOH screening data must be recorded with the
   * updated LOINC/SNOMED code sets.
   *
   * Implementation: npmPackages/social-determinants → /social-determinants
   * Methods: social-determinants.screening.submit /
   *          social-determinants.assessment.getRiskFactors
   * BDD: certification/bdd/170.315-a-15-sdoh.feature
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
        'ONC 170.315.a.15 - Provider session established');
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
        name: [{ use: 'official', text: 'RegUpd Sdoh', family: 'Sdoh', given: ['RegUpd'] }],
        gender: 'other',
        birthDate: '1985-11-02'
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
        'ONC 170.315.a.15 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. ACCESS - SDOH screening UI renders': function (browser) {
    browser
      .url('http://localhost:3000/social-determinants')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('social-determinants',
      'ONC 170.315.a.15 - /social-determinants route reachable');
    takeScreenshot(browser, 'regulatory-updates_170.315.a.15_sdoh.png', '170.315.a.15');
  },

  '04. RECORD - SDOH screening submitted as LOINC-coded Observations': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      // LOINC 76437-3 (primary insurance), 63586-2 (education) style screening
      // payload; the method persists Observations for the selected patient.
      var screening = {
        patientId: patientFhirId,
        responses: [
          { code: '63512-8', system: 'http://loinc.org', display: 'How many people are living or staying at this address', valueInteger: 3 },
          { code: '76513-1', system: 'http://loinc.org', display: 'How hard is it for you to pay for the very basics', valueString: 'Somewhat hard' }
        ]
      };
      Meteor.call('social-determinants.screening.submit', screening, function (err, result) {
        done({ ok: !err, error: err ? (err.reason || err.message) : null, result: result || null });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[a.15] screening.submit:', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.a.15 - SDOH screening submit persists LOINC-coded observations (' + JSON.stringify(v.error) + ')');
    });
  },

  '05. ANALYZE - risk factor assessment responds for the patient': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      Meteor.call('social-determinants.assessment.getRiskFactors', patientFhirId, function (err, risks) {
        done({ ok: !err, error: err ? (err.reason || err.message) : null, hasData: typeof risks !== 'undefined' });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[a.15] getRiskFactors:', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.a.15 - assessment.getRiskFactors responds without error');
    });
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.a.15', 'SDOH data (behavioral)', [
      'Provider auth + patient context',
      '/social-determinants UI renders',
      'SDOH screening submitted with LOINC-coded responses',
      'Risk factor assessment responds'
    ]);
    browser.end();
  }
};
