// tests/nightwatch/honeycomb/simple-sorting-test.js

describe('Simple Conditions Sorting', function() {
  it('Check if sorting implementation exists', browser => {
    browser
      .url('http://localhost:3000/conditions')
      .waitForElementVisible('#conditionsPage', 5000)
      .pause(2000)
      .execute(function() {
        // Look for toggle buttons
        const toggleButtons = document.querySelectorAll('button[value="ascending"], button[value="descending"]');
        const hasToggleButtons = toggleButtons.length > 0;
        
        // Look for conditions table
        const table = document.querySelector('#conditionsTable');
        const hasTable = table !== null;
        
        // Get page content for debugging
        const pageContent = document.querySelector('#conditionsPage')?.textContent || 'No page content';
        
        return {
          hasToggleButtons: hasToggleButtons,
          toggleButtonCount: toggleButtons.length,
          hasTable: hasTable,
          pageContent: pageContent.substring(0, 200) // First 200 chars
        };
      }, [], function(result) {
        console.log('Page state:', result.value);
        browser.assert.ok(result.value.hasToggleButtons, 'Sort toggle buttons are present');
        browser.assert.equal(result.value.toggleButtonCount, 2, 'Two toggle buttons (ascending/descending) exist');
      })
      .saveScreenshot('tests/nightwatch/screenshots/conditions/sorting-controls-check.png')
      .end();
  });
});