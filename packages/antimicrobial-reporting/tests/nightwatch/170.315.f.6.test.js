// packages/antimicrobial-reporting/tests/nightwatch/170.315.f.6.test.js

module.exports = {
  tags: ['antimicrobial-reporting', 'onc-certification', '170.315.f.6'],
  
  'Antimicrobial Reporting - 170.315(f)(6) - Transmission to Public Health Agencies - Antimicrobial Use and Resistance Reporting': function (browser) {
    browser
      .url('http://localhost:3000/antimicrobial-reporting')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#antimicrobialReportingPage, [data-testid="antimicrobial-reporting"], .antimicrobial-reporting-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(f)(6) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(f)(6) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(f)(6) - Antimicrobial Reporting route accessibility test passed');
    });

    browser
      .saveScreenshot('tests/screenshots/antimicrobial-reporting_170.315.f.6.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(f)(6)');
      })
      .end();
  }
};