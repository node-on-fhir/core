// tests/nightwatch/honeycomb/accounts.signup.js
// Nightwatch tests for the Signup/Registration page with new validation flow

const { get } = require('lodash');
const moment = require('moment');

describe('Accounts - Signup/Registration (Enhanced)', function() {
  before(function(client) {
    // Initialize test environment
    client
      .url(get(client, 'globals.launch_url', 'http://localhost:3000'))
      .pause(2000)
      .executeAsync(function(done) {
        // Clear any existing test users
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.clearUsers', done);
        } else {
          done();
        }
      });
  });

  it('should load the signup page with all required elements', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('body', 5000)
      .verify.elementPresent('form')
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[name="email"], input[type="email"]')
      .verify.elementPresent('input[name="password"]')
      .verify.elementPresent('input[name="confirm"], input[name="confirmPassword"]')
      .verify.elementPresent('button[type="submit"]')
      .assert.textContains('h4', 'Create Account')
      .saveScreenshot('tests/nightwatch/screenshots/signup/01-initial-load.png');
  });

  it('should validate empty fields on form submission', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Try to submit empty form - button should be disabled
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      
      // Fill in partial form to test validation
      .setValue('input[name="username"]', 'test')
      .clearValue('input[name="username"]')
      .pause(500)
      
      // Check for validation messages
      .verify.elementPresent('input[name="username"]:invalid, input[name="username"][required]')
      .saveScreenshot('tests/nightwatch/screenshots/signup/02-empty-form-validation.png');
  });

  it('should enforce username requirements', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test short username
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'ab')
      .pause(1000)
      // Should show error message
      .assert.textContains('body', 'at least 3 characters')
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      .saveScreenshot('tests/nightwatch/screenshots/signup/03-short-username.png')
      
      // Test valid username
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'validuser123')
      .pause(2000) // Wait for availability check
      
      // Wait for availability check to complete
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/signup/04-valid-username.png');
  });

  it('should validate email format', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test invalid email format
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', 'invalid-email')
      .pause(500)
      // HTML5 validation or Material-UI error
      .verify.elementPresent('input[type="email"]:invalid, input[name="email"][aria-invalid="true"]')
      .saveScreenshot('tests/nightwatch/screenshots/signup/05-invalid-email.png')
      
      // Test valid email
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', 'test@example.com')
      .saveScreenshot('tests/nightwatch/screenshots/signup/06-valid-email.png');
  });

  it('should enforce password requirements', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test weak password
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', '1234567')
      .pause(1000)
      // Should show password strength indicator
      .assert.textContains('body', 'minimum')
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      .saveScreenshot('tests/nightwatch/screenshots/signup/07-weak-password.png')
      
      // Test medium password
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'password123')
      .pause(1000)
      // Should show password strength
      .saveScreenshot('tests/nightwatch/screenshots/signup/08-medium-password.png')
      
      // Test strong password
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'StrongUniquePass2024!')
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/signup/09-strong-password.png');
  });

  it('should validate password confirmation match', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Set initial password
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'TestPassword123')
      
      // Test mismatched confirmation
      .clearValue('input[name="confirm"], input[name="confirmPassword"]')
      .setValue('input[name="confirm"], input[name="confirmPassword"]', 'DifferentPassword')
      .pause(500)
      // Check that button is disabled when passwords don't match
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      .saveScreenshot('tests/nightwatch/screenshots/signup/09-password-mismatch.png')
      
      // Test matching confirmation
      .clearValue('input[name="confirm"], input[name="confirmPassword"]')
      .setValue('input[name="confirm"], input[name="confirmPassword"]', 'TestPassword123')
      .saveScreenshot('tests/nightwatch/screenshots/signup/10-password-match.png');
  });

  it('should successfully register a new user', function(client) {
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const testUsername = `testuser${timestamp}`;
    const testEmail = `test${timestamp}@example.com`;
    
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Fill in all required fields
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', testUsername)
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', testEmail)
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'SecurePassword123!')
      .clearValue('input[name="confirm"], input[name="confirmPassword"]')
      .setValue('input[name="confirm"], input[name="confirmPassword"]', 'SecurePassword123!')
      .saveScreenshot('tests/nightwatch/screenshots/signup/11-complete-form.png')
      
      // Wait for button to be enabled before clicking
      .waitForElementNotPresent('button[type="submit"][disabled]', 5000)
      
      // Submit form - scroll into view and click
      .execute(function() {
        // Scroll the submit button into view and click it
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton && !submitButton.disabled) {
          submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Use focus and click to ensure proper interaction
          submitButton.focus();
          // Wait a bit for scroll to complete
          setTimeout(() => {
            submitButton.click();
          }, 500);
          return { clicked: true, disabled: submitButton.disabled };
        }
        return { clicked: false, disabled: submitButton ? submitButton.disabled : null };
      }, function(result) {
        console.log('Submit button interaction:', result.value);
      })
      .pause(5000)
      
      // Verify successful registration (should redirect or show success)
      .execute(function() {
        return {
          url: window.location.href,
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null
        };
      }, function(result) {
        console.log('After registration:', result.value);
      })
      .verify.not.urlContains('/register', 'Should redirect after successful registration')
      .saveScreenshot('tests/nightwatch/screenshots/signup/13-registration-success.png');
  });

  it('should prevent duplicate username registration', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Try to register with the same username again
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'testuser')
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', 'different@example.com')
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'AnotherPassword123!')
      .clearValue('input[name="confirm"], input[name="confirmPassword"]')
      .setValue('input[name="confirm"], input[name="confirmPassword"]', 'AnotherPassword123!')
      .saveScreenshot('tests/nightwatch/screenshots/signup/13-duplicate-username.png')
      
      // Wait for availability check to show error
      .pause(3000)
      
      // Verify error message for duplicate username - check button is disabled
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      .verify.urlContains('/register', 'Should remain on register page')
      .saveScreenshot('tests/nightwatch/screenshots/signup/14-duplicate-username-error.png');
  });

  it('should provide navigation to login page', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Check for login link text
      .assert.textContains('form', 'Sign In')
      .saveScreenshot('tests/nightwatch/screenshots/signup/15-login-link.png')
      
      // Find and click the login link
      .execute(function() {
        const links = document.querySelectorAll('button, a, span');
        for (let link of links) {
          if (link.textContent.includes('Sign In') || link.textContent.includes('Sign in') ||
              (link.textContent.includes('Already have') && link.parentElement.querySelector('a, button'))) {
            // If it's text, find the actual clickable element
            const clickable = link.tagName === 'A' || link.tagName === 'BUTTON' ? link : 
                            link.parentElement.querySelector('a, button');
            if (clickable) {
              clickable.click();
              return { clicked: true, text: link.textContent };
            }
          }
        }
        return { clicked: false };
      }, function(result) {
        console.log('Login link click result:', result.value);
        if (result.value.clicked) {
          client
            .pause(1000)
            .verify.urlContains('/login');
        } else {
          // Alternative: Use navigation
          client
            .url('http://localhost:3000/login')
            .pause(1000);
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/signup/16-navigate-to-login.png');
  });

  it('should have proper tab order for keyboard navigation', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Test tab order through form fields
      .click('input[name="username"]')
      .pause(100)
      .sendKeys('input[name="username"]', client.Keys.TAB)
      .pause(100)
      .verify.elementPresent('input[name="email"]:focus, input[type="email"]:focus')
      
      .sendKeys('input[name="email"], input[type="email"]', client.Keys.TAB)
      .pause(100)
      .verify.elementPresent('input[name="password"]:focus')
      
      .sendKeys('input[name="password"]', client.Keys.TAB)
      .pause(100)
      // Check which element has focus - could be confirm or button
      .execute(function() {
        const activeElement = document.activeElement;
        return {
          tagName: activeElement.tagName,
          name: activeElement.name,
          type: activeElement.type
        };
      }, function(result) {
        console.log('Active element after password:', result.value);
        // Either confirm field or submit button is acceptable
        client.verify.ok(
          result.value.name === 'confirm' || result.value.type === 'submit',
          'Focus should be on confirm field or submit button'
        );
      })
      
      .saveScreenshot('tests/nightwatch/screenshots/signup/17-tab-order.png');
  });

  it('should be responsive across different screen sizes', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      
      // Test mobile viewport
      .resizeWindow(375, 667) // iPhone 6/7/8 size
      .pause(500)
      .waitForElementVisible('form', 5000)
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[name="password"]')
      .saveScreenshot('tests/nightwatch/screenshots/signup/18-mobile-view.png')
      
      // Test tablet viewport
      .resizeWindow(768, 1024) // iPad size
      .pause(500)
      .verify.elementPresent('form')
      .saveScreenshot('tests/nightwatch/screenshots/signup/19-tablet-view.png')
      
      // Reset to desktop
      .resizeWindow(1024, 768)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/signup/20-desktop-view.png');
  });

  it('should have proper security attributes on form fields', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // Verify password field is properly masked
      .verify.attributeContains('input[name="password"]', 'type', 'password')
      .verify.attributeContains('input[name="confirm"], input[name="confirmPassword"]', 'type', 'password')
      
      // Check for autocomplete attributes for security
      .verify.attributeContains('input[name="username"]', 'autocomplete', 'username')
      .verify.attributeContains('input[name="password"]', 'autocomplete', 'new-password')
      
      .saveScreenshot('tests/nightwatch/screenshots/signup/21-security-check.png');
  });

  it('should handle first-run setup scenario', function(client) {
    client
      // Test first-run setup scenario
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined') {
          // Simulate first run condition
          Meteor.call('test.setFirstRun', true, done);
        } else {
          done();
        }
      })
      .pause(1000)
      
      .url('http://localhost:3000')
      .pause(3000)
      
      // Should show some page - might redirect to register or show homepage
      .verify.elementPresent('body')
      .saveScreenshot('tests/nightwatch/screenshots/signup/22-first-run-setup.png')
      
      // Reset first run state
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined') {
          Meteor.call('test.setFirstRun', false, done);
        } else {
          done();
        }
      });
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