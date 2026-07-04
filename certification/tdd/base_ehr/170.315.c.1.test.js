// certification/tdd/base_ehr/170.315.c.1.test.js
// ONC § 170.315(c)(1) - CQM Record & Export — BEHAVIORAL + documented gap

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
const testPatientFhirId = `baseehr-c1-${runStamp}`;
const PERIOD_START = '2026-01-01';
const PERIOD_END = '2026-12-31';
let measureId = null;

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.c.1', 'cqm', 'quality-measures'],

  /**
   * § 170.315(c)(1) - Clinical Quality Measures: Record and Export
   *
   * OVERVIEW:
   * Behavioral verification of the CQM record & export criterion using the
   * quality-measures workflow package (fqm-execution engine + PACIO
   * evaluators; measures seeded at startup incl. CMS1317v1 ACP).
   *
   * What IS exercised (green):
   * - Measures catalog (qualityMeasures.getMeasures) is populated.
   * - RECORD: qualityMeasures.recordNumerator persists a
   *   measure-observation-profiled FHIR Observation for the patient and
   *   triggers recalculation.
   * - CALCULATE: qualityMeasures.calculate (individual) produces a complete
   *   FHIR MeasureReport with initial-population / denominator / numerator
   *   population groups for the patient.
   * - EXPORT: qualityMeasures.export produces FHIR / CSV / JSON exports of
   *   the captured MeasureReports.
   * - UI: /quality-measures renders (page exposes no element ids —
   *   text-based assertions).
   *
   * DOCUMENTED GAP (red — see PROGRESS.md gap register):
   * - GAP(170.315.c.1): QRDA Category I export is NOT implemented —
   *   qualityMeasures.export({format:'qrda1'}) throws not-implemented
   *   ("The PACIO track is FHIR-native; use format 'fhir'"). § 170.315(c)(1)
   *   requires export formatted per § 170.205(h)(2) (QRDA Category I).
   *   QRDA Category III likewise not implemented (relevant to (c)(2)/(c)(3),
   *   noted for completeness).
   *
   * IMPORTANT NOTES:
   * - Server boot per fable/baseehr-ralph/CONTEXT.md (EXTRA_WORKFLOWS incl.
   *   @node-on-fhir/quality-measures).
   * - Methods: npmPackages/quality-measures/server/methods.js
   * - UI: /quality-measures
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
        'ONC 170.315.c.1 - Provider session established (' + JSON.stringify(result.value) + ')'
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
          text: 'BaseEHR CqmRecord',
          family: 'CqmRecord',
          given: ['BaseEHR']
        }],
        gender: 'female',
        birthDate: '1958-06-06'
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
        'ONC 170.315.c.1 - Test patient created + Session context set (' +
          JSON.stringify(result.value) + ')'
      );
    });

    browser.pause(500);
  },

  '03. Measures catalog populated': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('qualityMeasures.getMeasures', function (err, measures) {
        if (err) { done({ ok: false, error: err.message }); return; }
        done({
          ok: true,
          count: (measures || []).length,
          measures: (measures || []).slice(0, 5).map(function (m) {
            return { id: m.id || m._id, title: m.title || m.name, status: m.status };
          })
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.c.1 - getMeasures completed');
      browser.assert.ok(
        v.count >= 1,
        'ONC 170.315.c.1 - CQM catalog populated (' + v.count + ' measures: ' +
          JSON.stringify(v.measures) + ')'
      );
      if (v.measures && v.measures.length) {
        measureId = v.measures[0].id;
      }
    });
  },

  '04. RECORD: numerator data captured as measure-observation': function (browser) {
    browser.perform(function () {
      browser.assert.ok(!!measureId, 'ONC 170.315.c.1 - Measure id captured (' + measureId + ')');
    });

    browser.timeouts('script', TIMEOUTS.maximum, function () {});

    browser.executeAsync(function (params, done) {
      Meteor.call('qualityMeasures.recordNumerator', {
        measureId: params.measureId,
        patientId: params.patientId,
        value: true,
        reason: 'BaseEHR certification test - numerator event recorded'
      }, function (err, result) {
        if (err) { done({ ok: false, error: err.message }); return; }
        done({ ok: true, observationId: result.observationId });
      });
    }, [{ measureId: measureId, patientId: testPatientFhirId }], function (result) {
      var v = result.value || {};
      browser.assert.ok(
        v.ok && !!v.observationId,
        'ONC 170.315.c.1 - RECORD: numerator captured as measure-observation (' +
          JSON.stringify(v.error || v.observationId) + ')'
      );
    });
  },

  '05. CALCULATE: individual MeasureReport with population groups': function (browser) {
    browser.executeAsync(function (params, done) {
      Meteor.call('qualityMeasures.calculate', {
        measureId: params.measureId,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        reportType: 'individual',
        patientId: params.patientId
      }, function (err, result) {
        if (err) { done({ ok: false, error: err.message }); return; }
        var report = (result || {}).measureReport || {};
        var pops = {};
        ((report.group || [])[0] || { population: [] }).population.forEach(function (p) {
          pops[p.code.coding[0].code] = p.count;
        });
        done({
          ok: true,
          success: result.success,
          engine: result.engine,
          reportId: result.reportId,
          resourceType: report.resourceType,
          status: report.status,
          type: report.type,
          measure: report.measure,
          subject: report.subject && report.subject.reference,
          populations: pops
        });
      });
    }, [{ measureId: measureId, patientId: testPatientFhirId, periodStart: PERIOD_START, periodEnd: PERIOD_END }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.c.1 - CALCULATE completed (' + JSON.stringify(v.error || '') + ')');
      browser.assert.ok(
        v.success && !!v.reportId,
        'ONC 170.315.c.1 - CALCULATE: report persisted (engine: ' + v.engine + ', reportId: ' + v.reportId + ')'
      );
      browser.assert.ok(
        v.resourceType === 'MeasureReport' && v.status === 'complete' && v.type === 'individual',
        'ONC 170.315.c.1 - Complete individual FHIR MeasureReport produced'
      );
      browser.assert.ok(
        v.subject === 'Patient/' + testPatientFhirId,
        'ONC 170.315.c.1 - MeasureReport subject is the test patient'
      );
      var pops = v.populations || {};
      browser.assert.ok(
        'initial-population' in pops && 'denominator' in pops && 'numerator' in pops,
        'ONC 170.315.c.1 - Population groups reported (' + JSON.stringify(pops) + ')'
      );
    });
  },

  '06. EXPORT: FHIR / CSV / JSON export of captured reports': function (browser) {
    browser.executeAsync(function (params, done) {
      Meteor.call('qualityMeasures.export', {
        measureIds: [params.measureId],
        format: 'fhir',
        periodStart: params.periodStart,
        periodEnd: params.periodEnd
      }, function (fhirErr, fhirResult) {
        if (fhirErr) { done({ ok: false, stage: 'fhir', error: fhirErr.message }); return; }
        Meteor.call('qualityMeasures.export', {
          measureIds: [params.measureId],
          format: 'csv',
          periodStart: params.periodStart,
          periodEnd: params.periodEnd
        }, function (csvErr, csvResult) {
          if (csvErr) { done({ ok: false, stage: 'csv', error: csvErr.message }); return; }
          done({
            ok: true,
            fhirRecordCount: fhirResult.recordCount,
            fhirIsBundle: !!fhirResult.data && JSON.stringify(fhirResult.data).indexOf('Bundle') !== -1,
            csvHasHeader: typeof csvResult.data === 'string' && csvResult.data.indexOf('Measure,Period') === 0
          });
        });
      });
    }, [{ measureId: measureId, periodStart: PERIOD_START, periodEnd: PERIOD_END }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.c.1 - EXPORT round-trip completed (' + JSON.stringify(v.error || '') + ')');
      browser.assert.ok(
        v.fhirRecordCount >= 1,
        'ONC 170.315.c.1 - EXPORT: captured MeasureReport included in export (records: ' + v.fhirRecordCount + ')'
      );
      browser.assert.ok(
        v.fhirIsBundle,
        'ONC 170.315.c.1 - EXPORT: FHIR export is a Bundle'
      );
      browser.assert.ok(
        v.csvHasHeader,
        'ONC 170.315.c.1 - EXPORT: CSV export well-formed'
      );
    });
  },

  '07. QRDA Category I export (§ 170.205(h)(2)) — documented gap': function (browser) {
    // GAP(170.315.c.1): QRDA Category I export not implemented — see PROGRESS.md.
    // (c)(1) requires exporting a QRDA Cat I data file; the module deliberately
    // throws not-implemented and points to its FHIR-native export.
    browser.executeAsync(function (params, done) {
      Meteor.call('qualityMeasures.export', {
        measureIds: [params.measureId],
        format: 'qrda1',
        periodStart: params.periodStart,
        periodEnd: params.periodEnd
      }, function (err, result) {
        done({
          qrda1Implemented: !err,
          error: err ? (err.reason || err.message) : null,
          dataLength: result && result.data ? String(result.data).length : 0
        });
      });
    }, [{ measureId: measureId, periodStart: PERIOD_START, periodEnd: PERIOD_END }], function (result) {
      var v = result.value || {};
      console.log('[c.1] QRDA I probe:', JSON.stringify(v));
      if (!v.qrda1Implemented) {
        browser.verify.fail('GAP(170.315.c.1): QRDA Category I export not implemented (' + v.error + ') — § 170.205(h)(2) export format required by (c)(1)');
      }
    });
  },

  '08. ACCESS (UI): quality measures dashboard renders': function (browser) {
    browser.execute(function () {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/quality-measures');
        return { navigated: 'Meteor.navigate' };
      }
      window.location.href = '/quality-measures';
      return { navigated: 'location.href' };
    }, [], function (result) {
      console.log('[c.1] navigation via', result.value.navigated);
    });

    browser.pause(3000);
    verifyPageLoaded(browser, '170.315.c.1');

    browser.execute(function () {
      var text = document.body.textContent || '';
      return {
        hasCqmVocabulary: /quality measure|CQM|measure/i.test(text)
      };
    }, [], function (result) {
      browser.assert.ok(
        result.value.hasCqmVocabulary,
        'ONC 170.315.c.1 - ACCESS (UI): quality measures page rendered'
      );
    });
  },

  '09. Cleanup and completion': function (browser) {
    browser.executeAsync(function (patientId, done) {
      Meteor.call('patients.remove', patientId, function (err) {
        done({ patientRemoved: !err, reason: err ? (err.reason || err.message) : 'ok' });
      });
    }, [testPatientFhirId], function (result) {
      console.log('[c.1] cleanup:', JSON.stringify(result.value));
    });

    takeScreenshot(browser, 'base-ehr_170.315.c.1_quality-measures.png', '170.315.c.1');

    logTestCompletion(browser, '170.315.c.1', 'CQM Record & Export (behavioral + gap)', [
      'Measures catalog populated (seeded CMS/PACIO measures)',
      'RECORD: numerator captured as measure-observation Observation',
      'CALCULATE: individual MeasureReport with population groups',
      'EXPORT: FHIR Bundle + CSV of captured MeasureReports',
      'GAP (red): QRDA Category I export not implemented (§ 170.205(h)(2))',
      'ACCESS: /quality-measures renders'
    ]);

    browser.end();
  }
};
