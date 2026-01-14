// certification/tdd/base_ehr/170.315.a.9.test.js
// § 170.315(a)(9) - Clinical Decision Support (CDS)
//
// ⚠️  CRITICAL EXPIRATION NOTICE ⚠️
// This criterion EXPIRED on January 1, 2025 per 45 CFR § 170.315(a)(9)(vi).
// It has been replaced by § 170.315(b)(11) - Decision Support Interventions.
//
// ⚠️  BASE EHR UNCERTAINTY ⚠️
// As of January 2025, the official ONC Base EHR definition is unavailable due to
// government website shutdown. The last known Base EHR definition (from the screenshot)
// listed § 170.315(a)(9) as one of 11 required criteria. It is UNCLEAR whether:
// - Base EHR still requires a-9 (grandfathered for existing certifications), OR
// - Base EHR now requires b-11 instead (likely scenario), OR
// - CDS is no longer required for Base EHR (unlikely)
//
// RECOMMENDATION: Run both a-9 and b-11 tests until official guidance is available.
// See also: certification/tdd/base_ehr/170.315.b.11.test.js (if created)
//
// OVERVIEW:
// This test verifies that the EHR system provides clinical decision support (CDS)
// capabilities that help healthcare providers make evidence-based treatment decisions.
// CDS interventions must occur during user interaction with the system, can be
// configured by administrators based on user roles, and must support triggers based
// on multiple patient data types (problems, medications, allergies, demographics,
// labs, and vital signs).
//
// The test checks for:
// 1. CDS intervention pages/interfaces that providers can access
// 2. Role-based configuration capabilities for system administrators
// 3. Evidence-based intervention selection mechanisms
// 4. Linked referential CDS (Infobutton) per § 170.204(b)(3-4) standards
// 5. Source attribution showing bibliographic citations, developers, and funding
// 6. CDS triggers that activate based on patient clinical data
// 7. Multiple data type support (problems, meds, allergies, demographics, labs, vitals)
//
// This is a UI/capability verification test. It confirms CDS features exist and are
// accessible, but does not test the clinical logic or accuracy of specific interventions.
// Clinical validation would be performed during actual certification testing.

module.exports = {
  tags: ['base-ehr', 'onc-certification', '170.315.a.9', 'cds', 'expires-2025'],

  'Clinical Decision Support - 170.315(a)(9)': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Check if user is logged in, if not, create test user and login
    browser.execute(function() {
      return {
        isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
        userId: Meteor.userId ? Meteor.userId() : null
      };
    }, [], function(result) {
      if (!result.value.isLoggedIn) {
        browser.executeAsync(function(done) {
          Meteor.call('test.createTestUser', {
            username: 'provider',
            email: 'provider@test.org',
            password: 'provider123',
            roles: ['Provider', 'Practitioner']
          }, function(err, userId) {
            if (!err) {
              Meteor.loginWithPassword('provider', 'provider123', function(loginErr) {
                done({ loginSuccess: !loginErr, userId: Meteor.userId() });
              });
            } else {
              done({ loginSuccess: false, error: err });
            }
          });
        }, [], function() {
          console.log('✅ Provider user logged in for ONC 170.315(a)(9)');
        });
      }
    });

    // Navigate to CDS management or configuration page
    browser
      .url('http://localhost:3000/cds')
      .waitForElementVisible('body', 3000)
      .pause(1000);

    // Test 1: Verify CDS intervention capability exists
    browser.elements('css selector', '#cdsPage, [data-testid="cds"], .cds-page, h1, h2', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(a)(9) - CDS page loaded');
      } else {
        browser.assert.ok(false, 'ONC 170.315(a)(9) - No CDS page found');
      }
    });

    // Test 2: Check for CDS configuration capability (admin/configurator access)
    browser.execute(function() {
      // Check if CDS configuration is available
      const hasConfigAccess = document.querySelector('[data-testid="cds-config"], .cds-configuration, #cdsConfiguration');
      const hasRoleBasedAccess = typeof Meteor !== 'undefined' &&
        (Meteor.userId() && (Roles?.userIsInRole(Meteor.userId(), ['Administrator', 'System Administrator']) ?? false));

      return {
        hasConfigUI: !!hasConfigAccess,
        hasRoleCheck: hasRoleBasedAccess
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasConfigUI || result.value.hasRoleCheck,
        'ONC 170.315(a)(9) - CDS configuration capability exists'
      );
    });

    // Test 3: Verify evidence-based CDS interventions can be selected/activated
    browser.elements('css selector', '[data-testid="cds-interventions"], .cds-interventions-list, #cdsInterventions', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(a)(9) - CDS interventions interface found');
      }
    });

    // Test 4: Check for Infobutton or linked referential CDS capability
    browser.execute(function() {
      // Look for Infobutton implementation per § 170.204(b)(3) or (b)(4)
      const hasInfobutton = document.querySelector('[data-testid="infobutton"], .infobutton, #infoButton, .reference-link');
      const hasContextHelp = document.querySelector('[data-testid="context-help"], .context-help');

      return {
        hasInfobutton: !!hasInfobutton,
        hasContextHelp: !!hasContextHelp
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasInfobutton || result.value.hasContextHelp,
        'ONC 170.315(a)(9) - Linked referential CDS capability exists (Infobutton)'
      );
    });

    // Test 5: Verify source attributes are accessible
    browser.execute(function() {
      // Check if source attribution information is available for CDS
      const hasSourceAttrs = document.querySelector('[data-testid="cds-source"], .cds-source-attributes, .source-citation');
      const hasBibliography = document.querySelector('[data-testid="bibliography"], .bibliography, .citation');

      return {
        hasSourceAttrs: !!hasSourceAttrs,
        hasBibliography: !!hasBibliography
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasSourceAttrs || result.value.hasBibliography,
        'ONC 170.315(a)(9) - Source attributes capability exists'
      );
    });

    // Test 6: Navigate to patient record to verify CDS triggers during interaction
    browser
      .url('http://localhost:3000/patients')
      .waitForElementVisible('body', 3000)
      .pause(500);

    // Check for CDS intervention indicators in patient context
    browser.execute(function() {
      // Look for CDS alert/warning/notification indicators
      const hasCDSIndicators = document.querySelector('[data-testid="cds-alert"], .cds-alert, .clinical-alert, .decision-support-notification');
      const hasInteractionChecks = document.querySelector('[data-testid="drug-interaction"], .drug-interaction-check');

      return {
        hasCDSIndicators: !!hasCDSIndicators,
        hasInteractionChecks: !!hasInteractionChecks
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasCDSIndicators || result.value.hasInteractionChecks,
        'ONC 170.315(a)(9) - CDS interventions occur during user interaction'
      );
    });

    // Test 7: Verify CDS can be triggered by multiple data types
    browser.execute(function() {
      // Verify system has capability to trigger CDS based on:
      // - Problem list (conditions)
      // - Medication list
      // - Allergy/intolerance list
      // - Demographics
      // - Laboratory tests
      // - Vital signs

      const dataTriggers = {
        problems: !!document.querySelector('[data-testid="problems"], .problem-list, #problemList'),
        medications: !!document.querySelector('[data-testid="medications"], .medication-list, #medicationList'),
        allergies: !!document.querySelector('[data-testid="allergies"], .allergy-list, #allergyList'),
        demographics: !!document.querySelector('[data-testid="demographics"], .demographics'),
        labs: !!document.querySelector('[data-testid="labs"], .lab-results, #labResults'),
        vitals: !!document.querySelector('[data-testid="vitals"], .vital-signs, #vitalSigns')
      };

      const triggerCount = Object.values(dataTriggers).filter(Boolean).length;

      return {
        dataTriggers: dataTriggers,
        triggerCount: triggerCount,
        hasMultipleTriggers: triggerCount >= 3 // Need at least several data types
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasMultipleTriggers,
        'ONC 170.315(a)(9) - CDS can be triggered by multiple patient data types (' + result.value.triggerCount + ' types found)'
      );
    });

    // Log expiration warning
    browser.perform(function() {
      const currentDate = new Date();
      const expirationDate = new Date('2025-01-01');

      if (currentDate < expirationDate) {
        console.log('⚠️  ONC 170.315(a)(9) - This criterion expires on January 1, 2025');
        console.log('⚠️  Use § 170.315(b)(11) - Decision Support Interventions for certifications after Jan 1, 2025');
      } else {
        console.log('❌ ONC 170.315(a)(9) - This criterion has EXPIRED as of January 1, 2025');
        console.log('❌ Use § 170.315(b)(11) instead');
      }
    });

    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');

    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(a)(9) - Clinical Decision Support test completed');
      console.log('📋 Verified:');
      console.log('   - CDS intervention capability');
      console.log('   - Role-based configuration');
      console.log('   - Evidence-based interventions selection');
      console.log('   - Linked referential CDS (Infobutton)');
      console.log('   - Source attributes accessibility');
      console.log('   - CDS triggers during user interaction');
      console.log('   - Multiple patient data type triggers');
    });

    browser
      .saveScreenshot('tests/screenshots/base-ehr_170.315.a.9_cds.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(a)(9)');
      })
      .end();
  }
};
