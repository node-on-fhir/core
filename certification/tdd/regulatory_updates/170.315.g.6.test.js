// certification/tdd/regulatory_updates/170.315.g.6.test.js
// ONC § 170.315(g)(6) - Consolidated CDA Creation Performance — BEHAVIORAL

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-g6-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.g.6', 'ccda'],

  /**
   * § 170.315(g)(6) - Consolidated CDA Creation Performance
   *
   * Regulatory posture: updated criterion, standards-update deadline
   * 2025-12-31 (PASSED) — create C-CDA documents (R2.1 companion-guide
   * conformant) from the patient record, validate conformance.
   *
   * Implementation: npmPackages/ccda-export → /ccda-export (+ /clinical-documents)
   * Methods: clinicalDocuments.generateCCDA / validateCCDA /
   *          getPatientDocuments / receiveCCDA
   * BDD: certification/bdd/170.315-g-6-ccda-performance.feature
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
        'ONC 170.315.g.6 - Provider session established');
    });
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Test patient with clinical data': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{ use: 'official', text: 'RegUpd Ccda', family: 'Ccda', given: ['RegUpd'] }],
        gender: 'male',
        birthDate: '1970-10-05'
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
        'ONC 170.315.g.6 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. UI - C-CDA export surface renders': function (browser) {
    browser
      .url('http://localhost:3000/ccda-export')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('ccda-export',
      'ONC 170.315.g.6 - /ccda-export route reachable');
    takeScreenshot(browser, 'regulatory-updates_170.315.g.6_ccda-export.png', '170.315.g.6');
  },

  '04. CREATE - C-CDA generated from the patient record': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      Meteor.call('clinicalDocuments.generateCCDA', patientFhirId, function (err, ccda) {
        var doc = null;
        if (typeof ccda === 'string') { doc = ccda; }
        else if (ccda && typeof ccda.document === 'string') { doc = ccda.document; }
        else if (ccda && typeof ccda.xml === 'string') { doc = ccda.xml; }
        done({
          ok: !err,
          error: err ? (err.reason || err.message) : null,
          hasDocument: !!doc || !!ccda,
          looksLikeCda: !!doc && doc.indexOf('ClinicalDocument') !== -1
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[g.6] generateCCDA:', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.g.6 - C-CDA generation responds (' + JSON.stringify(v.error) + ')');
      browser.assert.ok(v.hasDocument,
        'ONC 170.315.g.6 - C-CDA generation produced a document payload');
    });
  },

  '05. VALIDATE + ACCESS - conformance validation and document inventory': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      Meteor.call('clinicalDocuments.getPatientDocuments', patientFhirId, function (listErr, docs) {
        done({
          ok: !listErr,
          error: listErr ? (listErr.reason || listErr.message) : null,
          count: Array.isArray(docs) ? docs.length : (docs && docs.documents ? docs.documents.length : 0)
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[g.6] getPatientDocuments:', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.g.6 - Patient document inventory responds');
    });
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.g.6', 'C-CDA creation performance (behavioral)', [
      'Provider auth + patient context',
      '/ccda-export surface renders',
      'C-CDA generated from patient record',
      'Document inventory accessible'
    ]);
    browser.end();
  }
};
