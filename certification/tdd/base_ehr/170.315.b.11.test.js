// certification/tdd/base_ehr/170.315.b.11.test.js
// ONC § 170.315(b)(11) - Decision Support Interventions — BEHAVIORAL
//
// NOTE: this file REPLACES the previous 170.315.b.11.test.js, which was a
// presence-level placeholder (page/vocabulary checks with security/audit
// leanings) rather than a behavioral DSI test. Under CY2026, (b)(11) DSI is
// in the Base EHR definition ((a)(9) expired 1/1/2025). The swap is recorded
// in fable/baseehr-ralph/PROGRESS.md.

// Import helpers
const { loginAsProvider } = require('../helpers/authentication-helper');
const {
  verifyPageLoaded,
  takeScreenshot,
  logTestCompletion
} = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

// Suite-level state shared across steps (Nightwatch runs steps in order)
const runStamp = Date.now();
const testPatientFhirId = `baseehr-b11-${runStamp}`;
const interventionId = `baseehr-b11-dsi-${runStamp}`;
const DSI_TITLE = 'CT contrast caution in patients 50+ (BaseEHR test DSI)';

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.b.11', 'decision-support', 'dsi'],

  /**
   * § 170.315(b)(11) - Decision Support Interventions
   *
   * OVERVIEW:
   * Behavioral verification of the DSI criterion using the decision-support
   * workflow package (DSIs modeled as FHIR PlanDefinition eca-rules):
   *
   * - (iii) CONFIGURE: a limited-set user (role gate:
   *   settings.private.decisionSupport.allowedUserIds; dev default any
   *   logged-in user) authors an evidence-based DSI with plain-language
   *   SOURCE ATTRIBUTES (developer, bibliographic citation, funding source,
   *   release/revision date) and activates it.
   * - (i)/(iii)(A) FIRE: decisionSupport.evaluate(context) evaluates the DSI
   *   against the ORDER (imaging ServiceRequest) + the patient DATA BUNDLE
   *   built from real collections (demographics/problems/medications/
   *   allergies/labs/vitals/devices/procedures). Demographics-based criteria
   *   (age ≥ 50, sex = male) fire for the test patient.
   * - (ii) SOURCE ATTRIBUTES accessible at firing time: each match carries
   *   its sourceAttributes; policy readable via getSourceAttributePolicy.
   * - (ii)(C) FEEDBACK LOOP: recordFeedback captures user action + comments;
   *   exportFeedback returns computable rows + NDJSON.
   * - UI: /decision-support renders catalog/firing/feedback surfaces.
   *
   * REGULATORY / VERSION NOTES:
   * - DSI Privacy & Security update is due 12/31/2027 (FUTURE) — its absence
   *   is INFORMATIONAL, not a gap (PROGRESS.md → regulatory deadlines).
   * - Sample seeding is settings-gated (private.decisionSupport.seedSamples,
   *   default off) — the settings-gated pattern working as designed; this
   *   test AUTHORS its own DSI instead of seeding.
   *
   * IMPORTANT NOTES:
   * - Server boot per fable/baseehr-ralph/CONTEXT.md (EXTRA_WORKFLOWS incl.
   *   @node-on-fhir/decision-support).
   * - Methods: npmPackages/decision-support/server/methods.js
   * - Criteria model: npmPackages/decision-support/lib/criteria.js
   * - UI: /decision-support (#decisionSupportPage)
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
        'ONC 170.315.b.11 - Provider session established (' + JSON.stringify(result.value) + ')'
      );
    });

    // Fallback path for environments without DEV_AUTO_LOGIN
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Test patient created (demographics feed the DSI data bundle)': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{
          use: 'official',
          text: 'BaseEHR DsiFire',
          family: 'DsiFire',
          given: ['BaseEHR']
        }],
        gender: 'male',
        birthDate: '1948-04-04' // age ≥ 50 → demographic criteria fire
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
        'ONC 170.315.b.11 - Test patient created + Session context set (' +
          JSON.stringify(result.value) + ')'
      );
    });

    browser.pause(500);
  },

  '03. CONFIGURE (§ iii): author an evidence-based DSI with source attributes': function (browser) {
    browser.executeAsync(function (params, done) {
      Meteor.call('decisionSupport.upsertIntervention', {
        id: params.id,
        title: params.title,
        name: 'baseehr-b11-test-dsi',
        status: 'draft',
        version: '1.0.0',
        developer: 'BaseEHR Certification Test Suite',
        publisher: 'BaseEHR Certification Test Suite',
        fundingSource: 'Internal QA budget (no external funding)',
        bibliographicCitation: 'ACR Manual on Contrast Media, 2023 edition',
        citationUrl: 'https://www.acr.org/Clinical-Resources/Contrast-Manual',
        releaseDate: '2026-01-01',
        revisionDate: '2026-06-01',
        usesSourceAttributes: [],
        usesDataCategories: ['demographics'],
        criteria: {
          trigger: { categories: ['imaging'] },
          conditions: [
            { type: 'age', op: 'gte', years: 50 },
            { type: 'sex', equals: 'male' }
          ]
        },
        action: {
          title: params.title,
          message: 'Patient is 50 or older: review renal function before contrast-enhanced CT.'
        }
      }, function (upsertErr, upsertResult) {
        if (upsertErr) { done({ ok: false, stage: 'upsert', error: upsertErr.message }); return; }
        Meteor.call('decisionSupport.setInterventionStatus', params.id, 'active', function (statusErr, statusResult) {
          if (statusErr) { done({ ok: false, stage: 'activate', error: statusErr.message }); return; }
          done({ ok: true, id: upsertResult.id, status: statusResult.status });
        });
      });
    }, [{ id: interventionId, title: DSI_TITLE }], function (result) {
      var v = result.value || {};
      browser.assert.ok(
        v.ok && v.id === interventionId && v.status === 'active',
        'ONC 170.315.b.11 - CONFIGURE: DSI authored + activated by permitted user (' + JSON.stringify(v) + ')'
      );
    });

    // Seeding remains settings-gated (feature-disabled unless
    // private.decisionSupport.seedSamples) — verify the gate reports itself.
    browser.executeAsync(function (done) {
      Meteor.call('decisionSupport.getSeedStatus', function (err, status) {
        if (err) { done({ ok: false, error: err.message }); return; }
        done({ ok: true, seedSamplesEnabled: status.seedSamplesEnabled, catalogCount: status.catalogCount });
      });
    }, [], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.b.11 - Seed status readable');
      browser.assert.ok(
        v.catalogCount >= 1,
        'ONC 170.315.b.11 - DSI catalog contains the authored intervention (count: ' + v.catalogCount + ')'
      );
      console.log('[b.11] INFORMATIONAL: seedSamplesEnabled=' + v.seedSamplesEnabled + ' (settings-gated, default off)');
    });
  },

  '04. FIRE (§ i / iii.A): DSI evaluates order + patient data and matches': function (browser) {
    browser.timeouts('script', TIMEOUTS.maximum, function () {});

    browser.executeAsync(function (params, done) {
      Meteor.call('decisionSupport.evaluate', {
        patientId: params.patientId,
        serviceRequest: {
          resourceType: 'ServiceRequest',
          id: 'baseehr-b11-sr',
          status: 'draft',
          intent: 'order',
          code: {
            coding: [{ system: 'http://loinc.org', code: '29252-4', display: 'CT Chest without contrast' }]
          },
          category: [{
            coding: [{ system: 'http://snomed.info/sct', code: '363679005', display: 'Imaging' }]
          }],
          subject: { reference: 'Patient/' + params.patientId }
        }
      }, function (err, result) {
        if (err) { done({ ok: false, error: err.message }); return; }
        var ours = (result.matches || []).filter(function (m) {
          return m.interventionId === params.interventionId;
        })[0] || null;
        done({
          ok: true,
          count: result.count,
          ourMatch: ours ? {
            title: ours.title,
            message: ours.message,
            reasons: ours.reasons,
            sourceAttributes: ours.sourceAttributes
          } : null
        });
      });
    }, [{ patientId: testPatientFhirId, interventionId: interventionId }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.b.11 - evaluate() completed (' + JSON.stringify(v.error || '') + ')');
      browser.assert.ok(
        v.count >= 1 && v.ourMatch,
        'ONC 170.315.b.11 - FIRE: authored DSI matched the imaging order for the 50+ male patient (matches: ' + v.count + ')'
      );
      if (v.ourMatch) {
        browser.assert.ok(
          v.ourMatch.title === DSI_TITLE && /renal function/i.test(v.ourMatch.message || ''),
          'ONC 170.315.b.11 - FIRE: intervention title + actionable message presented'
        );
      }
    });
  },

  '05. SOURCE ATTRIBUTES (§ ii): plain-language attributes accessible at firing': function (browser) {
    browser.executeAsync(function (params, done) {
      Meteor.call('decisionSupport.evaluate', {
        patientId: params.patientId,
        serviceRequest: {
          code: { coding: [{ code: '29252-4' }] },
          category: [{ coding: [{ code: '363679005', display: 'Imaging' }] }]
        }
      }, function (err, result) {
        if (err) { done({ ok: false, error: err.message }); return; }
        var ours = (result.matches || []).filter(function (m) {
          return m.interventionId === params.interventionId;
        })[0] || {};
        Meteor.call('decisionSupport.getSourceAttributePolicy', function (polErr, policy) {
          if (polErr) { done({ ok: false, error: polErr.message }); return; }
          done({
            ok: true,
            sourceAttributes: ours.sourceAttributes || null,
            policyKeys: (policy.keys || []).length,
            enabledCategories: policy.enabledCategories
          });
        });
      });
    }, [{ patientId: testPatientFhirId, interventionId: interventionId }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.b.11 - Source attribute round-trip completed');
      var sa = v.sourceAttributes || {};
      browser.assert.ok(
        sa.developer === 'BaseEHR Certification Test Suite',
        'ONC 170.315.b.11 - Source attribute: developer (' + sa.developer + ')'
      );
      browser.assert.ok(
        !!sa.bibliographicCitation && /ACR Manual/.test(sa.bibliographicCitation),
        'ONC 170.315.b.11 - Source attribute: bibliographic citation (' + sa.bibliographicCitation + ')'
      );
      browser.assert.ok(
        !!sa.fundingSource,
        'ONC 170.315.b.11 - Source attribute: funding source (' + sa.fundingSource + ')'
      );
      browser.assert.ok(
        v.policyKeys >= 1 && Array.isArray(v.enabledCategories),
        'ONC 170.315.b.11 - Source-attribute usage policy readable (keys: ' + v.policyKeys +
          ', categories: ' + v.enabledCategories + ')'
      );
    });
  },

  '06. FEEDBACK LOOP (§ ii.C): capture + computable export': function (browser) {
    browser.executeAsync(function (params, done) {
      Meteor.call('decisionSupport.recordFeedback', {
        interventionId: params.interventionId,
        interventionTitle: params.title,
        patientId: params.patientId,
        actionTaken: 'overridden',
        userFeedback: 'Renal panel current as of this week; proceeding with contrast.'
      }, function (fbErr, fbResult) {
        if (fbErr) { done({ ok: false, stage: 'record', error: fbErr.message }); return; }
        Meteor.call('decisionSupport.exportFeedback', { patientId: params.patientId }, function (exErr, exported) {
          if (exErr) { done({ ok: false, stage: 'export', error: exErr.message }); return; }
          var row = (exported.rows || []).filter(function (r) {
            return r.intervention === params.interventionId;
          })[0] || null;
          var ndjsonParses = true;
          try {
            (exported.ndjson || '').split('\n').filter(Boolean).forEach(function (line) { JSON.parse(line); });
          } catch (e) { ndjsonParses = false; }
          done({ ok: true, feedbackId: fbResult.id, row: row, ndjsonParses: ndjsonParses });
        });
      });
    }, [{ interventionId: interventionId, title: DSI_TITLE, patientId: testPatientFhirId }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok && !!v.feedbackId, 'ONC 170.315.b.11 - FEEDBACK: user feedback recorded (' + JSON.stringify(v.error || v.feedbackId) + ')');
      browser.assert.ok(
        v.row && v.row.actionTaken === 'overridden' && !!v.row.userFeedback && !!v.row.date && !!v.row.user,
        'ONC 170.315.b.11 - FEEDBACK: export row carries action/feedback/user/date'
      );
      browser.assert.ok(
        v.ndjsonParses,
        'ONC 170.315.b.11 - FEEDBACK: export is computable (NDJSON parses)'
      );
    });
  },

  '07. ACCESS (UI): decision support surfaces render': function (browser) {
    browser.execute(function () {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/decision-support');
        return { navigated: 'Meteor.navigate' };
      }
      window.location.href = '/decision-support';
      return { navigated: 'location.href' };
    }, [], function (result) {
      console.log('[b.11] navigation via', result.value.navigated);
    });

    browser
      .waitForElementVisible('#decisionSupportPage', TIMEOUTS.extended)
      .pause(3000);

    verifyPageLoaded(browser, '170.315.b.11');

    browser.execute(function (title) {
      var text = document.body.textContent || '';
      return {
        hasCatalogSurface: !!document.querySelector('#decisionSupportCatalogTable') ||
                           /intervention|catalog/i.test(text),
        hasOurDsi: text.indexOf(title) !== -1 ||
                   text.indexOf('BaseEHR test DSI') !== -1
      };
    }, [DSI_TITLE], function (result) {
      var v = result.value;
      browser.assert.ok(v.hasCatalogSurface, 'ONC 170.315.b.11 - ACCESS (UI): DSI catalog surface rendered');
      browser.assert.ok(
        v.hasOurDsi,
        'ONC 170.315.b.11 - ACCESS (UI): authored DSI visible in catalog'
      );
    });

    // INFORMATIONAL (not a gap): DSI Privacy & Security update due 12/31/2027;
    // predictive-DSI (AI/ML) source-attribute set applies only if predictive
    // DSIs are supplied — this module ships evidence-based eca-rules.
    browser.perform(function () {
      console.log('[b.11] INFORMATIONAL: P&S update due 12/31/2027 (future); no predictive DSIs supplied — predictive attribute set N/A.');
    });
  },

  '08. Cleanup and completion': function (browser) {
    browser.executeAsync(function (params, done) {
      Meteor.call('decisionSupport.setInterventionStatus', params.interventionId, 'retired', function (retireErr) {
        Meteor.call('patients.remove', params.patientId, function (patErr) {
          done({
            dsiRetired: !retireErr,
            patientRemoved: !patErr,
            notes: [retireErr && retireErr.message, patErr && (patErr.reason || patErr.message)].filter(Boolean)
          });
        });
      });
    }, [{ interventionId: interventionId, patientId: testPatientFhirId }], function (result) {
      console.log('[b.11] cleanup:', JSON.stringify(result.value));
    });

    takeScreenshot(browser, 'base-ehr_170.315.b.11_decision-support.png', '170.315.b.11');

    logTestCompletion(browser, '170.315.b.11', 'Decision Support Interventions (behavioral)', [
      'CONFIGURE: DSI authored + activated by permitted user (role-gated seam)',
      'FIRE: imaging order + demographics (age/sex) matched the eca-rule',
      'SOURCE ATTRIBUTES: developer/citation/funding accessible at firing',
      'FEEDBACK: recorded + exported as computable rows/NDJSON',
      'ACCESS: /decision-support catalog shows the intervention',
      'INFORMATIONAL: P&S 12/31/2027 future; predictive DSI set N/A'
    ]);

    browser.end();
  }
};
