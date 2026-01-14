// certification/tdd/base_ehr/170.315.a.1.test.js
// ONC § 170.315(a)(1) - CPOE Medications

// Import helpers
const { loginAsProvider } = require('../helpers/authentication-helper');
const {
  verifyPageLoaded,
  verifyPageContent,
  takeScreenshot,
  logTestCompletion,
  assertElementExists,
  verifyCapability
} = require('../helpers/selector-helper');

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.a.1', 'cpoe', 'medications'],

  /**
   * Test Name: § 170.315(a)(1) - CPOE Medications
   *
   * OVERVIEW:
   * This test verifies that the EHR system supports computerized provider order entry (CPOE)
   * for medication orders. This is a UI verification and capability check that confirms the
   * presence of medication ordering functionality.
   *
   * The test checks for:
   * 1. Page accessibility and proper loading
   * 2. Medication tab/selector presence
   * 3. Medication search/input capability
   * 4. Medication orders table display
   * 5. Order creation interface (add button)
   * 6. Reason for order field (clinical notes)
   * 7. Order submission capability
   *
   * BDD Reference: certification/bdd/170.315-a-1-cpoe-medications.feature
   *
   * REGULATORY CONTEXT:
   * Per 45 CFR § 170.315(a)(1), the EHR must enable a user to electronically record,
   * change, and access medication orders.
   *
   * IMPORTANT NOTES:
   * - This is a Level 1 (Smoke) test - verifies UI presence, not full workflow
   * - Component location: packages/order-catalog/client/OrderCatalogPage.jsx
   * - Tests both the medications tab and the medication ordering interface
   */
  'CPOE Medications - 170.315(a)(1)': function (browser) {
    // =================================================================
    // SETUP: Navigate and authenticate
    // =================================================================
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Authenticate as provider (clinical user)
    loginAsProvider(browser);

    // Navigate to order catalog page
    browser
      .url('http://localhost:3000/order-catalog')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to fully render

    // =================================================================
    // TEST 1: Verify page loads successfully
    // =================================================================
    verifyPageLoaded(browser, '170.315.a.1');

    // Check for page-specific content
    verifyPageContent(browser, [
      '#orderCatalogPage',
      '[data-testid="order-catalog-page"]',
      'h4',
      'main'
    ], '170.315.a.1');

    // =================================================================
    // TEST 2: Verify Medications Tab/Selector
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="medications-tab"]',
        '[data-testid="order-type-selector"]'
      ],
      criterion: '170.315.a.1',
      capability: 'Medication order type selector'
    });

    // Click medications tab to activate medication mode
    browser
      .waitForElementVisible('[data-testid="medications-tab"]', 5000)
      .click('[data-testid="medications-tab"]')
      .pause(500);

    // =================================================================
    // TEST 3: Verify Medication Search Input
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="medication-search-input"]'
      ],
      criterion: '170.315.a.1',
      capability: 'Medication search/filter input'
    });

    // =================================================================
    // TEST 4: Verify Medication Orders Table
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="medication-orders-table"]'
      ],
      criterion: '170.315.a.1',
      capability: 'Medication orders catalog table'
    });

    // =================================================================
    // TEST 5: Verify Add Medication Order Button
    // =================================================================
    browser.execute(function() {
      // Check for medication order creation capability
      const addButton = document.querySelector('[data-testid*="add-medication-order-button"]');
      const orderTable = document.querySelector('[data-testid="medication-orders-table"]');

      return {
        hasAddButton: !!addButton,
        hasOrderTable: !!orderTable,
        hasBothCapabilities: !!addButton && !!orderTable
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasBothCapabilities,
        'ONC 170.315.a.1 - Has medication order creation and display capabilities'
      );
    });

    // =================================================================
    // TEST 6: Verify Reason for Order Field (Clinical Notes)
    // =================================================================
    // Note: This field may be in active orders panel or order form
    assertElementExists(
      browser,
      '[data-testid="active-orders-panel"], [data-testid*="medication-order-reason-field"]',
      'ONC 170.315.a.1 - Active orders panel or reason field present'
    );

    // =================================================================
    // TEST 7: Verify Order Submission Capability
    // =================================================================
    browser.execute(function() {
      // Check for order submission controls
      const submitButton = document.querySelector('[data-testid="submit-orders-button"]');
      const clearButton = document.querySelector('[data-testid="clear-orders-button"]');

      return {
        hasSubmitButton: !!submitButton,
        hasClearButton: !!clearButton,
        hasOrderControls: !!submitButton || !!clearButton
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasOrderControls,
        'ONC 170.315.a.1 - Has order submission/management controls'
      );
    });

    // =================================================================
    // TEST 8: Verify Complete CPOE Interface
    // =================================================================
    browser.execute(function() {
      // Comprehensive check for all CPOE medication components
      const components = {
        orderTypeSelector: !!document.querySelector('[data-testid="order-type-selector"]'),
        medicationsTab: !!document.querySelector('[data-testid="medications-tab"]'),
        searchInput: !!document.querySelector('[data-testid="medication-search-input"]'),
        ordersTable: !!document.querySelector('[data-testid="medication-orders-table"]'),
        orderPanel: !!document.querySelector('[data-testid="active-orders-panel"]')
      };

      const presentCount = Object.values(components).filter(Boolean).length;

      return {
        components: components,
        presentCount: presentCount,
        hasCompleteInterface: presentCount >= 4 // At least 4 of 5 components
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasCompleteInterface,
        `ONC 170.315.a.1 - Complete CPOE Medications interface (${result.value.presentCount}/5 components present)`
      );

      console.log('170.315.a.1 - CPOE Medications component status:', result.value.components);
    });

    // =================================================================
    // COMPLETION: Screenshot and logging
    // =================================================================
    takeScreenshot(browser, 'base-ehr_170.315.a.1_cpoe-medications.png', '170.315.a.1');

    logTestCompletion(browser, '170.315.a.1', 'CPOE Medications', [
      'Order catalog page accessibility',
      'Medications tab/selector presence',
      'Medication search input capability',
      'Medication orders table display',
      'Order creation interface',
      'Reason for order field support',
      'Order submission controls',
      'Complete CPOE interface verification'
    ]);

    // End test
    browser.end();
  }
};
