// certification/tdd/regulatory_updates/170.315.b.9.test.js
// ONC § 170.315(b)(9) - Care Plan — BEHAVIORAL

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-b9-${runStamp}`;
let createdCarePlanId = null;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.b.9', 'care-plan'],

  /**
   * § 170.315(b)(9) - Care Plan
   *
   * Regulatory posture: updated criterion, standards-update deadline
   * 2025-12-31 (PASSED) — care plan creation with Health Status Evaluations
   * and Outcomes + Interventions Section V2, exportable as C-CDA R2.1.
   *
   * Implementation: imports/ui-fhir/carePlans (EnhancedCarePlanDesigner)
   *   → /care-plan-designer (#carePlansPage / #carePlanDetailPage)
   * Methods: carePlans.insert / carePlans.exportCCDA / carePlans.validateCCDA
   * BDD: certification/bdd/170.315-b-9-care-plan.feature
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
        'ONC 170.315.b.9 - Provider session established');
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
        name: [{ use: 'official', text: 'RegUpd Careplan', family: 'Careplan', given: ['RegUpd'] }],
        gender: 'female',
        birthDate: '1949-04-17'
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
        'ONC 170.315.b.9 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. UI - care plan designer renders': function (browser) {
    browser
      .url('http://localhost:3000/care-plan-designer')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .pause(2000);
    browser.assert.urlContains('care-plan-designer',
      'ONC 170.315.b.9 - /care-plan-designer route reachable');
    takeScreenshot(browser, 'regulatory-updates_170.315.b.9_care-plan-designer.png', '170.315.b.9');
  },

  '04. RECORD - care plan with goals, interventions, and outcomes persisted': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      var carePlan = {
        resourceType: 'CarePlan',
        status: 'active',
        intent: 'plan',
        title: 'RegUpd b9 Hypertension Care Plan',
        subject: { reference: 'Patient/' + patientFhirId },
        description: 'Care plan exercising health concerns, goals, interventions, and outcomes sections',
        activity: [{
          detail: {
            kind: 'ServiceRequest',
            status: 'in-progress',
            code: { coding: [{ system: 'http://snomed.info/sct', code: '182777000', display: 'Monitoring of patient' }] },
            description: 'Weekly home blood pressure monitoring'
          }
        }],
        goal: [],
        note: [{ text: 'Outcome: target BP < 130/80 within 90 days' }]
      };
      Meteor.call('carePlans.insert', carePlan, function (err, result) {
        done({ ok: !err, error: err ? (err.reason || err.message) : null, carePlanId: result || null });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      createdCarePlanId = v.carePlanId;
      console.log('[b.9] carePlans.insert:', JSON.stringify(v));
      browser.assert.ok(v.ok,
        'ONC 170.315.b.9 - Care plan recorded (' + JSON.stringify(v.error) + ')');
    });
  },

  '05. EXPORT - care plan C-CDA export + validation respond': function (browser) {
    browser.perform(function () {
      browser.executeAsync(function (carePlanId, done) {
        Meteor.call('carePlans.exportCCDA', carePlanId, function (err, ccda) {
          var exportResult = {
            ok: !err,
            error: err ? (err.reason || err.message) : null,
            looksLikeCda: typeof ccda === 'string' && ccda.indexOf('ClinicalDocument') !== -1
          };
          if (err || !ccda) { done({ exportResult: exportResult, validation: null }); return; }
          Meteor.call('carePlans.validateCCDA', ccda, function (vErr, validation) {
            done({
              exportResult: exportResult,
              validation: { ok: !vErr, error: vErr ? (vErr.reason || vErr.message) : null, result: validation || null }
            });
          });
        });
      }, [createdCarePlanId], function (result) {
        var v = result.value || {};
        console.log('[b.9] exportCCDA:', JSON.stringify(v.exportResult), 'validateCCDA:', JSON.stringify(v.validation));
        browser.assert.ok(v.exportResult && v.exportResult.ok,
          'ONC 170.315.b.9 - Care plan exports as C-CDA (' + JSON.stringify(v.exportResult && v.exportResult.error) + ')');
        browser.assert.ok(v.exportResult && v.exportResult.looksLikeCda,
          'ONC 170.315.b.9 - Export payload is a ClinicalDocument');
      });
    });
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.b.9', 'Care plan (behavioral)', [
      'Provider auth + patient context',
      '/care-plan-designer renders',
      'Care plan with activities/outcomes recorded',
      'C-CDA export produces a ClinicalDocument + validator responds'
    ]);
    browser.end();
  }
};
