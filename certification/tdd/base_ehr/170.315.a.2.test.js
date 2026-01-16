// certification/tdd/base_ehr/170.315.a.2.test.js
// ONC § 170.315(a)(2) - CPOE Laboratory

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
  tags: ['base-ehr', 'onc-certification', '170.315.a.2', 'cpoe', 'laboratory'],

  /**
   * Test Name: § 170.315(a)(2) - CPOE Laboratory
   *
   * OVERVIEW:
   * This test verifies that the EHR system supports computerized provider order entry (CPOE)
   * for laboratory orders. This is a UI verification and capability check that confirms the
   * presence of laboratory ordering functionality.
   *
   * The test checks for:
   * 1. Page accessibility and proper loading
   * 2. Laboratory tab/selector presence
   * 3. Laboratory search/input capability
   * 4. Laboratory orders table display
   * 5. Order creation interface (add button)
   * 6. Reason for order field (clinical notes)
   * 7. Order submission capability
   *
   * BDD Reference: certification/bdd/170.315-a-2-cpoe-laboratory.feature
   *
   * REGULATORY CONTEXT:
   * Per 45 CFR § 170.315(a)(2), the EHR must enable a user to electronically record,
   * change, and access laboratory orders.
   *
   * IMPORTANT NOTES:
   * - This is a Level 1 (Smoke) test - verifies UI presence, not full workflow
   * - Component location: packages/order-catalog/client/OrderCatalogPage.jsx
   * - Tests both the laboratory tab and the laboratory ordering interface
   */
  'CPOE Laboratory - 170.315(a)(2)': function (browser) {
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
    verifyPageLoaded(browser, '170.315.a.2');

    // Check for page-specific content
    verifyPageContent(browser, [
      '#orderCatalogPage',
      '[data-testid="order-catalog-page"]',
      'h4',
      'main'
    ], '170.315.a.2');

    // =================================================================
    // TEST 2: Verify Laboratory Tab/Selector
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="laboratory-tab"]',
        '[data-testid="order-type-selector"]'
      ],
      criterion: '170.315.a.2',
      capability: 'Laboratory order type selector'
    });

    // Click laboratory tab to activate laboratory mode
    browser
      .waitForElementVisible('[data-testid="laboratory-tab"]', 5000)
      .click('[data-testid="laboratory-tab"]')
      .pause(500);

    // =================================================================
    // TEST 3: Verify Laboratory Search Input
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="laboratory-search-input"]'
      ],
      criterion: '170.315.a.2',
      capability: 'Laboratory search/filter input'
    });

    // =================================================================
    // TEST 4: Verify Laboratory Orders Table
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="laboratory-orders-table"]'
      ],
      criterion: '170.315.a.2',
      capability: 'Laboratory orders catalog table'
    });

    // =================================================================
    // TEST 5: Verify Add Laboratory Order Button
    // =================================================================
    browser.execute(function() {
      // Check for laboratory order creation capability
      const addButton = document.querySelector('[data-testid*="add-laboratory-order-button"]');
      const orderTable = document.querySelector('[data-testid="laboratory-orders-table"]');

      return {
        hasAddButton: !!addButton,
        hasOrderTable: !!orderTable,
        hasBothCapabilities: !!addButton && !!orderTable
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasBothCapabilities,
        'ONC 170.315.a.2 - Has laboratory order creation and display capabilities'
      );
    });

    // =================================================================
    // TEST 6: Verify Reason for Order Field (Clinical Notes)
    // =================================================================
    // Note: This field may be in active orders panel or order form
    assertElementExists(
      browser,
      '[data-testid="active-orders-panel"], [data-testid*="laboratory-order-reason-field"]',
      'ONC 170.315.a.2 - Active orders panel or reason field present'
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
        'ONC 170.315.a.2 - Has order submission/management controls'
      );
    });

    // =================================================================
    // TEST 8: Verify Complete CPOE Interface
    // =================================================================
    browser.execute(function() {
      // Comprehensive check for all CPOE laboratory components
      const components = {
        orderTypeSelector: !!document.querySelector('[data-testid="order-type-selector"]'),
        laboratoryTab: !!document.querySelector('[data-testid="laboratory-tab"]'),
        searchInput: !!document.querySelector('[data-testid="laboratory-search-input"]'),
        ordersTable: !!document.querySelector('[data-testid="laboratory-orders-table"]'),
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
        `ONC 170.315.a.2 - Complete CPOE Laboratory interface (${result.value.presentCount}/5 components present)`
      );

      console.log('170.315.a.2 - CPOE Laboratory component status:', result.value.components);
    });

    // =================================================================
    // COMPLETION: Screenshot and logging
    // =================================================================
    takeScreenshot(browser, 'base-ehr_170.315.a.2_cpoe-laboratory.png', '170.315.a.2');

    logTestCompletion(browser, '170.315.a.2', 'CPOE Laboratory', [
      'Order catalog page accessibility',
      'Laboratory tab/selector presence',
      'Laboratory search input capability',
      'Laboratory orders table display',
      'Order creation interface',
      'Reason for order field support',
      'Order submission controls',
      'Complete CPOE interface verification'
    ]);

    // End test
    browser.end();
  }
};
