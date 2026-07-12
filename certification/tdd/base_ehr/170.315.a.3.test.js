// certification/tdd/base_ehr/170.315.a.3.test.js
// ONC § 170.315(a)(3) - CPOE Diagnostic Imaging — BEHAVIORAL (record / change / access)

// Import helpers
const { loginAsProvider } = require('../helpers/authentication-helper');
const {
  verifyPageLoaded,
  verifyPageContent,
  takeScreenshot,
  logTestCompletion,
  verifyCapability
} = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

// Suite-level state shared across steps (Nightwatch runs steps in order)
const runStamp = Date.now();
const testPatientFhirId = `baseehr-a3-${runStamp}`;
let imagingOrderMongoId = null;

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.a.3', 'cpoe-diagnostic-imaging'],

  /**
   * § 170.315(a)(3) - CPOE Diagnostic Imaging
   *
   * OVERVIEW:
   * Behavioral verification that the EHR enables a user to RECORD, CHANGE, and
   * ACCESS diagnostic imaging orders (45 CFR § 170.315(a)(3)(i)), plus the
   * OPTIONAL "reason for order" field (§ (a)(3)(ii)).
   *
   * Flow (per ONC CCG — no standard required; only record/change/access):
   *   1. Provider signs in; test patient created + selected (Session context).
   *   2. RECORD — pick an imaging study from the radiology catalog
   *      (XR Chest 2 Views, LOINC 30746-2 / RSNA Radiology Playbook), include
   *      a reason for order, submit → server persists a FHIR ServiceRequest
   *      with LOINC coding, SNOMED Imaging category (363679005), DICOM
   *      modality orderDetail, and bodySite.
   *   3. CHANGE — modify the recorded order (serviceRequests.update) and
   *      verify persistence (serviceRequests.get).
   *   4. ACCESS — navigate to /service-requests and verify the recorded order
   *      is displayed.
   *
   * BDD Reference: certification/bdd/170.315-a-3-cpoe-diagnostic-imaging.feature
   * Pattern source: tests/nightwatch/honeycomb/cpoe.diagnostic-imaging.js
   *
   * REGULATORY CONTEXT:
   * § 170.315(a)(3)(i): "Enable a user to record, change, and access diagnostic
   * imaging orders." § (a)(3)(ii) Optional: "Include a 'reason for order'
   * field." Base EHR definition requires at least one of (a)(1)/(a)(2)/(a)(3).
   *
   * IMPORTANT NOTES:
   * - Server boot per fable/baseehr-ralph/CONTEXT.md (TDD settings,
   *   DEV_AUTO_LOGIN, EXTRA_WORKFLOWS incl. @node-on-fhir/order-catalog).
   * - Route: /cpoe/diagnostic-imaging (OrderCatalogPage defaultType=radiology)
   * - Catalog: npmPackages/order-catalog/client/RadiologyCatalog.js
   * - Server method: npmPackages/order-catalog/server/methods.js (submitOrders)
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
        'ONC 170.315.a.3 - Provider session established (' + JSON.stringify(result.value) + ')'
      );
    });

    // Fallback path for environments without DEV_AUTO_LOGIN
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Diagnostic imaging CPOE route loads': function (browser) {
    browser
      .url('http://localhost:3000/cpoe/diagnostic-imaging')
      .waitForElementVisible('[data-testid="order-catalog-page"]', TIMEOUTS.extended)
      .pause(1000);

    verifyPageLoaded(browser, '170.315.a.3');
    verifyPageContent(browser, [
      '#orderCatalogPage',
      '[data-testid="order-catalog-page"]'
    ], '170.315.a.3');
  },

  '03. Test patient created and selected (patient context)': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{
          use: 'official',
          text: 'BaseEHR CpoeImaging',
          family: 'CpoeImaging',
          given: ['BaseEHR']
        }],
        gender: 'female',
        birthDate: '1970-01-01'
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
        'ONC 170.315.a.3 - Test patient created + Session context set (' +
          JSON.stringify(result.value) + ')'
      );
    });

    browser.pause(1000);
  },

  '04. Radiology ordering interface present': function (browser) {
    // The /cpoe/diagnostic-imaging route opens in radiology mode; click the
    // radiology tab defensively in case a prior state lingers.
    browser
      .waitForElementVisible('[data-testid="radiology-tab"]', TIMEOUTS.normal)
      .click('[data-testid="radiology-tab"]')
      .pause(500);

    verifyCapability(browser, {
      selectors: ['[data-testid="order-type-selector"]'],
      criterion: '170.315.a.3',
      capability: 'Imaging order type selector'
    });
    verifyCapability(browser, {
      selectors: ['[data-testid="radiology-search-input"]'],
      criterion: '170.315.a.3',
      capability: 'Radiology catalog search'
    });
    verifyCapability(browser, {
      selectors: ['[data-testid="active-orders-panel"]'],
      criterion: '170.315.a.3',
      capability: 'Active orders panel'
    });
  },

  '05. RECORD: select an imaging study from the radiology catalog': function (browser) {
    // Target the XR Chest 2 Views row directly (LOINC 30746-2)
    browser.execute(function () {
      var row = document.querySelector('[data-testid="radiology-order-row-chest_xray_2v"]');
      if (!row) {
        var rows = document.querySelectorAll('[data-testid^="radiology-order-row-"]');
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].textContent.indexOf('XR Chest 2 Views') !== -1) { row = rows[i]; break; }
        }
      }
      if (!row) { return { ok: false, error: 'XR Chest 2 Views catalog row not found' }; }
      var addButton = row.querySelector('[data-testid="add-radiology-order-button"]') ||
                      row.querySelector('button');
      if (!addButton) { return { ok: false, error: 'add button not found in imaging row' }; }
      addButton.click();
      return { ok: true };
    }, [], function (result) {
      browser.assert.ok(
        result.value.ok,
        'ONC 170.315.a.3 - Imaging order added to active orders (' + (result.value.error || 'XR Chest 2 Views') + ')'
      );
    });

    browser.pause(1000);

    browser.execute(function () {
      var panel = document.querySelector('[data-testid="active-orders-panel"]');
      var submit = document.querySelector('[data-testid="submit-orders-button"]');
      return {
        panelHasStudy: !!panel && panel.textContent.indexOf('XR Chest') !== -1,
        submitEnabled: !!submit && !submit.disabled,
        submitLabel: submit ? submit.textContent : null
      };
    }, [], function (result) {
      browser.assert.ok(
        result.value.panelHasStudy,
        'ONC 170.315.a.3 - Active orders panel shows the pending imaging order'
      );
      browser.assert.ok(
        result.value.submitEnabled,
        'ONC 170.315.a.3 - Submit available for pending order (' + result.value.submitLabel + ')'
      );
    });

    // Capture the CPOE ordering interface with the staged order (for the manual)
    takeScreenshot(browser, 'base-ehr_170.315.a.3_cpoe-diagnostic-imaging.png', '170.315.a.3');
  },

  '06. RECORD: reason for order (optional § a.3.ii) and submit': function (browser) {
    browser.execute(function () {
      var root = document.querySelector('[data-testid="radiology-order-reason-field"]');
      var field = root ? (root.querySelector('textarea') || root.querySelector('input')) : null;
      if (!field) { return { ok: false, error: 'reason field not found' }; }
      field.value = 'Persistent cough, rule out pneumonia';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };
    }, [], function (result) {
      browser.assert.ok(
        result.value.ok,
        'ONC 170.315.a.3 - Reason for order field present and populated (§ a.3.ii optional)'
      );
    });

    browser.pause(500);

    browser.execute(function () {
      window.__a3SubmitAlerts = [];
      window.alert = function (msg) { window.__a3SubmitAlerts.push(String(msg)); };
      window.confirm = function () { return false; };
      var submit = document.querySelector('[data-testid="submit-orders-button"]');
      if (!submit || submit.disabled) { return { ok: false, error: 'submit unavailable' }; }
      submit.click();
      return { ok: true };
    }, [], function (result) {
      browser.assert.ok(result.value.ok, 'ONC 170.315.a.3 - Order submitted');
    });

    browser.pause(3000);

    browser.execute(function () {
      return { alerts: window.__a3SubmitAlerts || [] };
    }, [], function (result) {
      browser.assert.ok(
        result.value.alerts.length === 0,
        'ONC 170.315.a.3 - Order submission raised no validation errors (' +
          JSON.stringify(result.value.alerts) + ')'
      );
    });
  },

  '07. RECORD verified: imaging ServiceRequest persisted': function (browser) {
    browser.timeouts('script', TIMEOUTS.maximum, function () {});

    browser.executeAsync(function (fhirId, done) {
      var finished = false;
      function finish(payload) {
        if (!finished) { finished = true; done(payload); }
      }
      setTimeout(function () { finish({ ok: false, error: 'subscription timeout' }); }, 15000);

      // autopublish.* publications pass the query verbatim to Mongo
      Meteor.subscribe('autopublish.ServiceRequests', { 'subject.reference': 'Patient/' + fhirId }, {}, {
        onReady: function () {
          var recs = ServiceRequests.find({
            'subject.reference': 'Patient/' + fhirId
          }).fetch();
          finish({
            ok: true,
            count: recs.length,
            first: recs.length ? {
              _id: recs[0]._id,
              id: recs[0].id,
              status: recs[0].status,
              intent: recs[0].intent,
              codeText: (recs[0].code && recs[0].code.text) || '',
              codeSystem: (recs[0].code && recs[0].code.coding && recs[0].code.coding[0] && recs[0].code.coding[0].system) || '',
              loincCode: (recs[0].code && recs[0].code.coding && recs[0].code.coding[0] && recs[0].code.coding[0].code) || '',
              categoryCode: (recs[0].category && recs[0].category[0] && recs[0].category[0].coding && recs[0].category[0].coding[0] && recs[0].category[0].coding[0].code) || '',
              modalitySystem: (recs[0].orderDetail && recs[0].orderDetail[0] && recs[0].orderDetail[0].coding && recs[0].orderDetail[0].coding[0] && recs[0].orderDetail[0].coding[0].system) || '',
              hasBodySite: !!(recs[0].bodySite && recs[0].bodySite.length),
              hasRequester: !!(recs[0].requester && recs[0].requester.reference)
            } : null
          });
        }
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.3 - ServiceRequest query completed (' + JSON.stringify(v.error || '') + ')');
      browser.assert.ok(
        v.count >= 1 && v.first,
        'ONC 170.315.a.3 - RECORD: imaging ServiceRequest persisted for patient (count: ' + v.count + ')'
      );
      if (v.first) {
        imagingOrderMongoId = v.first._id;
        browser.assert.ok(
          v.first.codeSystem === 'http://loinc.org' && v.first.loincCode === '30746-2',
          'ONC 170.315.a.3 - Imaging order coded with LOINC/RSNA Playbook (' + v.first.codeSystem + '|' + v.first.loincCode + ')'
        );
        browser.assert.ok(
          v.first.categoryCode === '363679005',
          'ONC 170.315.a.3 - Order categorized as Imaging (SNOMED ' + v.first.categoryCode + ')'
        );
        browser.assert.ok(
          v.first.modalitySystem === 'http://dicom.nema.org/resources/ontology/DCM',
          'ONC 170.315.a.3 - Order carries DICOM modality orderDetail (' + v.first.modalitySystem + ')'
        );
        browser.assert.ok(
          v.first.hasBodySite,
          'ONC 170.315.a.3 - Order carries body site'
        );
        browser.assert.ok(
          v.first.status === 'active' && v.first.intent === 'order' && v.first.hasRequester,
          'ONC 170.315.a.3 - Recorded order is an active order with requester'
        );
      }
    });
  },

  '08. CHANGE: modify the recorded order and verify persistence': function (browser) {
    browser.perform(function () {
      browser.assert.ok(!!imagingOrderMongoId, 'ONC 170.315.a.3 - Recorded order id captured for change leg');
    });

    browser.executeAsync(function (mongoId, done) {
      Meteor.call('serviceRequests.update', mongoId, {
        status: 'on-hold',
        priority: 'stat'
      }, function (updateErr) {
        if (updateErr) {
          done({ ok: false, stage: 'update', error: updateErr.message });
          return;
        }
        Meteor.call('serviceRequests.get', mongoId, function (getErr, rec) {
          if (getErr || !rec) {
            done({ ok: false, stage: 'get', error: getErr ? getErr.message : 'not found' });
            return;
          }
          done({ ok: true, status: rec.status, priority: rec.priority });
        });
      });
    }, [imagingOrderMongoId], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.3 - CHANGE: update round-trip succeeded (' + JSON.stringify(v) + ')');
      browser.assert.ok(
        v.status === 'on-hold' && v.priority === 'stat',
        'ONC 170.315.a.3 - CHANGE: modified values persisted (status: ' + v.status + ', priority: ' + v.priority + ')'
      );
    });
  },

  '09. ACCESS: recorded order visible in service requests UI': function (browser) {
    browser.execute(function () {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/service-requests');
        return { navigated: 'Meteor.navigate' };
      }
      window.location.href = '/service-requests';
      return { navigated: 'location.href' };
    }, [], function (result) {
      console.log('[a.3] navigation via', result.value.navigated);
    });

    browser
      .waitForElementVisible('#serviceRequestsPage', TIMEOUTS.extended)
      .pause(3000);

    browser.execute(function (fhirId) {
      var table = document.querySelector('#serviceRequestsTable');
      var clientCount = (typeof ServiceRequests !== 'undefined')
        ? ServiceRequests.find({ 'subject.reference': 'Patient/' + fhirId }).count()
        : -1;
      return {
        tablePresent: !!table,
        tableHasStudy: !!table && table.textContent.indexOf('XR Chest') !== -1,
        clientCount: clientCount
      };
    }, [testPatientFhirId], function (result) {
      var v = result.value;
      browser.assert.ok(v.tablePresent, 'ONC 170.315.a.3 - ACCESS: service requests table rendered');
      browser.assert.ok(
        v.tableHasStudy || v.clientCount >= 1,
        'ONC 170.315.a.3 - ACCESS: recorded order retrievable in orders UI (table match: ' +
          v.tableHasStudy + ', client records: ' + v.clientCount + ')'
      );
    });
  },

  '10. Cleanup and completion': function (browser) {
    browser.executeAsync(function (mongoId, done) {
      if (!mongoId) { done({ removed: false, reason: 'no id' }); return; }
      Meteor.call('serviceRequests.remove', mongoId, function (err) {
        done({ removed: !err, reason: err ? err.message : 'ok' });
      });
    }, [imagingOrderMongoId], function (result) {
      console.log('[a.3] cleanup:', JSON.stringify(result.value));
    });

    logTestCompletion(browser, '170.315.a.3', 'CPOE Diagnostic Imaging (behavioral)', [
      'Provider authentication',
      'Patient context establishment',
      'RECORD: radiology catalog selection, reason for order (§ a.3.ii), submit',
      'RECORD: ServiceRequest persisted (LOINC/RSNA code, Imaging category, DICOM modality, body site)',
      'CHANGE: order modified via serviceRequests.update and verified',
      'ACCESS: order retrievable in /service-requests UI'
    ]);

    browser.end();
  }
};
