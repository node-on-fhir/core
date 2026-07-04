// certification/tdd/base_ehr/170.315.b.4.test.js
// ONC § 170.315(b)(4) - Real-Time Prescription Benefit — BEHAVIORAL

// Import helpers
const { loginAsProvider } = require('../helpers/authentication-helper');
const {
  verifyPageLoaded,
  takeScreenshot,
  logTestCompletion,
  verifyCapability
} = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

// Suite-level state shared across steps (Nightwatch runs steps in order)
const runStamp = Date.now();
const testPatientFhirId = `baseehr-b4-${runStamp}`;

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.b.4', 'rtpb', 'prescription-benefit'],

  /**
   * § 170.315(b)(4) - Real-Time Prescription Benefit (RTPB)
   *
   * OVERVIEW:
   * Behavioral verification of the RTPB workflow: compose an RTPBRequest for a
   * prescribed product, transact it against a benefit responder, and receive
   * an RTPBResponse carrying patient cost and therapeutic alternatives.
   *
   * Flow:
   *   1. Provider signs in; test patient created + selected.
   *   2. UI — /prescription-benefit renders the RTPB composer (rich element-id
   *      surface: drug picker, NDC/RxNorm, quantity/days-supply, responder
   *      select, request/response XML panes, history table).
   *   3. CONFIG — prescriptionBenefit.getConfig returns the responder registry
   *      (mock PBM formulary + inventory responders); getStatus active.
   *   4. TRANSACT — prescriptionBenefit.submitRequest composes NCPDP-style
   *      request XML, obtains an RTPBResponse (mock PBM), persists BOTH halves
   *      (PrescriptionBenefitRequest/Response collections), and returns
   *      request/response JSON + XML. Assertions: XML wire formats, request/
   *      response linkage, patient pay amount, cheaper therapeutic
   *      alternatives for a brand drug (Lipitor → generic statins).
   *   5. ACCESS — the page's transaction history (publication
   *      prescriptionBenefit.transactions) shows the completed check.
   *
   * REGULATORY CONTEXT:
   * (b)(4) RTPB is an HTI-4 criterion with a compliance date of 1/1/2028
   * (FUTURE). Per fable/baseehr-ralph/PROGRESS.md this test verifies the
   * CURRENT baseline; absent future-dated specifics (e.g., final NCPDP RTPB
   * standard version binding) are INFORMATIONAL, not gaps. The module already
   * supports a configurable live endpoint (settings.private.prescriptionBenefit)
   * alongside its certification-evidence mock responders.
   *
   * IMPORTANT NOTES:
   * - Server boot per fable/baseehr-ralph/CONTEXT.md (EXTRA_WORKFLOWS incl.
   *   @node-on-fhir/prescription-benefit).
   * - Methods: npmPackages/prescription-benefit/server/methods.js
   * - UI: /prescription-benefit (#prescriptionBenefitPage)
   */

  before: function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .windowSize('current', 1400, 900)
      .pause(3000); // allow DEV_AUTO_LOGIN to complete
  },

  '01. Provider authenticated': function (browser) {
    browser.executeAsync(function (creds, done) {
      if (typeof Meteor !== 'undefined' && Meteor.userId()) {
        done({ loggedIn: true, via: 'existing-session', userId: Meteor.userId() });
        return;
      }
      Meteor.loginWithPassword(creds.username, creds.password, function (err) {
        done({
          loggedIn: !err && !!Meteor.userId(),
          via: 'loginWithPassword',
          userId: Meteor.userId ? Meteor.userId() : null,
          error: err ? (err.reason || err.message) : null
        });
      });
    }, [{ username: 'demouser', password: 'password2025' }], function (result) {
      browser.assert.ok(
        result.value && result.value.loggedIn,
        'ONC 170.315.b.4 - Provider session established (' + JSON.stringify(result.value) + ')'
      );
    });

    // Fallback path for environments without DEV_AUTO_LOGIN
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Test patient created and selected (patient context)': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{
          use: 'official',
          text: 'BaseEHR RtpbCheck',
          family: 'RtpbCheck',
          given: ['BaseEHR']
        }],
        gender: 'male',
        birthDate: '1948-08-08'
      }, function (insertErr, mongoId) {
        if (insertErr) {
          done({ ok: false, stage: 'insert', error: insertErr.message });
          return;
        }
        Meteor.call('patients.findOne', mongoId, function (findErr, patient) {
          if (findErr || !patient) {
            done({ ok: false, stage: 'findOne', error: findErr ? findErr.message : 'not found' });
            return;
          }
          Session.set('selectedPatientId', patient.id);
          Session.set('selectedPatient', patient);
          done({ ok: true, mongoId: mongoId, fhirId: patient.id });
        });
      });
    }, [testPatientFhirId], function (result) {
      browser.assert.ok(
        result.value && result.value.ok,
        'ONC 170.315.b.4 - Test patient created + Session context set (' +
          JSON.stringify(result.value) + ')'
      );
    });

    browser.pause(500);
  },

  '03. RTPB composer UI renders with full element surface': function (browser) {
    browser.execute(function () {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/prescription-benefit');
        return { navigated: 'Meteor.navigate' };
      }
      window.location.href = '/prescription-benefit';
      return { navigated: 'location.href' };
    }, [], function (result) {
      console.log('[b.4] navigation via', result.value.navigated);
    });

    browser
      .waitForElementVisible('#prescriptionBenefitPage', TIMEOUTS.extended)
      .pause(2000);

    verifyPageLoaded(browser, '170.315.b.4');

    verifyCapability(browser, {
      selectors: ['#prescriptionBenefitDrugPicker'],
      criterion: '170.315.b.4',
      capability: 'Drug picker'
    });
    verifyCapability(browser, {
      selectors: ['#prescriptionBenefitRxNorm'],
      criterion: '170.315.b.4',
      capability: 'RxNorm product field'
    });
    verifyCapability(browser, {
      selectors: ['#prescriptionBenefitQuantity'],
      criterion: '170.315.b.4',
      capability: 'Quantity field'
    });
    verifyCapability(browser, {
      selectors: ['#prescriptionBenefitDaysSupply'],
      criterion: '170.315.b.4',
      capability: 'Days-supply field'
    });
    verifyCapability(browser, {
      selectors: ['#prescriptionBenefitResponderSelect'],
      criterion: '170.315.b.4',
      capability: 'Benefit responder selection'
    });
    verifyCapability(browser, {
      selectors: ['#prescriptionBenefitSubmitButton'],
      criterion: '170.315.b.4',
      capability: 'Benefit check submission'
    });
  },

  '04. Responder registry and module status': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('prescriptionBenefit.getStatus', function (statusErr, status) {
        if (statusErr) { done({ ok: false, error: statusErr.message }); return; }
        Meteor.call('prescriptionBenefit.getConfig', function (cfgErr, cfg) {
          if (cfgErr) { done({ ok: false, error: cfgErr.message }); return; }
          done({
            ok: true,
            status: status.status,
            responderCount: (cfg.responders || []).length,
            responderTypes: (cfg.responders || []).map(function (r) { return r.type; }),
            defaultResponderId: cfg.defaultResponderId,
            mode: cfg.mode
          });
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok && v.status === 'active', 'ONC 170.315.b.4 - RTPB module active');
      browser.assert.ok(
        v.responderCount >= 2,
        'ONC 170.315.b.4 - Responder registry populated (' + v.responderCount + ' responders: ' + v.responderTypes + ')'
      );
      browser.assert.ok(
        v.responderTypes.indexOf('formulary') !== -1,
        'ONC 170.315.b.4 - Formulary (PBM) responder available'
      );
      browser.assert.ok(
        !!v.defaultResponderId,
        'ONC 170.315.b.4 - Default responder selection (' + v.defaultResponderId + ', mode: ' + v.mode + ')'
      );
    });
  },

  '05. TRANSACT: RTPB request → response with cost + alternatives': function (browser) {
    browser.timeouts('script', TIMEOUTS.maximum, function () {});

    browser.executeAsync(function (params, done) {
      Meteor.call('prescriptionBenefit.submitRequest', {
        transactionType: 'RTPBRequest',
        patient: {
          id: params.patientId,
          firstName: 'BaseEHR',
          lastName: 'RtpbCheck',
          dob: '1948-08-08',
          gender: 'male'
        },
        // Brand statin — mock PBM prices generics far lower, so the response
        // should carry cheaper therapeutic alternatives.
        product: { rxnorm: '153165', ndc: '00006075554', display: 'Lipitor 20 MG Oral Tablet' },
        quantity: 30,
        daysSupply: 30,
        payer: { name: 'Sample PBM Plan', memberId: 'MEM-' + params.patientId },
        pharmacy: { name: 'Community Pharmacy' },
        prescriber: { name: 'Dr. Demo User', npi: '1234567893' }
      }, {}, function (err, result) {
        if (err) { done({ ok: false, error: err.message }); return; }
        done({
          ok: true,
          requestId: result.requestId,
          responseId: result.responseId,
          linkage: result.responseJson && result.responseJson.requestId,
          responderType: result.responderType,
          requestXmlHead: (result.requestXml || '').substring(0, 200),
          responseXmlHead: (result.responseXml || '').substring(0, 200),
          requestHasRxnorm: (result.requestXml || '').indexOf('153165') !== -1,
          summary: result.summary,
          alternatives: ((result.responseJson || {}).alternatives || []).map(function (a) {
            return { display: a.display, patientPayAmount: a.patientPayAmount };
          }),
          requestedPay: result.responseJson && result.responseJson.requested &&
                        result.responseJson.requested.patientPayAmount
        });
      });
    }, [{ patientId: testPatientFhirId }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.b.4 - TRANSACT: submitRequest completed (' + JSON.stringify(v.error || '') + ')');
      browser.assert.ok(
        !!v.requestId && !!v.responseId && v.linkage === v.requestId,
        'ONC 170.315.b.4 - Request and response persisted with linkage (requestId ↔ responseJson.requestId)'
      );
      browser.assert.ok(
        v.requestXmlHead.indexOf('RTPBRequest') !== -1 && v.requestHasRxnorm,
        'ONC 170.315.b.4 - NCPDP-style RTPBRequest XML rendered with product RxNorm'
      );
      browser.assert.ok(
        v.responseXmlHead.indexOf('RTPBResponse') !== -1,
        'ONC 170.315.b.4 - RTPBResponse XML returned'
      );
      browser.assert.ok(
        v.responderType === 'formulary',
        'ONC 170.315.b.4 - Response produced by formulary (PBM) responder'
      );
      var pay = (v.summary && v.summary.requestedPatientPay);
      if (pay === null || pay === undefined) { pay = v.requestedPay; }
      browser.assert.ok(
        typeof pay === 'number',
        'ONC 170.315.b.4 - Patient-specific cost returned (patient pay: ' + pay + ')'
      );
      browser.assert.ok(
        v.alternatives.length >= 1,
        'ONC 170.315.b.4 - Therapeutic alternatives returned for brand drug (' +
          v.alternatives.length + ': ' + JSON.stringify(v.alternatives.slice(0, 3)) + ')'
      );
    });
  },

  '06. ACCESS: transaction history shows the completed benefit check': function (browser) {
    // The page subscribes to prescriptionBenefit.transactions(selectedPatientId).
    // The history table renders only on the History tab (tab index 2).
    browser.pause(2000);

    browser.execute(function () {
      var tabs = document.querySelectorAll('[role="tab"]');
      for (var i = 0; i < tabs.length; i++) {
        if (/history/i.test(tabs[i].textContent)) { tabs[i].click(); return { clicked: true }; }
      }
      return { clicked: false, tabCount: tabs.length };
    }, [], function (result) {
      browser.assert.ok(result.value.clicked, 'ONC 170.315.b.4 - History tab opened');
    });

    browser.pause(2000);

    browser.execute(function () {
      var table = document.querySelector('#prescriptionBenefitHistoryTable');
      var text = table ? table.textContent : (document.body.textContent || '');
      return {
        tablePresent: !!table,
        hasTransaction: text.indexOf('Lipitor') !== -1 ||
                        /completed|formulary|sent/i.test(text)
      };
    }, [], function (result) {
      var v = result.value;
      browser.assert.ok(
        v.tablePresent,
        'ONC 170.315.b.4 - ACCESS: transaction history table rendered'
      );
      browser.assert.ok(
        v.hasTransaction,
        'ONC 170.315.b.4 - ACCESS: completed benefit check visible in history'
      );
    });

    // Informational (NOT a gap): (b)(4) is an HTI-4 criterion effective
    // 1/1/2028; final standard-version binding will be verified closer to the
    // compliance date. Current baseline (request/response, cost, alternatives,
    // live-endpoint capability) demonstrated above.
    browser.perform(function () {
      console.log('[b.4] INFORMATIONAL: HTI-4 compliance date 1/1/2028 — baseline verified; future standard-version binding not yet testable.');
    });
  },

  '07. Cleanup and completion': function (browser) {
    browser.executeAsync(function (patientId, done) {
      Meteor.call('patients.remove', patientId, function (err) {
        done({ patientRemoved: !err, reason: err ? (err.reason || err.message) : 'ok' });
      });
    }, [testPatientFhirId], function (result) {
      console.log('[b.4] cleanup:', JSON.stringify(result.value));
    });

    takeScreenshot(browser, 'base-ehr_170.315.b.4_prescription-benefit.png', '170.315.b.4');

    logTestCompletion(browser, '170.315.b.4', 'Real-Time Prescription Benefit (behavioral)', [
      'RTPB composer UI with drug/quantity/responder controls',
      'Responder registry (formulary PBM + inventory) + module status',
      'TRANSACT: RTPBRequest XML → RTPBResponse XML with linkage',
      'Patient-specific cost + therapeutic alternatives (brand → generics)',
      'ACCESS: persisted transaction visible in history',
      'INFORMATIONAL: HTI-4 1/1/2028 standard-version binding pending'
    ]);

    browser.end();
  }
};
