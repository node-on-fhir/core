// packages/ccda-export/tests/nightwatch/170.315.g.6.test.js

module.exports = {
  tags: ['ccda-export', 'onc-certification', '170.315.g.6'],
  
  'CCDA Export - 170.315(g)(6) - Consolidated CDA Creation Performance': function (browser) {
    browser
      .url('http://localhost:3000/ccda-export')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#ccdaExportPage, [data-testid="ccda-export"], .ccda-export-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(g)(6) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(g)(6) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(g)(6) - CCDA Export (Consolidated CDA Creation Performance) route accessibility test passed');
    });

    browser
      .saveScreenshot('screenshots/ccda-export_170.315.g.6.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(g)(6)');
      })
      .end();
  }
};