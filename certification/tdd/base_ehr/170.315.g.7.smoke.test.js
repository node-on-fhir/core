// certification/tdd/base_ehr/170.315.g.7.test.js
// § 170.315(g)(7) - Application Access - Patient Selection
// Simplified: Just verify FHIR endpoint is up. Full testing via Inferno.

module.exports = {
  tags: ['base-ehr', 'onc-certification', '170.315.g.7', 'api', 'patient-selection'],

  'Application Access - Patient Selection - 170.315(g)(7)': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    console.log('✅ Testing ONC 170.315(g)(7) - Application Access - Patient Selection');
    console.log('ℹ️  Note: Full API testing performed by Inferno test suite');

    // Test 1: Verify FHIR API endpoint is up
    browser.executeAsync(function(done) {
      fetch('http://localhost:3000/baseR4/metadata', {
        method: 'GET',
        headers: { 'Accept': 'application/fhir+json' }
      })
      .then(response => response.json())
      .then(data => {
        done({
          success: true,
          hasFHIREndpoint: data.resourceType === 'CapabilityStatement',
          fhirVersion: data.fhirVersion
        });
      })
      .catch(err => {
        done({ success: false, error: err.message });
      });
    }, [], function(result) {
      browser.assert.ok(
        result.value.success && result.value.hasFHIREndpoint,
        'ONC 170.315(g)(7) - FHIR API endpoint is up (version: ' + (result.value.fhirVersion || 'unknown') + ')'
      );
    });

    // Test 2: Verify Patient endpoint responds
    browser.executeAsync(function(done) {
      fetch('http://localhost:3000/baseR4/Patient?_count=1', {
        method: 'GET',
        headers: { 'Accept': 'application/fhir+json' }
      })
      .then(response => response.json())
      .then(data => {
        done({
          success: true,
          hasPatientEndpoint: data.resourceType === 'Bundle',
          totalPatients: data.total || 0
        });
      })
      .catch(err => {
        done({ success: false, error: err.message });
      });
    }, [], function(result) {
      browser.assert.ok(
        result.value.success && result.value.hasPatientEndpoint,
        'ONC 170.315(g)(7) - Patient endpoint responds'
      );
    });

    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(g)(7) - Basic endpoint verification passed');
      console.log('📋 For comprehensive testing, use Inferno: https://inferno.healthit.gov');
    });

    browser
      .saveScreenshot('tests/screenshots/base-ehr_170.315.g.7_patient-selection.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(g)(7)');
      })
      .end();
  }
};
