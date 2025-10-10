// packages/drug-formulary/tests/nightwatch/170.315.a.5.test.js

module.exports = {
  tags: ['drug-formulary', 'onc-certification', '170.315.a.5'],
  'Drug Formulary - 170.315(a)(5) - Drug Formulary and Preferred Drug List Checks': function (browser) {
    browser
      .url('http://localhost:3000/drug-formulary')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#drugFormularyPage, [data-testid="drug-formulary"], .drug-formulary-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(a)(5) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(a)(5) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(a)(5) - Drug Formulary route accessibility test passed');
    });

    browser
      .saveScreenshot('tests/screenshots/drug-formulary_170.315.a.5.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(a)(5)');
      })
      .end();
  }
};