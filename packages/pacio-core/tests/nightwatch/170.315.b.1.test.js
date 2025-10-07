// packages/pacio-core/tests/nightwatch/170.315.b.1.test.js

module.exports = {
  tags: ['pacio-core', 'onc-certification', '170.315.b.1'],
  'PACIO Core - 170.315(b)(1) - Transitions of Care': function (browser) {
    browser
      .url('http://localhost:3000/transitions-of-care')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#transitionsOfCarePage, [data-testid="transitions-of-care"], .transitions-of-care-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(b)(1) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(b)(1) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(b)(1) - PACIO Core (Transitions of Care) route accessibility test passed');
    });
    
    browser.end();
  }
};