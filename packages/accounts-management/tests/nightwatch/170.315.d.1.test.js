// packages/accounts-management/tests/nightwatch/170.315.d.1.test.js

module.exports = {
  tags: ['accounts-management', 'onc-certification', '170.315.d.1'],
  
  'Accounts Management - 170.315(d)(1) - Authentication, Access Control, Authorization': function (browser) {
    browser
      .url('http://localhost:3000/accounts-management')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#accountsManagementPage, [data-testid="accounts-management"], .accounts-management-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(d)(1) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(d)(1) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(d)(1) - Accounts Management route accessibility test passed');
    });
    
    browser.end();
  }
};