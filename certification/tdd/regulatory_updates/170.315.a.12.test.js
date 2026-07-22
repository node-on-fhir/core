// certification/tdd/regulatory_updates/170.315.a.12.test.js
// ONC § 170.315(a)(12) - Family Health History — BEHAVIORAL

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-a12-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.a.12', 'family-health-history'],

  /**
   * § 170.315(a)(12) - Family Health History
   *
   * Regulatory posture: updated criterion, minimum-standard code-set deadline
   * 2025-12-31 (PASSED) — the module must record family health history using
   * the updated SNOMED CT code sets and remain accessible/exportable.
   *
   * Implementation: npmPackages/family-health-history → /family-health-history
   * Methods: familyHistory.generateFamilyTree / analyzeHealthPatterns /
   *          exportReport / validateUSCore
   * BDD: certification/bdd/170.315-a-12-family-health-history.feature
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
      if (typeof Meteor !== 'undefined' && Meteor.userId()) {
        done({ loggedIn: true, via: 'existing-session' });
        return;
      }
      Meteor.loginWithPassword(creds.username, creds.password, function (err) {
        done({ loggedIn: !err && !!Meteor.userId(), error: err ? (err.reason || err.message) : null });
      });
    }, [{ username: 'demouser', password: 'password2025' }], function (result) {
      browser.assert.ok(result.value && result.value.loggedIn,
        'ONC 170.315.a.12 - Provider session established (' + JSON.stringify(result.value) + ')');
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
        name: [{ use: 'official', text: 'RegUpd FamilyHx', family: 'FamilyHx', given: ['RegUpd'] }],
        gender: 'female',
        birthDate: '1972-03-14'
      }, function (insertErr, mongoId) {
        if (insertErr) { done({ ok: false, error: insertErr.message }); return; }
        Meteor.call('patients.findOne', mongoId, function (findErr, patient) {
          if (findErr || !patient) { done({ ok: false, error: 'patient lookup failed' }); return; }
          Session.set('selectedPatientId', patient.id);
          Session.set('selectedPatient', patient);
          done({ ok: true, patientId: patient.id });
        });
      });
    }, [testPatientFhirId], function (result) {
      browser.assert.ok(result.value && result.value.ok,
        'ONC 170.315.a.12 - Test patient created + selected (' + JSON.stringify(result.value) + ')');
    });
    browser.pause(1000);
  },

  '03. RECORD - FamilyMemberHistory persisted for the patient': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      var fmh = {
        resourceType: 'FamilyMemberHistory',
        status: 'completed',
        patient: { reference: 'Patient/' + patientFhirId },
        relationship: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode', code: 'MTH', display: 'mother' }] },
        condition: [{
          code: { coding: [{ system: 'http://snomed.info/sct', code: '73211009', display: 'Diabetes mellitus' }] },
          onsetAge: { value: 52, unit: 'a' }
        }]
      };
      // Prefer a package/method write path; fall back to direct collection insert
      var col = (Meteor.Collections && Meteor.Collections.FamilyMemberHistories) || null;
      if (col) {
        var _id = col.insert ? col.insert(fmh) : null;
        done({ ok: !!_id, via: 'collection', _id: _id });
      } else {
        done({ ok: false, error: 'FamilyMemberHistories collection not registered' });
      }
    }, [testPatientFhirId], function (result) {
      browser.assert.ok(result.value && result.value.ok,
        'ONC 170.315.a.12 - FamilyMemberHistory recorded with SNOMED CT coded condition (' + JSON.stringify(result.value) + ')');
    });
  },

  '04. ACCESS - family health history UI renders': function (browser) {
    browser
      .url('http://localhost:3000/family-health-history')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('family-health-history',
      'ONC 170.315.a.12 - /family-health-history route reachable');
    takeScreenshot(browser, 'regulatory-updates_170.315.a.12_family-health-history.png', '170.315.a.12');
  },

  '05. ANALYZE - family tree generation + US Core validation methods respond': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      Meteor.call('familyHistory.generateFamilyTree', patientFhirId, function (err, tree) {
        var treeResult = { ok: !err, error: err ? (err.reason || err.message) : null, hasData: !!tree };
        Meteor.call('familyHistory.validateUSCore', patientFhirId, function (vErr, validation) {
          done({
            tree: treeResult,
            validate: { ok: !vErr, error: vErr ? (vErr.reason || vErr.message) : null, result: validation || null }
          });
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[a.12] generateFamilyTree:', JSON.stringify(v.tree), 'validateUSCore:', JSON.stringify(v.validate));
      browser.assert.ok(v.tree && v.tree.ok,
        'ONC 170.315.a.12 - familyHistory.generateFamilyTree responds without error');
      browser.assert.ok(v.validate && v.validate.ok,
        'ONC 170.315.a.12 - familyHistory.validateUSCore responds without error');
    });
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.a.12', 'Family Health History (behavioral)', [
      'Provider auth + patient context',
      'FamilyMemberHistory recorded with SNOMED CT coded condition',
      '/family-health-history UI renders',
      'Family tree generation + US Core validation methods respond'
    ]);
    browser.end();
  }
};
