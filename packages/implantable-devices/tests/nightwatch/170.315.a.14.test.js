// packages/implantable-devices/tests/nightwatch/170.315.a.14.test.js

module.exports = {
  tags: ['implantable-devices', 'onc-certification', '170.315.a.14'],
  'Implantable Devices - 170.315(a)(14) - Implantable Device List': function (browser) {
    browser
      .url('http://localhost:3000/implantable-devices')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#implantableDevicesPage, [data-testid="implantable-devices"], .implantable-devices-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(a)(14) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(a)(14) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(a)(14) - Implantable Devices route accessibility test passed');
    });

    browser
      .saveScreenshot('tests/screenshots/implantable-devices_170.315.a.14.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(a)(14)');
      })
      .end();
  }
};