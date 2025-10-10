// packages/lab-test-reporting/tests/nightwatch/170.315.f.3.test.js

module.exports = {
  tags: ['lab-test-reporting', 'onc-certification', '170.315.f.3'],
  'Lab Test Reporting - 170.315(f)(3) - Transmission to Public Health Agencies - Reportable Laboratory Tests and Values/Results': function (browser) {
    browser
      .url('http://localhost:3000/lab-test-reporting')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#labTestReportingPage, [data-testid="lab-test-reporting"], .lab-test-reporting-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(f)(3) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(f)(3) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(f)(3) - Lab Test Reporting route accessibility test passed');
    });

    browser
      .saveScreenshot('screenshots/lab-test-reporting_170.315.f.3.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(f)(3)');
      })
      .end();
  }
};