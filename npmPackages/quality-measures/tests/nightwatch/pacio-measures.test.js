// packages/quality-measures/tests/nightwatch/pacio-measures.test.js
//
// July 2026 CMS Connectathon PACIO track — deterministic end-to-end tests
// for the evaluator-backed measures (CMS1317v1, PACIO-ICARE-v1) against the
// Betsy Smith-Johnson fixtures loaded by pacio.loadConnectathonData.
//
// Requires clinical:pacio-core + clinical:quality-measures loaded
// (e.g. `npm run medical-home-autologin`).

const PERIOD = { periodStart: '2026-01-01', periodEnd: '2026-12-31' };
const BSJ_PATIENT_ID = 'bsj-patient-001';

module.exports = {
  tags: ['quality-measures', 'pacio', 'connectathon'],

  '00. Login and load connectathon data': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(2000);

    // Login (create test user if needed)
    browser.executeAsync(function(done) {
      if (Meteor.userId()) {
        done({ loginSuccess: true, userId: Meteor.userId() });
        return;
      }
      Meteor.call('test.createTestUser', {
        username: 'janedoe',
        email: 'janedoe@test.org',
        password: 'janedoe123'
      }, function(err) {
        Meteor.loginWithPassword('janedoe', 'janedoe123', function(loginErr) {
          done({ loginSuccess: !loginErr, userId: Meteor.userId() });
        });
      });
    }, [], function(result) {
      browser.assert.ok(result.value.loginSuccess, '[00] Logged in');
    });

    browser.pause(1000);

    // Load the connectathon sample data (depot + curated BSJ fixtures)
    browser.timeoutsAsyncScript(120000);
    browser.executeAsync(function(done) {
      Meteor.call('pacio.loadConnectathonData', function(error, result) {
        done({ error: error ? error.message : null, result: result });
      });
    }, [], function(result) {
      if (result.value.error) {
        console.error('[00] loadConnectathonData error:', result.value.error);
      } else {
        console.log('[00] Loaded', result.value.result.loadedCount, 'resources,',
          result.value.result.errors.length, 'errors, skipped types:',
          JSON.stringify(result.value.result.skippedTypes));
      }
      browser.assert.ok(!result.value.error, '[00] Connectathon data loaded');
    });

    browser.pause(2000);
  },

  '01. CMS1317v1 individual calculation for Betsy Smith-Johnson': function (browser) {
    browser.timeoutsAsyncScript(60000);
    browser.executeAsync(function(params, done) {
      Meteor.call('qualityMeasures.calculate', params, function(error, result) {
        done({ error: error ? error.message : null, result: result });
      });
    }, [Object.assign({
      measureId: 'CMS1317v1',
      reportType: 'individual',
      patientId: BSJ_PATIENT_ID
    }, PERIOD)], function(result) {
      browser.assert.ok(!result.value.error, '[01] CMS1317v1 calculation succeeded: ' + (result.value.error || 'ok'));

      const calc = result.value.result || {};
      const evalResult = calc.evaluationResult || {};
      const paths = (evalResult.details || {}).numeratorPaths || {};

      console.log('[01] engine:', calc.engine,
        '| IP:', evalResult.inInitialPopulation,
        '| numerator:', evalResult.inNumerator,
        '| paths:', JSON.stringify({
          acpDocument: (paths.acpDocument || {}).met,
          dnrZ66: (paths.dnrZ66 || {}).met,
          acpDiscussion: (paths.acpDiscussion || {}).met
        }));

      browser.assert.equal(calc.engine, 'pacio-evaluator', '[01] Calculated by the PACIO evaluator');
      browser.assert.ok(evalResult.inInitialPopulation === true, '[01] Betsy is in the initial population (18+, inpatient discharge in 2026)');
      browser.assert.ok(evalResult.inDenominatorExclusion === false, '[01] No denominator exclusions (CMS1317v1 defines none)');
      browser.assert.ok((paths.acpDocument || {}).met === true, '[01] Path 1 (ACP document) met via the BSJ ADI DocumentReference (PACIO extension)');
      browser.assert.ok((paths.acpDiscussion || {}).met === true, '[01] Path 2 (ACP discussion) met via the 75773-2 Observation fixture');
      browser.assert.ok((paths.dnrZ66 || {}).met === true, '[01] Path 3 (Z66 DNR) met');
      browser.assert.ok((paths.dnrZ66 || {}).faithfulMet === true, '[01] Path 3 faithful reading met via the Z66 ServiceRequest fixture');
      browser.assert.ok(evalResult.inNumerator === true, '[01] Betsy is in the numerator');
    });
  },

  '02. PACIO-ICARE-v1 individual calculation for Betsy Smith-Johnson': function (browser) {
    browser.timeoutsAsyncScript(60000);
    browser.executeAsync(function(params, done) {
      Meteor.call('qualityMeasures.calculate', params, function(error, result) {
        done({ error: error ? error.message : null, result: result });
      });
    }, [Object.assign({
      measureId: 'PACIO-ICARE-v1',
      reportType: 'individual',
      patientId: BSJ_PATIENT_ID
    }, PERIOD)], function(result) {
      browser.assert.ok(!result.value.error, '[02] I-CARE calculation succeeded: ' + (result.value.error || 'ok'));

      const calc = result.value.result || {};
      const evalResult = calc.evaluationResult || {};
      const details = evalResult.details || {};
      const sectionResults = details.sectionResults || [];

      console.log('[02] IP:', evalResult.inInitialPopulation,
        '| numerator:', evalResult.inNumerator,
        '| sections present:', sectionResults.filter(function(s) { return s.hasEntries; }).length + '/' + sectionResults.length);

      browser.assert.equal(calc.engine, 'pacio-evaluator', '[02] Calculated by the PACIO evaluator');
      browser.assert.ok(evalResult.inInitialPopulation === true, '[02] Betsy is in the initial population');
      browser.assert.equal(sectionResults.length, 15, '[02] All 15 required ToC sections evaluated');
      // The curated bsj-toc-composition fixture carries all 15 required sections
      browser.assert.ok(evalResult.inNumerator === true, '[02] Betsy is in the numerator (fully conformant TOC Composition)');
    });
  },

  '03. Non-computable measure surfaces an honest error': function (browser) {
    browser.timeoutsAsyncScript(60000);
    browser.executeAsync(function(params, done) {
      Meteor.call('qualityMeasures.calculate', params, function(error, result) {
        done({
          errorType: error ? error.error : null,
          errorMessage: error ? error.message : null,
          result: result
        });
      });
    }, [Object.assign({
      measureId: 'CMS2v13',
      reportType: 'individual',
      patientId: BSJ_PATIENT_ID
    }, PERIOD)], function(result) {
      console.log('[03] CMS2v13 error:', result.value.errorType, '-', result.value.errorMessage);
      // CMS2v13 has no imported measure bundle -> not-computable (or not-found
      // if the default list isn't seeded); it must NOT fabricate counts.
      browser.assert.ok(!result.value.result, '[03] No fabricated MeasureReport for an uncomputable measure');
      browser.assert.ok(
        ['not-computable', 'not-found'].indexOf(result.value.errorType) !== -1,
        '[03] Honest error surfaced (' + result.value.errorType + ')'
      );
    });
  },

  '04. Quality Measures UI renders the calculated result': function (browser) {
    browser
      .url('http://localhost:3000/quality-measures')
      .waitForElementVisible('body', 5000)
      .pause(2000);

    browser.assert.not.textContains('body', '404');
    browser.assert.textContains('body', 'CMS1317v1');

    browser.perform(function() {
      console.log('✅ PACIO measure tests complete');
    });

    browser.end();
  }
};
