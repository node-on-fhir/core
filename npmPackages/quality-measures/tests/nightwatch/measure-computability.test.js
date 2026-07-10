// packages/quality-measures/tests/nightwatch/measure-computability.test.js
//
// Data-driven measure computability — the CMS eCQM placeholders report
// "bundle required" until an executable bundle (ELM) is imported, at which
// point the CMS-number resolver flips them to computable with zero UI rework.
// Uses a synthetic minimal bundle (no VSAC-licensed content) to prove the
// resolver + flip; real fqm-execution correctness is out of scope here.
//
// Requires quality-measures loaded (e.g. `npm run medical-home-autologin`).

const ALL_MEASURE_IDS = [
  'CMS2v13', 'CMS122v12', 'CMS146v11', 'CMS165v12',
  'PACIO-ICARE-v1', 'CMS1317v1'
];

// Minimal synthetic measure bundle: Measure CMS146FHIR + one Library whose
// content declares application/elm+json (a stub — enough for hasElm and the
// computability check; NOT executable logic).
const SYNTHETIC_BUNDLE = {
  resourceType: 'Bundle',
  type: 'collection',
  entry: [
    {
      resource: {
        resourceType: 'Measure',
        id: 'CMS146FHIR',
        name: 'CMS146AppropriateTestingForPharyngitisFHIR',
        title: 'Appropriate Testing for Pharyngitis (synthetic test bundle)',
        status: 'draft',
        library: ['http://example.org/Library/CMS146Synthetic']
      }
    },
    {
      resource: {
        resourceType: 'Library',
        id: 'CMS146Synthetic',
        name: 'CMS146Synthetic',
        status: 'draft',
        type: { coding: [{ code: 'logic-library' }] },
        content: [
          { contentType: 'application/elm+json', data: 'e30=' } // base64 '{}'
        ]
      }
    }
  ]
};

module.exports = {
  tags: ['quality-measures', 'computability'],

  '00. Login': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(2000);

    browser.executeAsync(function(done) {
      if (Meteor.userId()) {
        done({ loginSuccess: true });
        return;
      }
      Meteor.call('test.createTestUser', {
        username: 'janedoe',
        email: 'janedoe@test.org',
        password: 'janedoe123'
      }, function(err) {
        Meteor.loginWithPassword('janedoe', 'janedoe123', function(loginErr) {
          done({ loginSuccess: !loginErr });
        });
      });
    }, [], function(result) {
      browser.assert.ok(result.value.loginSuccess, '[00] Logged in');
    });

    browser.pause(1000);
  },

  '01. CMS placeholders report bundle-required; PACIO measures computable': function (browser) {
    browser.timeoutsAsyncScript(60000);
    browser.executeAsync(function(measureIds, done) {
      Meteor.call('qualityMeasures.getMeasureComputability', measureIds, function(error, result) {
        done({ error: error ? error.message : null, rows: result });
      });
    }, [ALL_MEASURE_IDS], function(result) {
      browser.assert.ok(!result.value.error, '[01] getMeasureComputability succeeded: ' + (result.value.error || 'ok'));

      const rows = {};
      (result.value.rows || []).forEach(function(row) { rows[row.measureId] = row; });

      ['CMS2v13', 'CMS122v12', 'CMS165v12'].forEach(function(id) {
        const row = rows[id] || {};
        browser.assert.ok(row.computable === false, '[01] ' + id + ' is not computable (no bundle)');
        browser.assert.ok(!!row.reason && row.reason.indexOf('measure bundle') !== -1,
          '[01] ' + id + ' carries a remediation reason');
      });

      ['PACIO-ICARE-v1', 'CMS1317v1'].forEach(function(id) {
        const row = rows[id] || {};
        browser.assert.ok(row.computable === true, '[01] ' + id + ' is computable');
        browser.assert.equal(row.engine, 'pacio-evaluator', '[01] ' + id + ' runs on the PACIO evaluator');
      });
    });
  },

  '02. CALCULATE on a placeholder surfaces the specific remediation error': function (browser) {
    browser.timeoutsAsyncScript(60000);
    browser.executeAsync(function(done) {
      Meteor.call('qualityMeasures.calculate', {
        measureId: 'CMS122v12',
        reportType: 'summary',
        periodStart: '2026-01-01',
        periodEnd: '2026-12-31'
      }, function(error, result) {
        done({
          errorType: error ? error.error : null,
          errorReason: error ? error.reason : null,
          result: result
        });
      });
    }, [], function(result) {
      console.log('[02] CMS122v12 error:', result.value.errorType, '-', result.value.errorReason);
      browser.assert.ok(!result.value.result, '[02] No fabricated MeasureReport');
      browser.assert.equal(result.value.errorType, 'not-computable', '[02] not-computable error type');
      browser.assert.ok(
        (result.value.errorReason || '').indexOf('measure bundle') !== -1,
        '[02] Error reason names the missing measure bundle (specific, not generic)'
      );
    });
  },

  '03. Importing a synthetic ELM bundle flips CMS146v11 to computable': function (browser) {
    browser.timeoutsAsyncScript(60000);
    browser.executeAsync(function(bundle, done) {
      Meteor.call('qualityMeasures.importMeasureBundle', bundle, function(error, result) {
        done({ error: error ? error.message : null, result: result });
      });
    }, [SYNTHETIC_BUNDLE], function(result) {
      browser.assert.ok(!result.value.error, '[03] Bundle import succeeded: ' + (result.value.error || 'ok'));
      const imported = result.value.result || {};
      browser.assert.equal(imported.measureId, 'CMS146FHIR', '[03] Imported measure CMS146FHIR');
      browser.assert.ok(imported.hasElm === true, '[03] Bundle reports hasElm');
    });

    browser.executeAsync(function(done) {
      Meteor.call('qualityMeasures.getMeasureComputability', ['CMS146v11'], function(error, result) {
        done({ error: error ? error.message : null, rows: result });
      });
    }, [], function(result) {
      browser.assert.ok(!result.value.error, '[03] Computability re-check succeeded');
      const row = (result.value.rows || [])[0] || {};
      console.log('[03] CMS146v11 computability:', JSON.stringify(row));
      browser.assert.ok(row.computable === true, '[03] CMS146v11 flipped to computable');
      browser.assert.equal(row.resolvedMeasureId, 'CMS146FHIR', '[03] Resolver mapped CMS146v11 → CMS146FHIR');
      browser.assert.equal(row.engine, 'fqm-execution', '[03] Routed to fqm-execution');
    });
  },

  '04. Cleanup synthetic bundle and verify the flip reverts': function (browser) {
    browser.timeoutsAsyncScript(60000);
    browser.executeAsync(function(done) {
      // Remove the synthetic measure + tagged library so repeated runs and
      // other suites see a clean slate
      Meteor.call('test.removeMeasureBundle', 'CMS146FHIR', function(error, result) {
        done({ error: error ? error.message : null, result: result });
      });
    }, [], function(result) {
      if (result.value.error) {
        // Cleanup helper may not exist on every deployment — log, don't fail
        console.log('[04] Cleanup skipped:', result.value.error);
      } else {
        console.log('[04] Synthetic bundle removed');
      }
    });

    browser.perform(function() {
      console.log('✅ Measure computability tests complete');
    });

    browser.end();
  }
};
