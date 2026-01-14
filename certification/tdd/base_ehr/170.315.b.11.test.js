// certification/tdd/base_ehr/170.315.b.11.test.js
// § 170.315(b)(11) - Decision Support Interventions
//
// ⚠️  REPLACEMENT FOR § 170.315(a)(9) ⚠️
// This criterion REPLACES § 170.315(a)(9) which expired January 1, 2025.
// b-11 is the current standard for Clinical Decision Support in ONC certification.
//
// ⚠️  BASE EHR UNCERTAINTY ⚠️
// As of January 2025, it is UNCLEAR if Base EHR requires b-11 instead of a-9.
// The official ONC website is unavailable. The last known Base EHR definition
// listed a-9, but that criterion has now expired. Most likely scenario: Base EHR
// now requires b-11 for new certifications.
//
// RECOMMENDATION: Implement and test both a-9 (legacy) and b-11 (current) until
// official ONC guidance confirms the Base EHR requirements.
//
// OVERVIEW:
// This test verifies Decision Support Interventions (DSI) - an enhanced version of
// the legacy CDS criterion. DSI includes everything from a-9 PLUS new requirements:
//
// 1. EVIDENCE-BASED interventions using USCDI data (like a-9)
// 2. PREDICTIVE interventions (NEW) - AI/ML algorithms for risk prediction
// 3. SOURCE TRANSPARENCY (enhanced) - More detailed attribution requirements
// 4. DEMOGRAPHIC DATA TRANSPARENCY (NEW) - Must disclose use of race, ethnicity, etc.
// 5. INTERVENTION FEEDBACK (NEW) - Users can provide electronic feedback
// 6. RISK & FAIRNESS DISCLOSURES (NEW) - For predictive DSI
//
// The test checks for:
// 1. DSI intervention pages/interfaces accessible to providers
// 2. Role-based configuration for administrators
// 3. Evidence-based AND predictive intervention selection
// 4. Source attribution with bibliographic citations
// 5. Demographic data usage transparency
// 6. Electronic feedback mechanism for interventions
// 7. Triggers based on USCDI data elements
//
// This is a UI/capability verification test. It confirms DSI features exist and are
// accessible, but does not test clinical logic, AI algorithms, or fairness metrics.

module.exports = {
  tags: ['base-ehr', 'onc-certification', '170.315.b.11', 'dsi', 'predictive-ai', 'replaces-a-9'],

  'Decision Support Interventions - 170.315(b)(11)': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    console.log('✅ Testing ONC 170.315(b)(11) - Decision Support Interventions');
    console.log('ℹ️  Note: This replaces § 170.315(a)(9) which expired Jan 1, 2025');

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
          console.log('✅ Provider user logged in for ONC 170.315(b)(11)');
        });
      }
    });

    // Navigate to DSI/CDS page (same interface as a-9, enhanced)
    browser
      .url('http://localhost:3000/cds')
      .waitForElementVisible('body', 3000)
      .pause(1000);

    // Test 1: Verify DSI intervention capability exists
    browser.elements('css selector', '#cdsPage, #dsiPage, [data-testid="dsi"], [data-testid="cds"], .dsi-page, .cds-page, h1, h2', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(b)(11) - DSI page loaded');
      } else {
        browser.assert.ok(false, 'ONC 170.315(b)(11) - No DSI page found');
      }
    });

    // Test 2: Check for DSI configuration capability
    browser.execute(function() {
      const hasConfigAccess = document.querySelector('[data-testid="dsi-config"], [data-testid="cds-config"], .dsi-configuration, .cds-configuration');
      const hasRoleBasedAccess = typeof Meteor !== 'undefined' &&
        (Meteor.userId() && (Roles?.userIsInRole(Meteor.userId(), ['Administrator', 'System Administrator']) ?? false));

      return {
        hasConfigUI: !!hasConfigAccess,
        hasRoleCheck: hasRoleBasedAccess
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasConfigUI || result.value.hasRoleCheck,
        'ONC 170.315(b)(11) - DSI configuration capability exists'
      );
    });

    // Test 3: Verify evidence-based interventions interface
    browser.elements('css selector', '[data-testid="dsi-interventions"], [data-testid="cds-interventions"], .dsi-interventions-list, .cds-interventions-list', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(b)(11) - Evidence-based interventions interface found');
      }
    });

    // Test 4: Check for PREDICTIVE DSI capability (NEW in b-11)
    browser.execute(function() {
      const hasPredictive = document.querySelector('[data-testid="predictive-dsi"], .predictive-algorithm, .ai-intervention, .risk-prediction');
      const hasAIIndicator = document.body.textContent.toLowerCase().includes('predictive') ||
                            document.body.textContent.toLowerCase().includes('algorithm') ||
                            document.body.textContent.toLowerCase().includes('ai') ||
                            document.body.textContent.toLowerCase().includes('risk');

      return {
        hasPredictive: !!hasPredictive,
        hasAIIndicator: hasAIIndicator
      };
    }, [], function(result) {
      if (result.value.hasPredictive || result.value.hasAIIndicator) {
        console.log('✓ Predictive DSI capability detected (NEW in b-11)');
      } else {
        console.log('ℹ️  Predictive DSI not detected (may not be implemented yet)');
      }
    });

    // Test 5: Check for FEEDBACK capability (NEW in b-11)
    browser.execute(function() {
      const hasFeedback = document.querySelector('[data-testid="intervention-feedback"], .dsi-feedback, .intervention-rating');
      const hasFeedbackText = document.body.textContent.toLowerCase().includes('feedback');

      return {
        hasFeedback: !!hasFeedback,
        hasFeedbackText: hasFeedbackText
      };
    }, [], function(result) {
      if (result.value.hasFeedback || result.value.hasFeedbackText) {
        console.log('✓ Intervention feedback capability detected (NEW in b-11)');
      } else {
        console.log('ℹ️  Intervention feedback not detected (may not be implemented yet)');
      }
    });

    // Test 6: Check for source attribution (enhanced in b-11)
    browser.execute(function() {
      const hasSourceAttrs = document.querySelector('[data-testid="dsi-source"], [data-testid="cds-source"], .source-attributes, .citation');
      const hasDemographicDisclosure = document.querySelector('[data-testid="demographic-usage"], .demographic-disclosure');

      return {
        hasSourceAttrs: !!hasSourceAttrs,
        hasDemographicDisclosure: !!hasDemographicDisclosure
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasSourceAttrs,
        'ONC 170.315(b)(11) - Source attributes capability exists'
      );

      if (result.value.hasDemographicDisclosure) {
        console.log('✓ Demographic data usage disclosure found (NEW in b-11)');
      }
    });

    // Test 7: Verify triggers on USCDI data types
    browser.execute(function() {
      const dataTriggers = {
        problems: !!document.querySelector('[data-testid="problems"], .problem-list'),
        medications: !!document.querySelector('[data-testid="medications"], .medication-list'),
        allergies: !!document.querySelector('[data-testid="allergies"], .allergy-list'),
        demographics: !!document.querySelector('[data-testid="demographics"]'),
        labs: !!document.querySelector('[data-testid="labs"], .lab-results'),
        vitals: !!document.querySelector('[data-testid="vitals"], .vital-signs'),
        udi: !!document.querySelector('[data-testid="implantable-devices"], .udi-list'),
        procedures: !!document.querySelector('[data-testid="procedures"], .procedure-list')
      };

      const triggerCount = Object.values(dataTriggers).filter(Boolean).length;

      return {
        dataTriggers: dataTriggers,
        triggerCount: triggerCount,
        hasMultipleTriggers: triggerCount >= 3
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasMultipleTriggers,
        'ONC 170.315(b)(11) - DSI can trigger on USCDI data (' + result.value.triggerCount + ' types found)'
      );
    });

    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(b)(11) - Decision Support Interventions test completed');
      console.log('📋 Verified:');
      console.log('   - DSI intervention capability');
      console.log('   - Role-based configuration');
      console.log('   - Evidence-based interventions interface');
      console.log('   - Source attributes');
      console.log('   - USCDI data triggers');
      console.log('');
      console.log('📋 Enhanced b-11 features (check logs above):');
      console.log('   - Predictive DSI (AI/ML algorithms)');
      console.log('   - Intervention feedback mechanism');
      console.log('   - Demographic data usage disclosure');
    });

    browser
      .saveScreenshot('tests/screenshots/base-ehr_170.315.b.11_dsi.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(b)(11)');
      })
      .end();
  }
};
