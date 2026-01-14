// tests/nightwatch/honeycomb/accounts.login.js
// Nightwatch tests for the Login page components with new progressive flow
//
// IMPORTANT: These tests require:
// 1. accounts.enabled: true in settings (added to settings.honeycomb.tdd.json)
// 2. DEV_AUTO_LOGIN: false (currently true in CircleCI, which bypasses login page)
// 
// When DEV_AUTO_LOGIN is enabled, users are automatically logged in and
// the login page is not accessible, causing these tests to fail.

const { get } = require('lodash');

describe('Accounts - Login (Progressive Flow)', function() {
  const timestamp = Date.now();
  const newUsername = `newuser${timestamp}`;
  const newEmail = `newuser${timestamp}@example.com`;
  const password = 'TestPassword123!';

  before(function(client) {
    // Initialize test environment
    client
      .url(get(client, 'globals.launch_url', 'http://localhost:3000'))
      .pause(2000)
      .executeAsync(function(done) {
        // Clear any existing users and logout if needed
        if (typeof Meteor !== 'undefined') {
          // First logout if logged in
          if (Meteor.userId()) {
            console.log('before: Logging out user');
            Meteor.logout(function() {
              // Then clear users
              console.log('before: Clearing all test users');
              Meteor.call('test.clearUsers', function(err) {
                done();
              });
            });
          } else {
            // Just clear users
            console.log('before: Clearing all test users (no user logged in)');
            Meteor.call('test.clearUsers', function(err) {
              done();
            });
          }
        } else {
          done();
        }
      })
      .pause(1000); // Extra pause to ensure cleanup completes
  });
  
  beforeEach(function(client) {
    // Ensure we're logged out before each test
    client
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          console.log('beforeEach: Logging out user');
          Meteor.logout(done);
        } else {
          done();
        }
      })
      .pause(500);
  });

  it('should load the login page with login elements', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      // Ensure navigation completes
      .execute(function() {
        return window.location.pathname;
      }, [], function(result) {
        console.log('Current path:', result.value);
      })
      .pause(2000) // Give React time to render
      .waitForElementVisible('body', 15000)
      
      // Check DOM structure first
      .execute(function() {
        const hasForm = !!document.querySelector('form');
        const hasDivForm = !!document.querySelector('div[role="form"]');
        const hasUsernameInput = !!document.querySelector('input[name="username"]');
        const hasPasswordInput = !!document.querySelector('input[name="password"], input[type="password"]');
        const hasSubmitButton = !!document.querySelector('button[type="submit"]');
        const h4Text = document.querySelector('h4')?.textContent || '';
        const allInputs = Array.from(document.querySelectorAll('input')).map(i => ({
          name: i.name,
          type: i.type,
          placeholder: i.placeholder
        }));
        const allButtons = Array.from(document.querySelectorAll('button')).map(b => ({
          type: b.type,
          text: b.textContent
        }));
        
        return {
          hasForm,
          hasDivForm,
          hasUsernameInput,
          hasPasswordInput,
          hasSubmitButton,
          h4Text,
          pageTitle: document.title,
          url: window.location.href,
          allInputs,
          allButtons
        };
      }, [], function(result) {
        console.log('Login page DOM check:', result.value);
        // Add assertions to help debug
        client.assert.equal(result.value.url.includes('/login'), true, 'On login page');
      })
      
      // Wait for any element that indicates the page is loaded
      .waitForElementPresent('input[placeholder*="username" i], input[placeholder*="email" i]', 10000)
      
      // More flexible element checks
      .verify.elementPresent('input[placeholder*="username" i], input[placeholder*="email" i]')
      .verify.elementPresent('input[placeholder*="password" i], input[type="password"]')
      .verify.elementPresent('button')
      .assert.textContains('h4', 'Sign In')
      .saveScreenshot('tests/nightwatch/screenshots/login/01-initial-load.png');
  });

  it('should handle progressive field validation', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(2000)
      .waitForElementVisible('body', 10000)
      .pause(1000)
      
      // Test empty form submission - button should be disabled
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      
      // Fill username only
      .setValue('input[name="username"]', 'test')
      .pause(2000) // Wait for user check in progressive flow
      
      // Check what happens based on user existence
      .execute(function() {
        const passwordField = document.querySelector('input[name="password"]');
        const emailField = document.querySelector('input[name="email"]');
        return {
          passwordDisabled: passwordField ? passwordField.disabled : null,
          emailPresent: !!emailField,
          hasAlert: !!document.querySelector('.MuiAlert-root')
        };
      }, function(result) {
        console.log('Progressive form state:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/03-progressive-validation.png');
  });





  it('should handle registration for non-existent users', function(client) {
    // const timestamp = Date.now();
    // const newUsername = `newuser${timestamp}`;
    // const newEmail = `newuser${timestamp}@example.com`;
    // const password = 'TestPassword123!';

    // const timestamp = Date.now();
    // const newUsername = `newuser`;
    // const newEmail = `newuser@example.com`;
    // const password = 'TestPassword123!';

    client
      // Logout first
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          Meteor.logout(done);
        } else {
          done();
        }
      })
      .pause(1000)
      
      .url('http://localhost:3000/login')
      .pause(2000)
      .waitForElementVisible('body', 10000)
      .pause(1000)
      
      // Step 1: Initial state - verify username, password inputs and disabled sign-in button
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('input[name="password"]')
      .verify.elementPresent('button[type="submit"][disabled]')
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-01-initial-state.png')
      
      // Step 2: Enter non-existent username/email
      .setValue('input[name="username"]', newEmail)
      .pause(4000) // Longer wait for user check (CI is slower)

      // Step 3: Verify infobox and CREATE NEW ACCOUNT button appear, sign-in button not present
      .waitForElementPresent('.MuiAlert-root', 10000)
      .verify.textContains('.MuiAlert-root', 'No account found')
      .execute(function() {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createButton = buttons.find(b => b.textContent.includes('CREATE NEW ACCOUNT'));
        const signInButton = buttons.find(b => b.textContent.includes('SIGN IN'));
        return {
          hasCreateButton: !!createButton,
          hasSignInButton: !!signInButton,
          buttonTexts: buttons.map(b => b.textContent)
        };
      }, function(result) {
        console.log('Buttons after non-existent user:', result.value);
        client.assert.ok(result.value.hasCreateButton, 'CREATE NEW ACCOUNT button should be present');
        client.assert.ok(!result.value.hasSignInButton, 'SIGN IN button should not be present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-02-no-account-found.png')
      
      // Step 4: Click CREATE NEW ACCOUNT button
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('CREATE NEW ACCOUNT')) {
            button.click();
            return { clicked: true };
          }
        }
        return { clicked: false };
      }, function(result) {
        console.log('CREATE NEW ACCOUNT click:', result.value);
      })
      .pause(1000)
      
      // Step 5: Verify password and confirm password inputs appear (email already entered as username)
      .verify.elementPresent('input[name="password"]')
      .verify.elementPresent('input[name="confirmPassword"]')
      .execute(function() {
        const confirmField = document.querySelector('input[name="confirmPassword"]');
        return {
          confirmDisabled: confirmField ? confirmField.disabled : null
        };
      }, function(result) {
        console.log('Confirm password state:', result.value);
        client.assert.ok(result.value.confirmDisabled, 'Confirm password should be disabled initially');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-03-password-fields.png')
      
      // Step 6: Enter password
      .setValue('input[name="password"]', password)
      .pause(500)
      
      // Step 7: Verify confirm password is now enabled
      .waitForElementPresent('input[name="confirmPassword"]:not([disabled])', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-04-confirm-enabled.png')

      // Step 8: Enter matching confirm password
      .setValue('input[name="confirmPassword"]', password)
      .pause(1000)

      // Step 9: Verify username input appears after passwords match
      .waitForElementPresent('input[name="newUsername"]', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-05-username-appears.png')

      // Step 10: Fill username
      .setValue('input[name="newUsername"]', newUsername)
      .pause(4000) // Longer wait for availability check (CI is slower)
      
      // Step 11: Verify REGISTER USER button appears
      .waitForElementPresent('button[type="submit"]', 10000)
      .execute(function() {
        const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
        const registerButton = buttons.find(b => b.textContent.includes('REGISTER USER'));
        return {
          hasRegisterButton: !!registerButton,
          buttonText: registerButton ? registerButton.textContent : null,
          disabled: registerButton ? registerButton.disabled : null
        };
      }, function(result) {
        console.log('Register button state:', result.value);
        client.assert.ok(result.value.hasRegisterButton, 'REGISTER USER button should be present');
        client.assert.ok(!result.value.disabled, 'REGISTER USER button should be enabled');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-06-register-button.png')

      // Step 12: Click REGISTER USER button - use execute for reliability
      .execute(function() {
        const buttons = document.querySelectorAll('button[type="submit"]');
        for (let button of buttons) {
          if (button.textContent.includes('REGISTER USER') && !button.disabled) {
            button.click();
            return { clicked: true };
          }
        }
        return { clicked: false };
      }, function(result) {
        console.log('Register button click:', result.value);
      })
      .pause(5000) // Longer wait for registration to complete in CI
      
      // Step 13: Verify successful registration and redirect
      .execute(function() {
        return {
          url: window.location.pathname,
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
          username: typeof Meteor !== 'undefined' && Meteor.user() ? Meteor.user().username : null
        };
      }, function(result) {
        console.log('After registration:', result.value);
        client.assert.ok(result.value.userId, 'User should be logged in after registration');
        client.assert.equal(result.value.username, newUsername, 'Username should match');
      })
      .verify.not.urlContains('/login', 'Should be redirected away from login page')
      .verify.urlEquals('http://localhost:3000/', 'Should be redirected to home page')
      .saveScreenshot('tests/nightwatch/screenshots/login/inline-07-registration-success.png');
  });
  it('should be able to logout', function(client) {
    client
      // User should already be logged in from the previous test
      // Verify we're on the home page and logged in
      .url('http://localhost:3000/')
      .pause(2000)
      
      // Verify user is logged in
      .execute(function() {
        return {
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
          username: typeof Meteor !== 'undefined' && Meteor.user() ? Meteor.user().username : null
        };
      }, function(result) {
        console.log('Current user state:', result.value);
        client.assert.ok(result.value.userId, 'User should be logged in');
        client.assert.equal(result.value.username, newUsername, 'Should be logged in as ' + newUsername);
      })
      
      // Wait for header with logout button
      .waitForElementPresent('#header', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/login/11-before-logout.png')
      
      // Find and click logout element (might be a link or button)
      .execute(function() {
        // Look for logout text in various elements
        const elements = document.querySelectorAll('a, button, span');
        for (let elem of elements) {
          if (elem.textContent && elem.textContent.toUpperCase().includes('LOGOUT')) {
            elem.click();
            return { found: true, type: elem.tagName, text: elem.textContent };
          }
        }
        return { found: false };
      }, function(result) {
        console.log('Logout element search:', result.value);
        client.assert.ok(result.value.found, 'Should find logout element');
      })
      .pause(2000)
      
      // Verify logout was successful
      .execute(function() {
        return {
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
          url: window.location.pathname
        };
      }, function(result) {
        console.log('After logout:', result.value);
        client.assert.ok(!result.value.userId, 'User should be logged out');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/12-successful-logout.png');
  });
  it('should show error message for invalid credentials', function(client) {
    client
      // Logout first if logged in
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          Meteor.logout(done);
        } else {
          done();
        }
      })
      .pause(1000)
      
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('body', 5000)
      .pause(1000)
      
      // Fill in valid username directly (use the user created in registration test)
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', newUsername)
      .pause(2000) // Wait for user check
      
      // Now enter wrong password
      .waitForElementPresent('input[name="password"]:not([disabled])', 5000)
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'wrongpassword')
      .saveScreenshot('tests/nightwatch/screenshots/login/06-invalid-credentials.png')
      
      // Wait for button to be ready (not checking user)
      .waitForElementPresent('button[type="submit"]', 5000)
      .pause(1000) // Extra time for any async checks
      
      // Check form state and submit
      .execute(function() {
        const submitButton = document.querySelector('button[type="submit"]');
        const usernameField = document.querySelector('input[name="username"]');
        const passwordField = document.querySelector('input[name="password"]');
        
        // Log current state
        const state = {
          buttonExists: !!submitButton,
          buttonDisabled: submitButton ? submitButton.disabled : null,
          buttonText: submitButton ? submitButton.textContent : '',
          username: usernameField ? usernameField.value : '',
          password: passwordField ? passwordField.value : '',
          passwordDisabled: passwordField ? passwordField.disabled : null
        };
        console.log('Form state:', state);
        
        // If button says "CHECKING...", wait
        if (submitButton && submitButton.textContent.includes('CHECKING')) {
          return { clicked: false, reason: 'Still checking user' };
        }
        
        // Try to submit
        if (submitButton && usernameField && passwordField && 
            usernameField.value && passwordField.value) {
          submitButton.click();
          return { clicked: true, state: state };
        }
        
        return { clicked: false, state: state };
      }, function(result) {
        console.log('Submit attempt:', result.value);
      })
      .pause(3000) // Give time for login attempt
      
      // Check for error message or if we're still on login page
      .execute(function() {
        const alert = document.querySelector('.MuiAlert-root');
        const stillOnLogin = window.location.pathname.includes('/login');
        return {
          hasAlert: !!alert,
          alertText: alert ? alert.textContent : '',
          stillOnLogin: stillOnLogin,
          url: window.location.pathname
        };
      }, function(result) {
        console.log('After login attempt:', result.value);
        // Verify we're still on login page (login failed)
        client.verify.ok(result.value.stillOnLogin, 'Should remain on login page after failed login');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/07-invalid-credentials-error.png');
  });

  it('should successfully log in with valid credentials', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(2000)
      .waitForElementVisible('body', 10000)
      .pause(1000)
      
      // Fill in username first
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', newUsername)
      .pause(4000) // Longer wait for user check (CI is slower)

      // Wait for password field to be enabled if user exists
      .waitForElementPresent('input[name="password"]:not([disabled])', 15000)

      // Now fill password
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', password)
      .pause(1000) // Let React validation update
      .saveScreenshot('tests/nightwatch/screenshots/login/04-filled-form.png')

      // Debug: Check submit button state before trying to click
      .execute(function() {
        const submitBtn = document.querySelector('button[type="submit"]');
        return {
          exists: !!submitBtn,
          disabled: submitBtn ? submitBtn.disabled : null,
          text: submitBtn ? submitBtn.textContent : null
        };
      }, function(result) {
        console.log('Submit button state:', result.value);
      })

      // Wait for submit button to be enabled (longer timeout for CI)
      .waitForElementNotPresent('button[type="submit"][disabled]', 10000)
      .pause(500)

      // Click submit - use execute block for more reliable clicking
      .execute(function() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          return { clicked: true };
        }
        return { clicked: false, disabled: submitBtn ? submitBtn.disabled : true };
      }, function(result) {
        console.log('Submit click result:', result.value);
      })
      .pause(5000) // Longer wait for login to complete in CI

      // Check if we've successfully logged in
      .execute(function() {
        return {
          path: window.location.pathname,
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
          hasLoginForm: !!document.querySelector('form input[name="username"]')
        };
      }, function(result) {
        console.log('Login result:', result.value);
      })
      
      // Verify we're no longer on login page
      .verify.not.urlContains('/login', 'Should not remain on login page')
      .saveScreenshot('tests/nightwatch/screenshots/login/05-successful-login.png');
  });

  after(function(client) {
    // Cleanup
    client
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined') {
          // First logout if logged in
          if (Meteor.userId()) {
            console.log('after: Logging out before cleanup');
            Meteor.logout(function() {
              // Then clear users
              console.log('after: Clearing test users');
              Meteor.call('test.clearUsers', done);
            });
          } else {
            console.log('after: Clearing test users (no user logged in)');
            Meteor.call('test.clearUsers', done);
          }
        } else {
          done();
        }
      })
      .pause(1000) // Give cleanup time to complete
      .end();
  });
});