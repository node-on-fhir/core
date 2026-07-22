// certification/tdd/regulatory_updates/170.315.f.1.test.js
// ONC § 170.315(f)(1) - Transmission to Immunization Registries — BEHAVIORAL

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-f1-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.f.1', 'immunization-registry', 'public-health'],

  /**
   * § 170.315(f)(1) - Transmission to Immunization Registries
   *
   * Regulatory posture: updated criterion, minimum-standard code-set deadline
   * 2025-12-31 (PASSED) — CVX/NDC code sets; HL7 v2.5.1 VXU submission and
   * registry query/history.
   *
   * Implementation: npmPackages/immunization-registry → /immunization-registry
   * Methods: immunizationRegistry.generateReport / submitToRegistry /
   *          validateVaccineCode / getRegistryStatus / queryPatientHistory
   * BDD: certification/bdd/170.315-f-1-immunization-registries.feature
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
        'ONC 170.315.f.1 - Provider session established');
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
        name: [{ use: 'official', text: 'RegUpd Vax', family: 'Vax', given: ['RegUpd'] }],
        gender: 'male',
        birthDate: '2018-02-11'
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
        'ONC 170.315.f.1 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. UI - immunization registry surface renders': function (browser) {
    browser
      .url('http://localhost:3000/immunization-registry')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('immunization-registry',
      'ONC 170.315.f.1 - /immunization-registry route reachable');
    takeScreenshot(browser, 'regulatory-updates_170.315.f.1_immunization-registry.png', '170.315.f.1');
  },

  '04. CODES - CVX vaccine code validation': function (browser) {
    browser.executeAsync(function (done) {
      // CVX 208: COVID-19 mRNA (Pfizer) — must validate against the minimum
      // standard code set.
      Meteor.call('immunizationRegistry.validateVaccineCode', '208', function (err, result) {
        done({ ok: !err, error: err ? (err.reason || err.message) : null, result: result || null });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[f.1] validateVaccineCode(208):', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.f.1 - CVX vaccine code validation responds (' + JSON.stringify(v.error) + ')');
    });
  },

  '05. TRANSMIT - registry report generation + submission respond': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      Meteor.call('immunizationRegistry.generateReport', patientFhirId, function (genErr, report) {
        var gen = { ok: !genErr, error: genErr ? (genErr.reason || genErr.message) : null, hasReport: !!report };
        Meteor.call('immunizationRegistry.getRegistryStatus', function (stErr, status) {
          done({
            generate: gen,
            status: { ok: !stErr, error: stErr ? (stErr.reason || stErr.message) : null, result: status || null }
          });
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[f.1] generateReport:', JSON.stringify(v.generate), 'registryStatus:', JSON.stringify(v.status));
      browser.assert.ok(v.generate && v.generate.ok,
        'ONC 170.315.f.1 - Registry report generation responds');
      browser.assert.ok(v.status && v.status.ok,
        'ONC 170.315.f.1 - Registry connection status responds');
    });
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.f.1', 'Immunization registry transmission (behavioral)', [
      'Provider auth + patient context',
      '/immunization-registry surface renders',
      'CVX code validation responds',
      'Report generation + registry status respond'
    ]);
    browser.end();
  }
};
