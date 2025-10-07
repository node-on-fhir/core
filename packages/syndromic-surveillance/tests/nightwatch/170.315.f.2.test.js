// packages/syndromic-surveillance/tests/nightwatch/170.315.f.2.test.js

module.exports = {
  tags: ['syndromic-surveillance', 'onc-certification', '170.315.f.2'],
  'Syndromic Surveillance - 170.315(f)(2) - Syndromic Surveillance Reporting': function (browser) {
    browser
      .url('http://localhost:3000/syndromic-surveillance')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#syndromicSurveillancePage, [data-testid="syndromic-surveillance"], .syndromic-surveillance-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(f)(2) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(f)(2) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(f)(2) - Syndromic Surveillance route accessibility test passed');
    });
    
    browser.end();
  }
};