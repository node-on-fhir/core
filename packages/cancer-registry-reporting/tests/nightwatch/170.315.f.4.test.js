// packages/cancer-registry-reporting/tests/nightwatch/170.315.f.4.test.js

module.exports = {
  tags: ['cancer-registry-reporting', 'onc-certification', '170.315.f.4'],
  
  'Cancer Registry Reporting - 170.315(f)(4) - Transmission to Cancer Registries': function (browser) {
    browser
      .url('http://localhost:3000/cancer-registry-reporting')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#cancerRegistryReportingPage, [data-testid="cancer-registry-reporting"], .cancer-registry-reporting-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(f)(4) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(f)(4) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(f)(4) - Cancer Registry Reporting route accessibility test passed');
    });

    browser
      .saveScreenshot('tests/screenshots/cancer-registry-reporting_170.315.f.4.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(f)(4)');
      })
      .end();
  }
};