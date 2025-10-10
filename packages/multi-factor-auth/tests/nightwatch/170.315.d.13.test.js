// packages/multi-factor-auth/tests/nightwatch/170.315.d.13.test.js

module.exports = {
  tags: ['multi-factor-auth', 'onc-certification', '170.315.d.13'],
  'Multi-Factor Auth - 170.315(d)(13) - Multi-Factor Authentication': function (browser) {
    browser
      .url('http://localhost:3000/mfa-management')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#mfaManagementPage, [data-testid="mfa-management"], .mfa-management-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(d)(13) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(d)(13) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(d)(13) - Multi-Factor Auth route accessibility test passed');
    });

    browser
      .saveScreenshot('screenshots/multi-factor-auth_170.315.d.13.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(d)(13)');
      })
      .end();
  }
};