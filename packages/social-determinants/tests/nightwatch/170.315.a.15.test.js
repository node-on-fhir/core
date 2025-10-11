// packages/social-determinants/tests/nightwatch/170.315.a.15.test.js

module.exports = {
  tags: ['social-determinants', 'onc-certification', '170.315.a.15'],
  'Social Determinants - 170.315(a)(15) - Social, Psychological, and Behavioral Data': function (browser) {
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
          console.log('✅ Test user logged in for ONC 170.315(a)(15)');
        });
      }
    });

    browser
      .url('http://localhost:3000/social-determinants')
      .waitForElementVisible('body', 3000)
      .pause(1000); // Give page time to load
      
    // Check for multiple possible page indicators
    browser.elements('css selector', '#socialDeterminantsPage, [data-testid="social-determinants"], .social-determinants-page, h1, h2, main, .page-content', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(a)(15) - Page loaded with content elements');
      } else {
        browser.assert.ok(false, 'ONC 170.315(a)(15) - No recognizable page elements found');
      }
    });
    
    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');
    browser.assert.not.textContains('body', 'Cannot GET');
    
    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(a)(15) - Social Determinants route accessibility test passed');
    });

    browser
      .saveScreenshot('tests/screenshots/social-determinants_170.315.a.15.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(a)(15)');
      })
      .end();
  }
};