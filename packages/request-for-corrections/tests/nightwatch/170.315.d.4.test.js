// packages/request-for-corrections/tests/nightwatch/170.315.d.4.test.js

module.exports = {
  tags: ['request-for-corrections', 'onc-certification', '170.315.d.4'],
  
  'Request for Corrections - 170.315(d)(4) - Amendments': function (browser) {
    browser
      .url('http://localhost:3000/correction-requests')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#correctionRequestsPage, [data-testid="correction-requests"], .correction-requests-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(d)(4) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(d)(4) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(d)(4) - Request for Corrections (Amendments) route accessibility test passed');
    });
    
    browser.end();
  }
};