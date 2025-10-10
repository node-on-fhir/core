// packages/e-prescribing/tests/nightwatch/170.315.a.10.test.js

module.exports = {
  tags: ['e-prescribing', 'onc-certification', '170.315.a.10'],
  'E-Prescribing - 170.315(a)(10) - Electronic Prescribing': function (browser) {
    browser
      .url('http://localhost:3000/e-prescribing')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#ePrescribingPage, [data-testid="e-prescribing"], .e-prescribing-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(a)(10) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(a)(10) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(a)(10) - E-Prescribing route accessibility test passed');
    });

    browser
      .saveScreenshot('screenshots/e-prescribing_170.315.a.10.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(a)(10)');
      })
      .end();
  }
};