// certification/tdd/templates/test-template.js
// Template for creating new ONC certification Nightwatch tests

// Import helpers
const { loginAsProvider, loginAsPatient } = require('../helpers/authentication-helper');
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
  tags: ['base-ehr', 'onc-certification', '170.315.X.Y', 'category'],

  /**
   * Test Name: § 170.315(X)(Y) - [Criterion Title]
   *
   * OVERVIEW:
   * This test verifies that the EHR system supports [brief description of what
   * the criterion requires]. This is a [type of test - e.g., UI verification,
   * capability check, workflow test] that confirms [key capabilities].
   *
   * The test checks for:
   * 1. [First key capability]
   * 2. [Second key capability]
   * 3. [Third key capability]
   *
   * BDD Reference: certification/bdd/170.315-X-Y-[name].feature
   *
   * REGULATORY CONTEXT:
   * [Brief note about the regulatory requirement from 45 CFR § 170.315(X)(Y)]
   *
   * IMPORTANT NOTES:
   * [Any special considerations, expiration dates, or dependencies]
   */
  '[Criterion Title] - 170.315(X)(Y)': function (browser) {
    // =================================================================
    // SETUP: Navigate and authenticate
    // =================================================================
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Authenticate as appropriate user type
    loginAsProvider(browser); // Or loginAsPatient(browser)

    // Navigate to the specific page under test
    browser
      .url('http://localhost:3000/[route-path]')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to fully render

    // =================================================================
    // TEST 1: Verify page loads successfully
    // =================================================================
    verifyPageLoaded(browser, '170.315.X.Y');

    // Check for page-specific content
    verifyPageContent(browser, [
      '#[pageId]',
      '[data-testid="[page-testid]"]',
      '.[page-class]',
      'h1',
      'h2',
      'main',
      '.page-content'
    ], '170.315.X.Y');

    // =================================================================
    // TEST 2: Verify [First Capability]
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="[capability-element]"]',
        '#[capability-id]',
        '.[capability-class]'
      ],
      criterion: '170.315.X.Y',
      capability: '[Description of what is being verified]'
    });

    // =================================================================
    // TEST 3: Verify [Second Capability]
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="[another-capability]"]',
        '#[another-id]'
      ],
      criterion: '170.315.X.Y',
      capability: '[Description of second capability]'
    });

    // =================================================================
    // TEST 4: Verify [Third Capability]
    // =================================================================
    assertElementExists(
      browser,
      '[data-testid="[element-testid]"]',
      'ONC 170.315.X.Y - [Description of assertion]'
    );

    // =================================================================
    // TEST 5: Advanced capability check (using execute)
    // =================================================================
    browser.execute(function() {
      // Custom JavaScript to check for specific capability
      const hasCapability = document.querySelector('[data-testid="capability"]');
      const hasFeature = document.querySelector('[data-testid="feature"]');

      return {
        hasCapability: !!hasCapability,
        hasFeature: !!hasFeature,
        combinedCheck: hasCapability && hasFeature
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.combinedCheck,
        'ONC 170.315.X.Y - [Description of combined check]'
      );
    });

    // =================================================================
    // TEST 6: Verify multiple data type support (if applicable)
    // =================================================================
    browser.execute(function() {
      // Check for support of multiple data types/triggers
      const dataTypes = {
        type1: !!document.querySelector('[data-testid="type1"]'),
        type2: !!document.querySelector('[data-testid="type2"]'),
        type3: !!document.querySelector('[data-testid="type3"]')
      };

      const supportedCount = Object.values(dataTypes).filter(Boolean).length;

      return {
        dataTypes: dataTypes,
        supportedCount: supportedCount,
        hasMultipleTypes: supportedCount >= 2
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasMultipleTypes,
        `ONC 170.315.X.Y - Supports multiple data types (${result.value.supportedCount} types found)`
      );
    });

    // =================================================================
    // COMPLETION: Screenshot and logging
    // =================================================================
    takeScreenshot(browser, 'base-ehr_170.315.X.Y_[name].png', '170.315.X.Y');

    logTestCompletion(browser, '170.315.X.Y', '[Criterion Title]', [
      '[First capability verified]',
      '[Second capability verified]',
      '[Third capability verified]',
      '[Fourth capability verified]'
    ]);

    // End test
    browser.end();
  }
};

// =================================================================
// TEMPLATE USAGE INSTRUCTIONS
// =================================================================
/*

To use this template for a new test:

1. Copy this file to certification/tdd/base_ehr/170.315.X.Y.test.js
   (replace X.Y with actual criterion number)

2. Replace placeholders:
   - [Criterion Title] - e.g., "CPOE Medications", "Demographics"
   - [route-path] - e.g., "/cpoe/medications", "/patients/new"
   - [pageId] - e.g., "cpoeMedicationsPage", "demographicsPage"
   - [page-testid] - e.g., "cpoe-medications-page"
   - [capability-element] - e.g., "create-order-button"
   - All [bracketed placeholders]

3. Choose authentication method:
   - loginAsProvider(browser) - For clinical workflows
   - loginAsPatient(browser) - For patient-facing features
   - loginAsAdmin(browser) - For administrative features

4. Customize tests:
   - Remove tests that don't apply
   - Add additional tests as needed
   - Reference BDD file for scenario coverage

5. Update tags:
   - Keep 'base-ehr' and 'onc-certification'
   - Add specific criterion tag (e.g., '170.315.a.1')
   - Add category tags (e.g., 'cpoe', 'demographics', 'cds')

6. Add to test runner:
   - Update certification/tdd/base_ehr/run-base-ehr-tests.sh
   - Update BASE_EHR_TESTS.md

Example replacements for CPOE Medications (170.315.a.1):
   [Criterion Title] → CPOE Medications
   [route-path] → /cpoe/medications
   [pageId] → cpoeMedicationsPage
   [page-testid] → cpoe-medications-page
   [capability-element] → create-medication-order-button

*/
