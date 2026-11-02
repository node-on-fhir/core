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
        // Clear any existing test users and logout if needed
        if (typeof Meteor !== 'undefined') {
          // First logout if logged in
          if (Meteor.userId()) {
            Meteor.logout(function() {
              // Then clear users
              Meteor.call('test.clearUsers', function(err) {
                done();
              });
            });
          } else {
            // Just clear users
            Meteor.call('test.clearUsers', function(err) {
              done();
            });
          }
        } else {
          done();
        }
      });
  });
  
  beforeEach(function(client) {
    // Ensure clean state before each test
    client
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          Meteor.logout(done);
        } else {
          done();
        }
      })
      .pause(500);
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
      // One-door redesign: NO confirm-password field; visible passphrase with
      // eye toggle + 4-segment length meter instead (NIST 800-63B).
      .verify.not.elementPresent('input[name="confirm"]')
      .verify.not.elementPresent('input[name="confirmPassword"]')
      .verify.elementPresent('[data-testid="auth-pass-toggle"]')
      .verify.elementPresent('button[type="submit"]')
      // One-door card opens /register (alias of /signup) directly in create
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'create')
      .verify.elementPresent('[data-testid="auth-new-badge"]')
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

  it('should enforce username requirements at submit', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)

      // One-door card validates at submit (no live availability check):
      // valid email + strong passphrase, short username → field error, stays
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', 'shortname@example.com')
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'ab')
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'correct horse battery staple')
      .pause(300)
      .click('[data-testid="auth-submit"]')
      .pause(800)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'create')
      .assert.textContains('[data-testid="auth-card"]', '3-30')
      .saveScreenshot('tests/nightwatch/screenshots/signup/03-short-username.png');
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

  it('should show the passphrase meter and gate submit on 12-char minimum', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)

      // Fill the other required fields so passphrase length is the only gate
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'meterprobe' + Date.now().toString().slice(-6))
      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', 'meterprobe@example.com')
      .pause(1500) // availability check debounce

      // Short passphrase (<12): meter shows first bucket, submit stays disabled
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'shortpass')
      .pause(500)
      .verify.elementPresent('[data-testid="auth-pass-meter"]')
      .verify.attributeContains('button[type="submit"]', 'disabled', '')
      .saveScreenshot('tests/nightwatch/screenshots/signup/09-passphrase-short.png')

      // 12+ passphrase: visible by default (type=text), submit becomes enabled
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'correct horse battery staple')
      .pause(1000)
      .verify.not.elementPresent('button[type="submit"][disabled]')
      .saveScreenshot('tests/nightwatch/screenshots/signup/10-passphrase-strong.png');
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
      
      // One-door flow: successful create lands on the WELCOME step (no
      // immediate redirect); Open my workstation is the exit.
      .waitForElementVisible('[data-testid="welcome-open"]', 10000)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'welcome')
      .execute(function() {
        var raw = null;
        try { raw = window.localStorage.getItem('chronicle.lastUser'); } catch (e) {}
        return {
          userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
          lastUser: raw ? JSON.parse(raw) : null
        };
      }, [], function(result) {
        client.assert.ok(result.value.userId, 'account created and signed in');
        client.assert.ok(result.value.lastUser, 'chronicle.lastUser written on create');
      })
      .click('[data-testid="welcome-open"]')
      .pause(2000)
      .verify.not.urlContains('/register', 'Open my workstation leaves the register page')
      .saveScreenshot('tests/nightwatch/screenshots/signup/13-registration-success.png');
  });

  it('should prevent duplicate username registration', function(client) {
    const timestamp = moment().format('YYYYMMDDHHmmss');
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)

      // Re-use the username created by the registration test above (shared
      // module-level timestamp was per-run; derive the duplicate by creating
      // one first via the test fixture for determinism).
      .executeAsync(function(ts, done) {
        Meteor.call('test.createTestUser', {
          username: 'testuserdup' + ts,
          email: 'testuserdup' + ts + '@example.com',
          password: 'correct horse battery staple'
        }, function(err) { done({ error: err && err.message }); });
      }, [timestamp])
      .pause(500)

      .clearValue('input[name="email"], input[type="email"]')
      .setValue('input[name="email"], input[type="email"]', 'unrelated' + timestamp + '@example.com')
      .clearValue('input[name="username"]')
      .setValue('input[name="username"]', 'testuserdup' + timestamp)
      .clearValue('input[name="password"]')
      .setValue('input[name="password"]', 'another strong passphrase here')
      .pause(300)
      .click('[data-testid="auth-submit"]')
      .pause(3000)

      // One-door behavior: submit → server rejects → field-level error,
      // card stays on create. No red banner walls.
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'create')
      .assert.textContains('[data-testid="auth-card"]', 'taken')
      .verify.urlContains('/register', 'Should remain on register page')
      .saveScreenshot('tests/nightwatch/screenshots/signup/14-duplicate-username-error.png');
  });

  it('should provide a path for users who already have an account', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)

      // One-door: the quiet "Already have an account…" action returns the
      // SAME card to the email step — no route change needed, the email
      // check routes known accounts to sign-in.
      .verify.elementPresent('[data-testid="auth-have-account"]')
      .click('[data-testid="auth-have-account"]')
      .pause(800)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'email')
      .saveScreenshot('tests/nightwatch/screenshots/signup/16-have-account-door.png');
  });

  it('should have proper tab order for keyboard navigation', function(client) {
    client
      .url('http://localhost:3000/register')
      .pause(1000)
      .waitForElementVisible('form', 5000)
      
      // One-door create order: email → username → passphrase → (toggle/submit)
      .click('input[name="email"], input[type="email"]')
      .pause(100)
      .sendKeys('input[name="email"], input[type="email"]', client.Keys.TAB)
      .pause(100)
      .verify.elementPresent('input[name="username"]:focus')

      .sendKeys('input[name="username"]', client.Keys.TAB)
      .pause(100)
      .verify.elementPresent('input[name="password"]:focus')

      .sendKeys('input[name="password"]', client.Keys.TAB)
      .pause(100)
      .execute(function() {
        const activeElement = document.activeElement;
        return {
          tagName: activeElement.tagName,
          testid: activeElement.getAttribute && activeElement.getAttribute('data-testid'),
          type: activeElement.type
        };
      }, function(result) {
        console.log('Active element after passphrase:', result.value);
        // Eye toggle (inside the field) or the submit button both acceptable
        client.verify.ok(
          result.value.testid === 'auth-pass-toggle' || result.value.type === 'submit' || result.value.tagName === 'BUTTON',
          'Focus should be on the eye toggle or a button'
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
      
      // One-door passphrase is VISIBLE by default (type=text, NIST 800-63B);
      // the eye toggle flips it to masked.
      .verify.attributeContains('input[name="password"]', 'type', 'text')
      .click('[data-testid="auth-pass-toggle"]')
      .pause(300)
      .verify.attributeContains('input[name="password"]', 'type', 'password')
      .click('[data-testid="auth-pass-toggle"]')
      .pause(300)

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
          // Logout first
          if (Meteor.userId()) {
            Meteor.logout(function() {
              // Then clear users
              Meteor.call('test.clearUsers', done);
            });
          } else {
            Meteor.call('test.clearUsers', done);
          }
        } else {
          done();
        }
      })
      .end();
  });
});