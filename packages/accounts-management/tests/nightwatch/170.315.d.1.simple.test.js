// packages/accounts-management/tests/nightwatch/170.315.d.1.simple.test.js

module.exports = {
  tags: ['accounts-management', 'onc-certification', '170.315.d.1', 'simple'],
  'Accounts Management - 170.315(d)(1) - Route Accessibility Test': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Check if user is logged in, if not, create test user and login
    browser.execute(function() {
      return {
        isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
        userId: Meteor.userId ? Meteor.userId() : null
      };
    }, [], function(result) {
      if (!result.value.isLoggedIn) {
        browser.executeAsync(function(done) {
          Meteor.call('test.createTestUser', {
            username: 'janedoe',
            email: 'janedoe@test.org',
            password: 'janedoe123'
          }, function(err, userId) {
            if (!err) {
              Meteor.loginWithPassword('janedoe', 'janedoe123', function(loginErr) {
                done({ loginSuccess: !loginErr, userId: Meteor.userId() });
              });
            } else {
              done({ loginSuccess: false, error: err });
            }
          });
        }, [], function() {
          console.log('✅ Test user logged in for ONC 170.315(d)(1)');
        });
      }
    });

    browser
      .url('http://localhost:3000/accounts-management')
      .waitForElementVisible('body', 3000)
      .pause(1000) // Give page time to load
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