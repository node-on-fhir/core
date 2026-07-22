// certification/tdd/regulatory_updates/170.315.g.32.test.js
// ONC § 170.315(g)(32) - Prior Auth API: Documentation Templates and Rules — GAP PUNCH-LIST

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-g32-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.g.32', 'prior-auth', 'dtr', 'hti-4', 'gap'],

  /**
   * § 170.315(g)(32) - Provider Prior Authorization API:
   * Documentation Templates and Rules (HTI-4 NEW criterion)
   *
   * Standard: HL7 Da Vinci DTR IG (SDC Questionnaires + embedded CQL).
   *
   * STATUS: NOT IMPLEMENTED (2026-07 scan). Generic SDC rendering exists in
   * npmPackages/structured-data-capture and SHOULD be reused for the form
   * surface; the DTR-specific operations do not exist. This test is the
   * documented-gap punch list / implementation contract.
   *
   * IMPLEMENTATION CONTRACT:
   *   - settings.private.priorAuth.dtr.serverUrl (mock payer package service
   *     when unset)
   *   - Meteor method 'priorAuth.dtr.questionnairePackage' (context:
   *     { orderId | order, coverage }) → payer Questionnaire package
   *     (Bundle with Questionnaire + population logic)
   *   - Meteor method 'priorAuth.dtr.populate' (questionnaire, patientId) →
   *     pre-populated QuestionnaireResponse (in-progress), answers traceable
   *     to source data
   *   - completed QuestionnaireResponse persisted (QuestionnaireResponses
   *     collection) linked to order + coverage, retrievable for PAS (g)(33)
   *
   * BDD: certification/bdd/170.315-g-32-prior-auth-documentation-templates-rules.feature
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
        'ONC 170.315.g.32 - Provider session established');
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
        name: [{ use: 'official', text: 'RegUpd Dtr', family: 'Dtr', given: ['RegUpd'] }],
        gender: 'female',
        birthDate: '1957-05-19'
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
        'ONC 170.315.g.32 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. SUBSTRATE - SDC questionnaire rendering exists (should pass today)': function (browser) {
    // The structured-data-capture package is the rendering substrate DTR
    // reuses. Its absence would deepen the gap; its presence is asserted.
    browser.executeAsync(function (done) {
      var reg = (typeof Package !== 'undefined' && Package['@node-on-fhir/structured-data-capture']) ? true : false;
      var col = !!(Meteor.Collections && (Meteor.Collections.Questionnaires || Meteor.Collections.QuestionnaireResponses));
      done({ packageRegistered: reg, questionnaireCollections: col });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[g.32] SDC substrate:', JSON.stringify(v));
      browser.assert.ok(v.packageRegistered || v.questionnaireCollections,
        'ONC 170.315.g.32 - SDC questionnaire substrate present (structured-data-capture / Questionnaire collections)');
    });
  },

  '04. RETRIEVE - questionnaire package operation (GAP until implemented)': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      var context = {
        order: {
          resourceType: 'ServiceRequest',
          status: 'draft',
          intent: 'order',
          subject: { reference: 'Patient/' + patientFhirId },
          code: { coding: [{ system: 'http://www.ama-assn.org/go/cpt', code: '70551', display: 'MRI brain without contrast' }] }
        }
      };
      Meteor.call('priorAuth.dtr.questionnairePackage', context, function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          ok: !err,
          error: msg || null,
          hasQuestionnaire: !!(result && JSON.stringify(result).indexOf('Questionnaire') !== -1)
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[g.32] dtr.questionnairePackage probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.g.32): priorAuth.dtr.questionnairePackage not implemented — payer documentation templates cannot be retrieved');
      } else {
        browser.assert.ok(v.ok && v.hasQuestionnaire,
          'ONC 170.315.g.32 - Questionnaire package retrieval returns a Questionnaire');
      }
    });
  },

  '05. POPULATE - CQL pre-population from the patient record (GAP until implemented)': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      Meteor.call('priorAuth.dtr.populate', { questionnaireId: 'demo-prior-auth-questionnaire', patientId: patientFhirId }, function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          ok: !err,
          error: msg || null,
          isQuestionnaireResponse: !!(result && result.resourceType === 'QuestionnaireResponse')
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[g.32] dtr.populate probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.g.32): priorAuth.dtr.populate not implemented — no CQL/FHIR-query pre-population of payer questionnaires from the patient record');
      } else {
        browser.assert.ok(v.ok && v.isQuestionnaireResponse,
          'ONC 170.315.g.32 - Pre-population returns an in-progress QuestionnaireResponse');
      }
    });
    takeScreenshot(browser, 'regulatory-updates_170.315.g.32_dtr.png', '170.315.g.32');
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.g.32', 'Prior auth DTR (gap punch-list)', [
      'Provider auth + patient context',
      'SDC rendering substrate present (structured-data-capture)',
      'GAP (red): $questionnaire-package retrieval missing',
      'GAP (red): CQL pre-population missing',
      'Contract: priorAuth.dtr.questionnairePackage / populate + QuestionnaireResponse persistence'
    ]);
    browser.end();
  }
};
