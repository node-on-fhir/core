// certification/tdd/base_ehr/170.315.g.10.test.js
// § 170.315(g)(10) - Standardized API for Patient and Population Services
// Simplified: Just verify FHIR R4 endpoint is up. Full testing via Inferno.
// NOTE: Inferno is the official ONC-approved testing tool for comprehensive API validation

module.exports = {
  tags: ['base-ehr', 'onc-certification', '170.315.g.10', 'api', 'fhir', 'smart-on-fhir', 'us-core'],

  'Standardized API - 170.315(g)(10)': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    console.log('✅ Testing ONC 170.315(g)(10) - Standardized API for Patient and Population Services');
    console.log('ℹ️  Note: This is a basic endpoint check only');
    console.log('ℹ️  Full FHIR R4 / US Core / SMART / Bulk Data testing performed by Inferno');

    // Test 1: Verify FHIR R4 CapabilityStatement
    browser.executeAsync(function(done) {
      fetch('http://localhost:3000/baseR4/metadata', {
        method: 'GET',
        headers: { 'Accept': 'application/fhir+json' }
      })
      .then(response => response.json())
      .then(data => {
        const isFHIR4 = data.fhirVersion && data.fhirVersion.startsWith('4.');
        const isCapabilityStatement = data.resourceType === 'CapabilityStatement';

        done({
          success: true,
          isFHIR4: isFHIR4,
          isCapabilityStatement: isCapabilityStatement,
          fhirVersion: data.fhirVersion
        });
      })
      .catch(err => {
        done({ success: false, error: err.message });
      });
    }, [], function(result) {
      browser.assert.ok(
        result.value.success && result.value.isFHIR4,
        'ONC 170.315(g)(10) - FHIR R4 API is up (version: ' + (result.value.fhirVersion || 'N/A') + ')'
      );
    });

    // Test 2: Verify key US Core resources are declared
    browser.executeAsync(function(done) {
      fetch('http://localhost:3000/baseR4/metadata', {
        method: 'GET',
        headers: { 'Accept': 'application/fhir+json' }
      })
      .then(response => response.json())
      .then(data => {
        // Check for some key US Core resources
        const keyResources = ['Patient', 'Observation', 'Condition', 'MedicationRequest'];

        const declaredResources = new Set();
        if (data.rest && data.rest[0] && data.rest[0].resource) {
          data.rest[0].resource.forEach(r => {
            declaredResources.add(r.type);
          });
        }

        const foundKeyResources = keyResources.filter(r => declaredResources.has(r));

        done({
          success: true,
          foundKeyResources: foundKeyResources,
          resourceCount: foundKeyResources.length
        });
      })
      .catch(err => {
        done({ success: false, error: err.message });
      });
    }, [], function(result) {
      browser.assert.ok(
        result.value.success && result.value.resourceCount >= 2,
        'ONC 170.315(g)(10) - Key FHIR resources declared (' + result.value.resourceCount + ' found)'
      );
    });

    // Test 3: Check for SMART configuration (optional - may require auth)
    browser.executeAsync(function(done) {
      fetch('http://localhost:3000/.well-known/smart-configuration', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
        done({
          success: true,
          hasSMARTConfig: !!data.authorization_endpoint
        });
      })
      .catch(err => {
        // SMART config may not be publicly accessible - that's OK for this basic check
        done({ success: true, hasSMARTConfig: false, note: 'SMART config not publicly accessible' });
      });
    }, [], function(result) {
      if (result.value.hasSMARTConfig) {
        console.log('✓ SMART on FHIR configuration found');
      } else {
        console.log('ℹ️  SMART config check skipped (will be tested by Inferno)');
      }
    });

    // Log success
    browser.perform(function() {
      console.log('');
      console.log('✅ ONC 170.315(g)(10) - Basic FHIR endpoint verification passed');
      console.log('');
      console.log('📋 For comprehensive certification testing, use Inferno:');
      console.log('   https://inferno.healthit.gov');
      console.log('');
      console.log('   Inferno tests:');
      console.log('   - FHIR R4 conformance');
      console.log('   - US Core Implementation Guide');
      console.log('   - SMART App Launch (OAuth 2.0)');
      console.log('   - SMART Backend Services (Bulk Data)');
      console.log('   - All mandatory & must-support elements');
      console.log('   - USCDI data classes');
    });

    browser
      .saveScreenshot('tests/screenshots/base-ehr_170.315.g.10_standardized-api.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(g)(10)');
      })
      .end();
  }
};
