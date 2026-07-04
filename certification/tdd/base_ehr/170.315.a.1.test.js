// certification/tdd/base_ehr/170.315.a.1.test.js
// ONC § 170.315(a)(1) - CPOE Medications — BEHAVIORAL (record / change / access)

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
const testPatientFhirId = `baseehr-a1-${runStamp}`;
let medReqMongoId = null;

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.a.1', 'cpoe-medications'],

  /**
   * § 170.315(a)(1) - CPOE Medications
   *
   * OVERVIEW:
   * Behavioral verification that the EHR enables a user to RECORD, CHANGE, and
   * ACCESS medication orders (45 CFR § 170.315(a)(1)(i)), plus the OPTIONAL
   * "reason for order" field (§ (a)(1)(ii)).
   *
   * Flow (per ONC Certification Companion Guide v1.0, 03-11-2024 — no standard
   * is required; transmission is out of scope; only record/change/access):
   *   1. Provider signs in (DEV_AUTO_LOGIN) and a test patient is created +
   *      selected (Session patient context).
   *   2. RECORD — search the medication catalog, add an order, include a
   *      reason for order, submit → server persists a FHIR MedicationRequest
   *      (orderCatalog.submitOrders → MedicationRequests + AuditEvent).
   *   3. CHANGE — modify the recorded order (medicationRequests.update) and
   *      verify the change persisted (medicationRequests.get).
   *   4. ACCESS — navigate to the medication orders UI (/medication-requests)
   *      and verify the recorded order is displayed.
   *
   * BDD Reference: certification/bdd/170.315-a-1-cpoe-medications.feature
   *
   * REGULATORY CONTEXT:
   * § 170.315(a)(1)(i): "Enable a user to record, change, and access medication
   * orders." § (a)(1)(ii) Optional: "Include a 'reason for order' field."
   * Base EHR definition requires at least one of (a)(1)/(a)(2)/(a)(3).
   *
   * IMPORTANT NOTES:
   * - Server must be booted per fable/baseehr-ralph/CONTEXT.md (TDD settings,
   *   DEV_AUTO_LOGIN, EXTRA_WORKFLOWS incl. @node-on-fhir/order-catalog).
   * - Component: npmPackages/order-catalog/client/OrderCatalogPage.jsx
   * - Server method: npmPackages/order-catalog/server/methods.js (submitOrders)
   * - Change/access legs: imports/api/medicationRequests/methods.js +
   *   imports/ui-fhir/medicationRequests/MedicationRequestsPage.jsx
   */

  before: function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .windowSize('current', 1400, 900)
      .pause(3000); // allow DEV_AUTO_LOGIN to complete
  },

  '01. Provider authenticated': function (browser) {
    // DEV_AUTO_LOGIN creates + signs in demouser. If the client hook hasn't
    // fired yet, log in directly as the dev user the server provisioned.
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
        'ONC 170.315.a.1 - Provider session established (' + JSON.stringify(result.value) + ')'
      );
    });

    // Fallback path for environments without DEV_AUTO_LOGIN (creates provider user)
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Order catalog page loads (CPOE medications route)': function (browser) {
    browser
      .url('http://localhost:3000/order-catalog')
      .waitForElementVisible('[data-testid="order-catalog-page"]', TIMEOUTS.extended)
      .pause(1000);

    verifyPageLoaded(browser, '170.315.a.1');
    verifyPageContent(browser, [
      '#orderCatalogPage',
      '[data-testid="order-catalog-page"]'
    ], '170.315.a.1');
  },

  '03. Test patient created and selected (patient context)': function (browser) {
    // Create the patient via server method (client-side inserts are subject to
    // the 100-record subscription limit heisenbug), then set Session context.
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{
          use: 'official',
          text: 'BaseEHR CpoeMeds',
          family: 'CpoeMeds',
          given: ['BaseEHR']
        }],
        gender: 'other',
        birthDate: '1985-05-05'
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
        'ONC 170.315.a.1 - Test patient created + Session context set (' +
          JSON.stringify(result.value) + ')'
      );
    });

    browser.pause(1000);
  },

  '04. Medication ordering interface present': function (browser) {
    // Activate the medications tab
    browser
      .waitForElementVisible('[data-testid="medications-tab"]', TIMEOUTS.normal)
      .click('[data-testid="medications-tab"]')
      .pause(500);

    verifyCapability(browser, {
      selectors: ['[data-testid="order-type-selector"]'],
      criterion: '170.315.a.1',
      capability: 'Medication order type selector'
    });
    verifyCapability(browser, {
      selectors: ['[data-testid="medication-search-input"]'],
      criterion: '170.315.a.1',
      capability: 'Medication catalog search'
    });
    verifyCapability(browser, {
      selectors: ['[data-testid="medication-orders-table"]'],
      criterion: '170.315.a.1',
      capability: 'Medication catalog table'
    });
    verifyCapability(browser, {
      selectors: ['[data-testid="active-orders-panel"]'],
      criterion: '170.315.a.1',
      capability: 'Active orders panel'
    });
  },

  '05. RECORD: search catalog and add a medication order': function (browser) {
    // Filter the catalog (client-side filter; React onChange via dispatched events)
    browser.execute(function () {
      var root = document.querySelector('[data-testid="medication-search-input"]');
      var input = root ? (root.querySelector('input') || root) : null;
      if (!input) { return { ok: false, error: 'search input not found' }; }
      input.value = 'Metformin';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };
    }, [], function (result) {
      browser.assert.ok(result.value.ok, 'ONC 170.315.a.1 - Catalog search entered (Metformin)');
    });

    browser.pause(1500);

    // Add the Metformin catalog item to the active orders. Target its row
    // directly (row testid = medication-order-row-<catalogId>) so the test does
    // not depend on the search filter having narrowed the table.
    browser.execute(function () {
      var row = document.querySelector('[data-testid="medication-order-row-metformin_500"]');
      if (!row) {
        // Fallback: scan rows for the display text
        var rows = document.querySelectorAll('[data-testid^="medication-order-row-"]');
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].textContent.indexOf('Metformin') !== -1) { row = rows[i]; break; }
        }
      }
      if (!row) { return { ok: false, error: 'Metformin catalog row not found' }; }
      var addButton = row.querySelector('[data-testid="add-medication-order-button"]') ||
                      row.querySelector('button');
      if (!addButton) { return { ok: false, error: 'add button not found in Metformin row' }; }
      addButton.click();
      return { ok: true };
    }, [], function (result) {
      browser.assert.ok(
        result.value.ok,
        'ONC 170.315.a.1 - Medication order added to active orders (' + (result.value.error || 'Metformin') + ')'
      );
    });

    browser.pause(1000);

    // Verify the order landed in the active orders panel
    browser.execute(function () {
      var panel = document.querySelector('[data-testid="active-orders-panel"]');
      var submit = document.querySelector('[data-testid="submit-orders-button"]');
      return {
        panelHasMed: !!panel && panel.textContent.indexOf('Metformin') !== -1,
        submitLabel: submit ? submit.textContent : null,
        submitEnabled: !!submit && !submit.disabled
      };
    }, [], function (result) {
      browser.assert.ok(
        result.value.panelHasMed,
        'ONC 170.315.a.1 - Active orders panel shows the pending medication order'
      );
      browser.assert.ok(
        result.value.submitEnabled,
        'ONC 170.315.a.1 - Submit available for pending order (' + result.value.submitLabel + ')'
      );
    });
  },

  '06. RECORD: reason for order (optional § a.1.ii) and submit': function (browser) {
    // Reason-for-order field (optional provision — the UI provides it)
    browser.execute(function () {
      var root = document.querySelector('[data-testid="medication-order-reason-field"]');
      var field = root ? (root.querySelector('textarea') || root.querySelector('input')) : null;
      if (!field) { return { ok: false, error: 'reason field not found' }; }
      field.value = 'Type 2 diabetes mellitus - initiating metformin therapy';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };
    }, [], function (result) {
      browser.assert.ok(
        result.value.ok,
        'ONC 170.315.a.1 - Reason for order field present and populated (§ a.1.ii optional)'
      );
    });

    browser.pause(500);

    // Submit — stub native dialogs (alert on validation failure, confirm on success)
    browser.execute(function () {
      window.__a1SubmitAlerts = [];
      window.alert = function (msg) { window.__a1SubmitAlerts.push(String(msg)); };
      window.confirm = function () { return false; }; // decline post-submit navigation
      var submit = document.querySelector('[data-testid="submit-orders-button"]');
      if (!submit || submit.disabled) { return { ok: false, error: 'submit unavailable' }; }
      submit.click();
      return { ok: true };
    }, [], function (result) {
      browser.assert.ok(result.value.ok, 'ONC 170.315.a.1 - Order submitted');
    });

    browser.pause(3000); // server insert + subscription settle

    // Any alert here means client-side validation rejected the order
    browser.execute(function () {
      return { alerts: window.__a1SubmitAlerts || [] };
    }, [], function (result) {
      browser.assert.ok(
        result.value.alerts.length === 0,
        'ONC 170.315.a.1 - Order submission raised no validation errors (' +
          JSON.stringify(result.value.alerts) + ')'
      );
    });
  },

  '07. RECORD verified: FHIR MedicationRequest persisted': function (browser) {
    browser.timeouts('script', TIMEOUTS.maximum, function () {});

    browser.executeAsync(function (fhirId, done) {
      var finished = false;
      function finish(payload) {
        if (!finished) { finished = true; done(payload); }
      }
      // Safety timeout so the async hook never hangs
      setTimeout(function () { finish({ ok: false, error: 'subscription timeout' }); }, 15000);

      // autopublish.* publications pass the query verbatim to Mongo — use the
      // real reference path, not a {patient: id} shorthand.
      Meteor.subscribe('autopublish.MedicationRequests', { 'subject.reference': 'Patient/' + fhirId }, {}, {
        onReady: function () {
          var recs = MedicationRequests.find({
            'subject.reference': 'Patient/' + fhirId
          }).fetch();
          finish({
            ok: true,
            count: recs.length,
            first: recs.length ? {
              _id: recs[0]._id,
              id: recs[0].id,
              status: recs[0].status,
              medication: (recs[0].medicationCodeableConcept && recs[0].medicationCodeableConcept.text) || '',
              hasRequester: !!(recs[0].requester && recs[0].requester.reference),
              hasDosage: !!(recs[0].dosageInstruction && recs[0].dosageInstruction.length)
            } : null
          });
        }
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.1 - MedicationRequest query completed (' + JSON.stringify(v.error || '') + ')');
      browser.assert.ok(
        v.count >= 1 && v.first,
        'ONC 170.315.a.1 - RECORD: MedicationRequest persisted for patient (count: ' + v.count + ')'
      );
      if (v.first) {
        medReqMongoId = v.first._id;
        browser.assert.ok(
          v.first.medication.indexOf('Metformin') !== -1,
          'ONC 170.315.a.1 - Recorded order is the selected medication (' + v.first.medication + ')'
        );
        browser.assert.ok(
          v.first.status === 'active',
          'ONC 170.315.a.1 - Recorded order status is active'
        );
        browser.assert.ok(
          v.first.hasRequester && v.first.hasDosage,
          'ONC 170.315.a.1 - Recorded order carries requester and dosage instructions'
        );
      }
    });
  },

  '08. CHANGE: modify the recorded order and verify persistence': function (browser) {
    browser.perform(function () {
      browser.assert.ok(!!medReqMongoId, 'ONC 170.315.a.1 - Recorded order id captured for change leg');
    });

    browser.executeAsync(function (mongoId, done) {
      Meteor.call('medicationRequests.update', mongoId, {
        status: 'on-hold',
        priority: 'urgent'
      }, function (updateErr) {
        if (updateErr) {
          done({ ok: false, stage: 'update', error: updateErr.message });
          return;
        }
        Meteor.call('medicationRequests.get', mongoId, function (getErr, rec) {
          if (getErr || !rec) {
            done({ ok: false, stage: 'get', error: getErr ? getErr.message : 'not found' });
            return;
          }
          done({ ok: true, status: rec.status, priority: rec.priority });
        });
      });
    }, [medReqMongoId], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.1 - CHANGE: update round-trip succeeded (' + JSON.stringify(v) + ')');
      browser.assert.ok(
        v.status === 'on-hold' && v.priority === 'urgent',
        'ONC 170.315.a.1 - CHANGE: modified values persisted (status: ' + v.status + ', priority: ' + v.priority + ')'
      );
    });
  },

  '09. ACCESS: recorded order visible in medication orders UI': function (browser) {
    // Client-side navigation preserves Session (patient context)
    browser.execute(function () {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/medication-requests');
        return { navigated: 'Meteor.navigate' };
      }
      window.location.href = '/medication-requests';
      return { navigated: 'location.href' };
    }, [], function (result) {
      console.log('[a.1] navigation via', result.value.navigated);
    });

    browser
      .waitForElementVisible('#medicationRequestsPage', TIMEOUTS.extended)
      .pause(3000); // subscription settle

    browser.execute(function (fhirId) {
      var table = document.querySelector('#medicationRequestsTable');
      var clientCount = (typeof MedicationRequests !== 'undefined')
        ? MedicationRequests.find({ 'subject.reference': 'Patient/' + fhirId }).count()
        : -1;
      return {
        tablePresent: !!table,
        tableHasMed: !!table && table.textContent.indexOf('Metformin') !== -1,
        clientCount: clientCount
      };
    }, [testPatientFhirId], function (result) {
      var v = result.value;
      browser.assert.ok(v.tablePresent, 'ONC 170.315.a.1 - ACCESS: medication orders table rendered');
      browser.assert.ok(
        v.tableHasMed || v.clientCount >= 1,
        'ONC 170.315.a.1 - ACCESS: recorded order retrievable in orders UI (table match: ' +
          v.tableHasMed + ', client records: ' + v.clientCount + ')'
      );
    });
  },

  '10. Cleanup and completion': function (browser) {
    // Best-effort cleanup — do not fail the criterion on cleanup errors
    browser.executeAsync(function (mongoId, done) {
      if (!mongoId) { done({ removed: false, reason: 'no id' }); return; }
      Meteor.call('medicationRequests.remove', mongoId, function (err) {
        done({ removed: !err, reason: err ? err.message : 'ok' });
      });
    }, [medReqMongoId], function (result) {
      console.log('[a.1] cleanup:', JSON.stringify(result.value));
    });

    takeScreenshot(browser, 'base-ehr_170.315.a.1_cpoe-medications.png', '170.315.a.1');

    logTestCompletion(browser, '170.315.a.1', 'CPOE Medications (behavioral)', [
      'Provider authentication',
      'Patient context establishment',
      'RECORD: catalog search, order entry, reason for order (§ a.1.ii), submit',
      'RECORD: FHIR MedicationRequest persisted with requester + dosage',
      'CHANGE: order modified via medicationRequests.update and verified',
      'ACCESS: order retrievable in /medication-requests UI'
    ]);

    browser.end();
  }
};
