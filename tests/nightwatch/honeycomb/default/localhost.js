describe('Honeycomb localhost:3000', function() {
  it('Check that homepage loads', function(browser) {
    browser
      .navigateTo('http://localhost:3000/')
      .waitForElementVisible('body')
      .assert.visible('#primaryFlexPanel')
      .assert.visible('#header')
      .assert.visible('#footer')
      .assert.visible('#mainAppRouter')
  }); 
});