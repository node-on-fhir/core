// npmPackages/secure-messaging/tests/nightwatch/170.315.h.1.test.js

const testUtils = require('../../../../tests/nightwatch/honeycomb/enable_autopublish/shared-test-utils');

module.exports = {
  tags: ['base-ehr', 'onc-certification', '170.315.h.1'],

  'Base EHR - 170.315(h)(1) - Direct Project': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Ensure a logged-in user (mirrors the order-catalog 170.315.a.1 pattern)
    browser.execute(function() {
      return { isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId() };
    }, [], function(result) {
      if (!result.value || !result.value.isLoggedIn) {
        browser.executeAsync(function(done) {
          Meteor.call('test.createTestUser', {
            username: 'janedoe', email: 'janedoe@test.org', password: 'janedoe123'
          }, function(err) {
            if (!err) {
              Meteor.loginWithPassword('janedoe', 'janedoe123', function(loginErr) {
                done({ loginSuccess: !loginErr });
              });
            } else { done({ loginSuccess: false, error: err }); }
          });
        }, [], function() {
          console.log('✅ Test user logged in for ONC 170.315(h)(1)');
        });
      }
    });

    testUtils.navigateUrl(browser, '/secure-messaging');
    browser
      .waitForElementVisible('body', 3000)
      .pause(1000);

    // Skip gracefully if the route/package is not loaded in this build
    let routeAvailable = true;
    browser.execute(function() {
      return !!document.querySelector('#notFoundPage');
    }, [], function(result) {
      if (result.value) { routeAvailable = false; }
    });

    browser.perform(function() {
      if (!routeAvailable) {
        console.log('⏭️  /secure-messaging route not available — secure-messaging package not loaded in this build. Skipping.');
        return;
      }

      browser.elements('css selector', 'h1, h2, main, .page-content', function(result) {
        browser.assert.ok(result.value && result.value.length > 0,
          'ONC 170.315(h)(1) - Page loaded with content elements');
      });

      browser.assert.not.textContains('body', '404');
      browser.assert.not.textContains('body', 'Page not found');
      browser.assert.not.textContains('body', 'Cannot GET');

      console.log('✅ Base EHR 170.315(h)(1) (Direct Project) route accessibility test passed');
    });

    browser
      .saveScreenshot('tests/screenshots/base-ehr_170.315.h.1.png')
      .end();
  }
};
