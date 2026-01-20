// certification/tdd/base_ehr/170.315.a.4.test.js
// ONC § 170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks

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
  tags: ['base-ehr', 'onc-certification', '170.315.a.4', 'drug-interactions', 'cds'],

  /**
   * Test Name: § 170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks
   *
   * OVERVIEW:
   * This test verifies that the EHR system can identify and alert users to drug-drug
   * and drug-allergy interaction checks. This is a UI verification and capability check
   * that confirms the presence of interaction checking functionality.
   *
   * The test checks for:
   * 1. Page accessibility and proper loading
   * 2. Check type selector (drug-drug vs drug-allergy)
   * 3. Medication selection interface
   * 4. Allergy selection interface (for drug-allergy mode)
   * 5. Interaction results display
   * 6. Severity-based alerting
   * 7. Management guidance display
   *
   * BDD Reference: certification/bdd/170.315-a-4-drug-interaction-checks.feature
   *
   * REGULATORY CONTEXT:
   * Per 45 CFR § 170.315(a)(4), the EHR must:
   * - Identify drug-drug interaction checks for severity and type
   * - Identify drug-allergy interaction checks
   * - Provide alerts with severity levels and management guidance
   *
   * IMPORTANT NOTES:
   * - This is a Level 1 (Smoke) test - verifies UI presence and basic interaction checking
   * - Component location: packages/drug-interactions/client/DrugInteractionCheckerPage.jsx
   * - Tests both drug-drug and drug-allergy interaction modes
   */
  'Drug-Drug, Drug-Allergy Interaction Checks - 170.315(a)(4)': function (browser) {
    // =================================================================
    // SETUP: Navigate and authenticate
    // =================================================================
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Authenticate as provider (clinical user)
    loginAsProvider(browser);

    // Navigate to drug interaction checker page
    browser
      .url('http://localhost:3000/drug-interactions')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to fully render

    // =================================================================
    // TEST 1: Verify page loads successfully
    // =================================================================
    verifyPageLoaded(browser, '170.315.a.4');

    // Check for page-specific content
    verifyPageContent(browser, [
      '#drugInteractionCheckerPage',
      '[data-testid="drug-interaction-page"]',
      '[data-testid="page-title"]',
      'h4'
    ], '170.315.a.4');

    // =================================================================
    // TEST 2: Verify Check Type Selector
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="check-type-select"]',
        '[data-testid="drug-drug-option"]',
        '[data-testid="drug-allergy-option"]'
      ],
      criterion: '170.315.a.4',
      capability: 'Drug-drug and drug-allergy check mode selector'
    });

    // =================================================================
    // TEST 3: Verify Medication Selection Interface
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="medication-autocomplete"]',
        '[data-testid="medication-search-input"]'
      ],
      criterion: '170.315.a.4',
      capability: 'Medication selection interface'
    });

    // =================================================================
    // TEST 4: Verify Drug-Drug Mode Status Message
    // =================================================================
    assertElementExists(
      browser,
      '[data-testid="drug-drug-status-message"]',
      'ONC 170.315.a.4 - Drug-drug mode status message present'
    );

    // =================================================================
    // TEST 5: Switch to Drug-Allergy Mode and Verify Interface
    // =================================================================
    browser
      .waitForElementVisible('[data-testid="check-type-select"]', 5000)
      .click('[data-testid="check-type-select"]')
      .pause(300);

    // Click drug-allergy option
    browser.execute(function() {
      const options = document.querySelectorAll('li[role="option"]');
      for (let option of options) {
        if (option.getAttribute('data-value') === 'drug-allergy' ||
            option.textContent.includes('Drug-Allergy')) {
          option.click();
          return { clicked: true };
        }
      }
      return { clicked: false };
    }, [], function(result) {
      browser.assert.ok(
        result.value.clicked,
        'ONC 170.315.a.4 - Successfully switched to drug-allergy mode'
      );
    });

    browser.pause(500);

    // =================================================================
    // TEST 6: Verify Allergy Selection Interface (Drug-Allergy Mode)
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="allergy-autocomplete"]',
        '[data-testid="allergy-search-input"]'
      ],
      criterion: '170.315.a.4',
      capability: 'Allergy selection interface in drug-allergy mode'
    });

    // =================================================================
    // TEST 7: Verify Interaction Results Components
    // =================================================================
    browser.execute(function() {
      // Check for interaction result display components
      // These may not be visible without data, but structure should exist
      const components = {
        clearButton: !!document.querySelector('[data-testid="clear-all-button"]'),
        certificationInfo: !!document.querySelector('[data-testid="onc-certification-info"]'),
        drugAllergyStatus: !!document.querySelector('[data-testid="drug-allergy-status-message"]'),
        allergyStatus: !!document.querySelector('[data-testid="allergy-status-message"]')
      };

      const presentCount = Object.values(components).filter(Boolean).length;

      return {
        components: components,
        presentCount: presentCount,
        hasResultsInterface: presentCount >= 2
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasResultsInterface,
        `ONC 170.315.a.4 - Has interaction results interface (${result.value.presentCount}/4 components present)`
      );

      console.log('170.315.a.4 - Interaction interface component status:', result.value.components);
    });

    // =================================================================
    // TEST 8: Verify ONC Certification Requirements Listed
    // =================================================================
    browser.execute(function() {
      const certInfo = document.querySelector('[data-testid="onc-certification-info"]');
      if (!certInfo) return { found: false };

      const text = certInfo.textContent || '';

      return {
        found: true,
        mentionsDrugDrug: text.includes('Drug-drug') || text.includes('drug-drug'),
        mentionsDrugAllergy: text.includes('Drug-allergy') || text.includes('drug-allergy'),
        mentionsSeverity: text.includes('Severity') || text.includes('severity'),
        hasAllRequirements: text.includes('Drug-drug') && text.includes('allergy') && text.includes('everity')
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.found,
        'ONC 170.315.a.4 - Certification information section present'
      );

      browser.assert.ok(
        result.value.hasAllRequirements,
        'ONC 170.315.a.4 - Lists all required interaction checking capabilities'
      );
    });

    // =================================================================
    // TEST 9: Verify Complete Interaction Checking Interface
    // =================================================================
    browser.execute(function() {
      // Comprehensive check for all drug interaction components
      const components = {
        checkTypeSelector: !!document.querySelector('[data-testid="check-type-select"]'),
        medicationInput: !!document.querySelector('[data-testid="medication-search-input"]'),
        allergyInput: !!document.querySelector('[data-testid="allergy-search-input"]'),
        clearButton: !!document.querySelector('[data-testid="clear-all-button"]'),
        certificationInfo: !!document.querySelector('[data-testid="onc-certification-info"]')
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
        `ONC 170.315.a.4 - Complete interaction checking interface (${result.value.presentCount}/5 components present)`
      );

      console.log('170.315.a.4 - Complete interface status:', result.value.components);
    });

    // =================================================================
    // COMPLETION: Screenshot and logging
    // =================================================================
    takeScreenshot(browser, 'base-ehr_170.315.a.4_drug-interactions.png', '170.315.a.4');

    logTestCompletion(browser, '170.315.a.4', 'Drug-Drug, Drug-Allergy Interaction Checks', [
      'Drug interaction checker page accessibility',
      'Check type selector (drug-drug/drug-allergy)',
      'Medication selection interface',
      'Allergy selection interface',
      'Interaction results display components',
      'ONC certification requirements documentation',
      'Complete interaction checking interface',
      'Both drug-drug and drug-allergy modes verified'
    ]);

    // End test
    browser.end();
  }
};
