// packages/accounts-management/tests/nightwatch/170.315.d.1.simple.test.js

module.exports = {
  tags: ['accounts-management', 'onc-certification', '170.315.d.1', 'simple'],
  'Accounts Management - 170.315(d)(1) - Route Accessibility Test': function (browser) {
    browser
      .url('http://localhost:3000/accounts-management')
      .waitForElementVisible('body', 3000)
      .assert.elementPresent('body')
      .assert.not.containsText('body', 'Cannot GET')
      .assert.not.containsText('body', '404')
      .perform(function() {
        console.log('✅ ONC 170.315(d)(1) - Accounts Management route is accessible');
      })
      .saveScreenshot('tests/screenshots/accounts-management_170.315.d.1.simple.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(d)(1)');
      })
      .end();
  }
};