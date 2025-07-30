// tests/nightwatch/honeycomb/dev_auto_login/test.my.profile.js

describe('My Profile Page', function() {
  
  before(browser => {
    console.log('Starting My Profile test suite...');
    browser
      .windowSize('current', 1400, 900)  // Set to landscape/desktop size
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    browser.pause(500);
  });

  it('01. Should navigate to my profile page', browser => {
    browser
      .url('http://localhost:3000/my-profile')
      .waitForElementVisible('body', 5000)
      .pause(1000);
    
    // Verify we're on the correct page
    browser.assert.urlContains('/my-profile');
  });

  it('02. Should check for delete account button', browser => {
    browser
      .waitForElementVisible('body', 1000)
      .assert.elementPresent('#deleteUserButton', 'Delete account button should be present')
      .assert.visible('#deleteUserButton', 'Delete account button should be visible');
  });

  it('03. Should verify delete button properties', browser => {
    browser
      .getAttribute('#deleteUserButton', 'type', function(result) {
        this.assert.equal(result.value, 'button', 'Delete button should be of type button');
      })
      .getCssProperty('#deleteUserButton', 'display', function(result) {
        this.assert.notEqual(result.value, 'none', 'Delete button should not be hidden');
      });
  });

  after(browser => {
    console.log('Completed My Profile test suite');
    browser.end();
  });
});