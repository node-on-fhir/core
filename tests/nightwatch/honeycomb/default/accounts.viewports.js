// tests/nightwatch/honeycomb/accounts.login.js
// Nightwatch tests for the Login page components with new progressive flow

const { get } = require('lodash');

describe('Accounts - Login (Progressive Flow)', function() {
  before(function(client) {
    // Initialize test environment
    client
      .url(get(client, 'globals.launch_url', 'http://localhost:3000'))
      .pause(2000)
      .executeAsync(function(done) {
        // Clear any existing users and create test data
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.clearUsers', function(err) {
            if (!err) {
              Meteor.call('test.createTestUser', {
                username: 'testuser',
                email: 'test@example.com',
                password: 'testpass123'
              }, done);
            } else {
              done();
            }
          });
        } else {
          done();
        }
      });
  });


  it('should be responsive across different screen sizes', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      
      // Test mobile viewport
      .resizeWindow(375, 667) // iPhone 6/7/8 size
      .pause(500)
      .waitForElementVisible('form', 5000)
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[type="password"]')
      .saveScreenshot('tests/nightwatch/screenshots/login/12-mobile-view.png')
      
      // Test tablet viewport
      .resizeWindow(768, 1024) // iPad size
      .pause(500)
      .verify.elementPresent('form')
      .saveScreenshot('tests/nightwatch/screenshots/login/13-tablet-view.png')
      
      // Reset to desktop
      .resizeWindow(1024, 768)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/login/14-desktop-view.png');
  });

  it('should have proper accessibility attributes', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Check for proper form labels and accessibility attributes
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[type="password"]')
      .verify.attributeContains('input[name="username"]', 'type', 'text')
      .verify.attributeContains('input[type="password"]', 'type', 'password')
      
      // Test keyboard navigation
      .click('input[name="username"]')
      .sendKeys('input[name="username"]', client.Keys.TAB)
      .pause(500)
      .execute(function() {
        return document.activeElement.name || document.activeElement.type;
      }, function(result) {
        console.log('Focused element:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/15-accessibility-check.png');
  });

  after(function(client) {
    // Cleanup
    client
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.clearUsers', done);
        } else {
          done();
        }
      })
      .end();
  });
});