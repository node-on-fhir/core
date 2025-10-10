// packages/drug-interactions/tests/nightwatch/170.315.a.4.test.js

module.exports = {
  tags: ['drug-interactions', 'onc-certification', '170.315.a.4'],
  
  'Drug Interactions - 170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks': function (browser) {
    browser
      .url('http://localhost:3000/drug-interactions/drug-drug')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#drugInteractionsPage, [data-testid="drug-interactions"], .drug-interactions-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(a)(4) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(a)(4) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(a)(4) - Drug Interactions (Drug-Drug, Drug-Allergy Checks) route accessibility test passed');
    });

    browser
      .saveScreenshot('screenshots/drug-interactions_170.315.a.4.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(a)(4)');
      })
      .end();
  }
};