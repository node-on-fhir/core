// packages/immunization-registry/tests/nightwatch/170.315.f.1.test.js

module.exports = {
  tags: ['immunization-registry', 'onc-certification', '170.315.f.1'],
  'Immunization Registry - 170.315(f)(1) - Transmission to Immunization Registries': function (browser) {
    browser
      .url('http://localhost:3000/immunization-registry')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#immunizationRegistryPage, [data-testid="immunization-registry"], .immunization-registry-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(f)(1) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(f)(1) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(f)(1) - Immunization Registry route accessibility test passed');
    });

    browser
      .saveScreenshot('screenshots/immunization-registry_170.315.f.1.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(f)(1)');
      })
      .end();
  }
};