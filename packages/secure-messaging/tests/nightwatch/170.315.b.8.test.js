// packages/secure-messaging/tests/nightwatch/170.315.b.8.test.js

module.exports = {
  tags: ['secure-messaging', 'onc-certification', '170.315.b.8'],
  
  'Secure Messaging - 170.315(b)(8) - Secure Messaging': function (browser) {
    browser
      .url('http://localhost:3000/secure-messaging')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#secureMessagingPage, [data-testid="secure-messaging"], .secure-messaging-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(b)(8) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(b)(8) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(b)(8) - Secure Messaging route accessibility test passed');
    });

    browser
      .saveScreenshot('screenshots/secure-messaging_170.315.b.8.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(b)(8)');
      })
      .end();
  }
};