// certification/tdd/regulatory_updates/170.315.g.33.test.js
// ONC § 170.315(g)(33) - Prior Auth API: Prior Authorization Support — GAP PUNCH-LIST

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

const runStamp = Date.now();
const testPatientFhirId = `regupd-g33-${runStamp}`;

module.exports = {
  tags: ['regulatory-updates', 'onc-certification', '170.315.g.33', 'prior-auth', 'pas', 'hti-4', 'gap'],

  /**
   * § 170.315(g)(33) - Provider Prior Authorization API:
   * Prior Authorization Support (HTI-4 NEW criterion)
   *
   * Standard: HL7 Da Vinci PAS IG (Claim/$submit, Claim/$inquire).
   *
   * STATUS: NOT IMPLEMENTED (2026-07 scan). Claim/ClaimResponse SimpleSchemas
   * exist (imports/lib/schemas/SimpleSchemas/Claims.js) but no operations.
   * This test is the documented-gap punch list / implementation contract.
   *
   * IMPLEMENTATION CONTRACT:
   *   - settings.private.priorAuth.pas.serverUrl (mock payer responder when
   *     unset — approve/deny/pend scripted dispositions for cert evidence)
   *   - Meteor method 'priorAuth.pas.submit' ({ order, patientId,
   *     questionnaireResponseId? }) → assembles the preauthorization Claim
   *     Bundle, invokes Claim/$submit, returns { claimId, disposition,
   *     authorizationNumber?, claimResponse }
   *   - Meteor method 'priorAuth.pas.inquire' (claimId) → current disposition
   *   - request Bundle + ClaimResponse history persisted (Claims /
   *     ClaimResponses collections) and queryable for a pended work queue
   *
   * BDD: certification/bdd/170.315-g-33-prior-auth-support.feature
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
        'ONC 170.315.g.33 - Provider session established');
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
        name: [{ use: 'official', text: 'RegUpd Pas', family: 'Pas', given: ['RegUpd'] }],
        gender: 'male',
        birthDate: '1969-08-08'
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
        'ONC 170.315.g.33 - Test patient created + selected');
    });
    browser.pause(1000);
  },

  '03. SCHEMA - Claim collections registered (substrate check)': function (browser) {
    browser.executeAsync(function (done) {
      done({
        claims: !!(Meteor.Collections && Meteor.Collections.Claims),
        claimResponses: !!(Meteor.Collections && Meteor.Collections.ClaimResponses)
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[g.33] Claim substrate:', JSON.stringify(v));
      if (!v.claims) {
        browser.verify.fail('GAP(170.315.g.33): Claims collection not registered client-side — PAS request Bundles have no persistence surface');
      }
    });
  },

  '04. SUBMIT - Claim/$submit prior authorization (GAP until implemented)': function (browser) {
    browser.executeAsync(function (patientFhirId, done) {
      var request = {
        patientId: patientFhirId,
        order: {
          resourceType: 'ServiceRequest',
          status: 'draft',
          intent: 'order',
          subject: { reference: 'Patient/' + patientFhirId },
          code: { coding: [{ system: 'http://www.ama-assn.org/go/cpt', code: '70551', display: 'MRI brain without contrast' }] }
        }
      };
      Meteor.call('priorAuth.pas.submit', request, function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          ok: !err,
          error: msg || null,
          disposition: result ? result.disposition : null,
          hasClaimId: !!(result && result.claimId)
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[g.33] pas.submit probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.g.33): priorAuth.pas.submit not implemented — no Claim/$submit prior authorization path exists');
      } else {
        browser.assert.ok(v.ok && v.hasClaimId && v.disposition,
          'ONC 170.315.g.33 - PAS submit returns claimId + disposition');
      }
    });
  },

  '05. TRACK - Claim/$inquire disposition tracking (GAP until implemented)': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('priorAuth.pas.inquire', 'nonexistent-claim-id', function (err, result) {
        var msg = err ? ((err.reason || err.message || '') + ' ' + String(err.error || '')) : '';
        done({
          methodMissing: !!err && /method .*not found|404/i.test(msg),
          controlled: !err || !(/method .*not found|404/i.test(msg)),
          error: msg || null
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[g.33] pas.inquire probe:', JSON.stringify(v));
      if (v.methodMissing) {
        browser.verify.fail('GAP(170.315.g.33): priorAuth.pas.inquire not implemented — pended authorizations cannot be tracked');
      } else {
        browser.assert.ok(v.controlled,
          'ONC 170.315.g.33 - PAS inquire responds in a controlled way for unknown claims');
      }
    });
    takeScreenshot(browser, 'regulatory-updates_170.315.g.33_pas.png', '170.315.g.33');
  },

  '06. Completion': function (browser) {
    logTestCompletion(browser, '170.315.g.33', 'Prior auth PAS (gap punch-list)', [
      'Provider auth + patient context',
      'Substrate: Claims/ClaimResponses registration checked',
      'GAP (red): Claim/$submit missing',
      'GAP (red): Claim/$inquire disposition tracking missing',
      'Contract: priorAuth.pas.submit / inquire + settings.private.priorAuth.pas'
    ]);
    browser.end();
  }
};
