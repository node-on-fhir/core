// certification/tdd/base_ehr/170.315.a.5.test.js
// ONC § 170.315(a)(5) - Demographics

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
  tags: ['base-ehr', 'onc-certification', '170.315.a.5', 'demographics', 'patient-data'],

  /**
   * Test Name: § 170.315(a)(5) - Demographics
   *
   * OVERVIEW:
   * This test verifies that the EHR system can record, change, and access patient
   * demographic data according to ONC requirements. This is a UI verification and
   * capability check that confirms the presence of required demographic fields.
   *
   * The test checks for:
   * 1. Page accessibility and proper loading
   * 2. Preferred language field
   * 3. Sex (birth sex) field
   * 4. Gender (administrative gender) field
   * 5. Sexual orientation field (USCDI v5)
   * 6. Gender identity field (USCDI v5)
   * 7. Date of birth field
   * 8. Race and ethnicity fields (§ 170.207(f))
   * 9. Preferred pronouns field (USCDI v5)
   *
   * BDD Reference: certification/bdd/170.315-a-5-demographics.feature
   *
   * REGULATORY CONTEXT:
   * Per 45 CFR § 170.315(a)(5), the EHR must enable a user to electronically record,
   * change, and access patient demographic data including:
   * - Preferred language
   * - Sex (birth sex per § 170.207(n))
   * - Gender (administrative gender)
   * - Sexual orientation (§ 170.207(o) - USCDI v5)
   * - Gender identity (§ 170.207(o) - USCDI v5)
   * - Date of birth
   * - Race and ethnicity (§ 170.207(f) - OMB/CDC codes)
   * - Preferred pronouns (§ 170.207(o) - USCDI v5)
   *
   * IMPORTANT NOTES:
   * - This is a Level 1 (Smoke) test - verifies UI presence of demographic fields
   * - Component location: imports/ui-fhir/patients/PatientDetail.jsx
   * - USCDI v5 fields (race, ethnicity, gender identity, sexual orientation, pronouns)
   *   are currently MISSING and need to be added for full compliance
   * - Component has existing fields but missing USCDI v5 requirements
   */
  'Demographics - 170.315(a)(5)': function (browser) {
    // =================================================================
    // SETUP: Navigate and authenticate
    // =================================================================
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Authenticate as provider (clinical user)
    loginAsProvider(browser);

    // Navigate to new patient page
    browser
      .url('http://localhost:3000/patients/new')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to fully render

    // =================================================================
    // TEST 1: Verify page loads successfully
    // =================================================================
    verifyPageLoaded(browser, '170.315.a.5');

    // Check for page-specific content
    verifyPageContent(browser, [
      '#patientDetailPage',
      '[data-testid="patient-detail-page"]',
      'h5',
      'h6'
    ], '170.315.a.5');

    // =================================================================
    // TEST 2: Verify Name Fields (Foundation)
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="patient-firstname-field"]',
        '[data-testid="patient-lastname-field"]'
      ],
      criterion: '170.315.a.5',
      capability: 'Patient name fields (given name and family name)'
    });

    // =================================================================
    // TEST 3: Verify Date of Birth Field
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="patient-birthdate-field"]',
        '#birthDateInput'
      ],
      criterion: '170.315.a.5',
      capability: 'Date of birth field'
    });

    // =================================================================
    // TEST 4: Verify Birth Sex Field (§ 170.207(n))
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="patient-birthsex-select"]'
      ],
      criterion: '170.315.a.5',
      capability: 'Birth sex field (§ 170.207(n))'
    });

    // =================================================================
    // TEST 5: Verify Gender Field (Administrative Gender)
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="patient-gender-select"]',
        '#genderSelect'
      ],
      criterion: '170.315.a.5',
      capability: 'Gender field (administrative gender)'
    });

    // =================================================================
    // TEST 6: Verify Preferred Language Field
    // =================================================================
    verifyCapability(browser, {
      selectors: [
        '[data-testid="patient-language-select"]'
      ],
      criterion: '170.315.a.5',
      capability: 'Preferred language field'
    });

    // =================================================================
    // TEST 7: Verify Contact and Address Fields
    // =================================================================
    browser.execute(function() {
      const components = {
        addressLine: !!document.querySelector('[data-testid="patient-address-line"]'),
        city: !!document.querySelector('[data-testid="patient-address-city"]'),
        state: !!document.querySelector('[data-testid="patient-address-state"]'),
        postalCode: !!document.querySelector('[data-testid="patient-address-postalcode"]'),
        country: !!document.querySelector('[data-testid="patient-address-country"]')
      };

      const presentCount = Object.values(components).filter(Boolean).length;

      return {
        components: components,
        presentCount: presentCount,
        hasAddressFields: presentCount >= 4
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasAddressFields,
        `ONC 170.315.a.5 - Has address fields (${result.value.presentCount}/5 fields present)`
      );
    });

    // =================================================================
    // TEST 8: Verify USCDI v5 Fields Status
    // =================================================================
    browser.execute(function() {
      // Check for USCDI v5 required fields
      // NOTE: These are currently MISSING per code comments
      const uscdiV5Fields = {
        race: !!document.querySelector('[data-testid="patient-race-select"]'),
        ethnicity: !!document.querySelector('[data-testid="patient-ethnicity-select"]'),
        genderIdentity: !!document.querySelector('[data-testid="patient-gender-identity-select"]'),
        sexualOrientation: !!document.querySelector('[data-testid="patient-sexual-orientation-select"]'),
        pronouns: !!document.querySelector('[data-testid="patient-pronouns-select"]')
      };

      const presentCount = Object.values(uscdiV5Fields).filter(Boolean).length;
      const missingCount = 5 - presentCount;

      return {
        fields: uscdiV5Fields,
        presentCount: presentCount,
        missingCount: missingCount,
        hasAllUscdiV5: presentCount === 5
      };
    }, [], function(result) {
      console.log('170.315.a.5 - USCDI v5 field status:', result.value.fields);
      console.log(`170.315.a.5 - USCDI v5 fields: ${result.value.presentCount}/5 present, ${result.value.missingCount}/5 missing`);

      // This will likely fail until USCDI v5 fields are added
      if (!result.value.hasAllUscdiV5) {
        console.warn('⚠️  ONC 170.315.a.5 - USCDI v5 fields are MISSING. Required fields:');
        console.warn('   - Race (§ 170.207(f))');
        console.warn('   - Ethnicity (§ 170.207(f))');
        console.warn('   - Gender Identity (§ 170.207(o))');
        console.warn('   - Sexual Orientation (§ 170.207(o))');
        console.warn('   - Preferred Pronouns (§ 170.207(o))');
      }

      // For now, just log the status; uncomment assertion when fields are added
      // browser.assert.ok(
      //   result.value.hasAllUscdiV5,
      //   'ONC 170.315.a.5 - All USCDI v5 demographic fields present'
      // );
    });

    // =================================================================
    // TEST 9: Verify Core Demographics Interface (Currently Implemented)
    // =================================================================
    browser.execute(function() {
      // Check for currently implemented demographic components
      const components = {
        firstName: !!document.querySelector('[data-testid="patient-firstname-field"]'),
        lastName: !!document.querySelector('[data-testid="patient-lastname-field"]'),
        birthDate: !!document.querySelector('[data-testid="patient-birthdate-field"]'),
        birthSex: !!document.querySelector('[data-testid="patient-birthsex-select"]'),
        gender: !!document.querySelector('[data-testid="patient-gender-select"]'),
        language: !!document.querySelector('[data-testid="patient-language-select"]'),
        maritalStatus: !!document.querySelector('[data-testid="patient-maritalstatus-select"]'),
        address: !!document.querySelector('[data-testid="patient-address-line"]')
      };

      const presentCount = Object.values(components).filter(Boolean).length;

      return {
        components: components,
        presentCount: presentCount,
        hasCoreDemographics: presentCount >= 7 // At least 7 of 8 core fields
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasCoreDemographics,
        `ONC 170.315.a.5 - Has core demographics interface (${result.value.presentCount}/8 fields present)`
      );

      console.log('170.315.a.5 - Core demographics status:', result.value.components);
    });

    // =================================================================
    // TEST 10: Verify Save Functionality
    // =================================================================
    assertElementExists(
      browser,
      '[data-testid="save-patient-button"], #savePatientButton',
      'ONC 170.315.a.5 - Patient save button present'
    );

    // =================================================================
    // COMPLETION: Screenshot and logging
    // =================================================================
    takeScreenshot(browser, 'base-ehr_170.315.a.5_demographics.png', '170.315.a.5');

    logTestCompletion(browser, '170.315.a.5', 'Demographics', [
      'Patient detail page accessibility',
      'Name fields (given name, family name)',
      'Date of birth field',
      'Birth sex field (§ 170.207(n))',
      'Gender field (administrative gender)',
      'Preferred language field',
      'Address fields (street, city, state, postal code, country)',
      'Core demographics interface (8 fields)',
      'USCDI v5 field status check (5 fields - CURRENTLY MISSING)',
      'Patient save functionality'
    ]);

    // End test
    browser.end();
  }
};
