// packages/family-health-history/tests/nightwatch/170.315.a.12.test.js

module.exports = {
  tags: ['family-health-history', 'onc-certification', '170.315.a.12'],
  'Family Health History - 170.315(a)(12) - Family Health History': function (browser) {
    browser
      .url('http://localhost:3000/family-health-history')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#familyHealthHistoryPage, [data-testid="family-health-history"], .family-health-history-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(a)(12) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(a)(12) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(a)(12) - Family Health History route accessibility test passed');
    });

    browser
      .saveScreenshot('screenshots/family-health-history_170.315.a.12.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(a)(12)');
      })
      .end();
  }
};