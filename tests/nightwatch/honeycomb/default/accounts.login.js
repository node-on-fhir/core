// tests/nightwatch/honeycomb/default/accounts.login.js
// One-door AuthCard flow at /signin (design handoff 2026-11-01): email first,
// the card morphs into sign-in or sign-up based on account existence. The
// data-step attribute on [data-testid="auth-card"] carries the reducer step —
// assert on it, not on copy.
//
// IMPORTANT: requires accounts.enabled: true and DEV_AUTO_LOGIN off (an
// auto-logged-in session never sees the auth card).

const { get } = require('lodash');

const SEEDED = {
  username: 'onedoorjane',
  email: 'onedoorjane@test.org',
  password: 'correct horse battery staple'
};

function seedUser(client) {
  client.executeAsync(function(creds, done) {
    if (typeof Meteor === 'undefined') { done({ error: 'no meteor' }); return; }
    function create() {
      Meteor.call('test.createTestUser', creds, function(err, result) {
        done({ error: err && err.message, result: result });
      });
    }
    if (Meteor.userId()) { Meteor.logout(create); } else { create(); }
  }, [SEEDED]);
}

describe('Accounts - One-door AuthCard (/signin)', function() {
  before(function(client) {
    client
      .url(get(client, 'globals.launch_url', 'http://localhost:3000'))
      .pause(2000);
    seedUser(client);
  });

  beforeEach(function(client) {
    client
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          Meteor.logout(function() { done(); });
        } else { done(); }
      })
      .pause(500);
  });

  it('opens at the email step with one email field and Continue', function(client) {
    client
      .url('http://localhost:3000/signin')
      .pause(1000)
      .waitForElementVisible('[data-testid="auth-card"]', 10000)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'email')
      .verify.elementPresent('input[name="email"]')
      .verify.elementPresent('[data-testid="auth-submit"]')
      .verify.not.elementPresent('input[name="confirmPassword"]')
      .saveScreenshot('tests/nightwatch/screenshots/login/01-email-step.png');
  });

  it('known email morphs to the password step with the email chip', function(client) {
    client
      .url('http://localhost:3000/signin')
      .pause(1000)
      .waitForElementVisible('input[name="email"]', 10000)
      .setValue('input[name="email"]', SEEDED.email)
      .click('[data-testid="auth-submit"]')
      .pause(2000)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'password')
      .verify.elementPresent('[data-testid="auth-email-chip"]')
      .assert.textContains('[data-testid="auth-email-chip"]', SEEDED.email)
      .verify.elementPresent('input[name="password"]')
      .saveScreenshot('tests/nightwatch/screenshots/login/02-password-step.png');
  });

  it('unknown email morphs to create with NEW HERE badge and NO red error', function(client) {
    client
      .url('http://localhost:3000/signin')
      .pause(1000)
      .waitForElementVisible('input[name="email"]', 10000)
      .setValue('input[name="email"]', 'brandnewuser' + Date.now() + '@example.com')
      .click('[data-testid="auth-submit"]')
      .pause(2000)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'create')
      .verify.elementPresent('[data-testid="auth-new-badge"]')
      .verify.elementPresent('input[name="username"]')
      .verify.not.elementPresent('.MuiAlert-standardError')
      .verify.not.elementPresent('input[aria-invalid="true"]')
      .assert.valueContains('input[name="username"]', 'brandnewuser')
      .saveScreenshot('tests/nightwatch/screenshots/login/03-create-morph.png');
  });

  it('wrong passphrase stays on password with neutral helper text', function(client) {
    client
      .url('http://localhost:3000/signin')
      .pause(1000)
      .waitForElementVisible('input[name="email"]', 10000)
      .setValue('input[name="email"]', SEEDED.email)
      .click('[data-testid="auth-submit"]')
      .pause(2000)
      .waitForElementVisible('input[name="password"]', 10000)
      .setValue('input[name="password"]', 'definitely wrong passphrase')
      .click('[data-testid="auth-submit"]')
      .pause(2500)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'password')
      .assert.textContains('[data-testid="auth-card"]', "didn't match")
      .assert.valueEquals('input[name="password"]', '')
      .saveScreenshot('tests/nightwatch/screenshots/login/04-wrong-passphrase.png');
  });

  it('correct passphrase signs in and writes chronicle.lastUser', function(client) {
    client
      .url('http://localhost:3000/signin')
      .pause(1000)
      .waitForElementVisible('input[name="email"]', 10000)
      .setValue('input[name="email"]', SEEDED.email)
      .click('[data-testid="auth-submit"]')
      .pause(2000)
      .waitForElementVisible('input[name="password"]', 10000)
      .setValue('input[name="password"]', SEEDED.password)
      .click('[data-testid="auth-submit"]')
      .pause(3000)
      .execute(function() {
        var raw = null;
        try { raw = window.localStorage.getItem('chronicle.lastUser'); } catch (e) {}
        return {
          userId: (typeof Meteor !== 'undefined') ? Meteor.userId() : null,
          lastUser: raw ? JSON.parse(raw) : null
        };
      }, [], function(result) {
        client.assert.ok(result.value.userId, 'logged in (Meteor.userId set)');
        client.assert.ok(result.value.lastUser, 'chronicle.lastUser written');
        client.assert.equal(result.value.lastUser.v, 1, 'lastUser contract v1');
        client.assert.equal(result.value.lastUser.email, 'onedoorjane@test.org');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/05-signed-in.png');
  });

  it('Change returns to email with the value preserved', function(client) {
    client
      .url('http://localhost:3000/signin')
      .pause(1000)
      .waitForElementVisible('input[name="email"]', 10000)
      .setValue('input[name="email"]', SEEDED.email)
      .click('[data-testid="auth-submit"]')
      .pause(2000)
      .waitForElementVisible('[data-testid="auth-change-email"]', 10000)
      .click('[data-testid="auth-change-email"]')
      .pause(800)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'email')
      .assert.valueEquals('input[name="email"]', SEEDED.email)
      .saveScreenshot('tests/nightwatch/screenshots/login/06-change-email.png');
  });

  it('/signup deep link opens directly in create with editable email', function(client) {
    client
      .url('http://localhost:3000/signup')
      .pause(1000)
      .waitForElementVisible('[data-testid="auth-card"]', 10000)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'create')
      .verify.elementPresent('input[name="email"]')
      .verify.elementPresent('input[name="username"]')
      .verify.elementPresent('[data-testid="auth-pass-meter"]')
      .verify.not.elementPresent('[data-testid="auth-email-chip"]')
      .saveScreenshot('tests/nightwatch/screenshots/login/07-signup-direct.png');
  });

  it('legacy aliases /login and /sign-in render the card', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(1000)
      .waitForElementVisible('[data-testid="auth-card"]', 10000)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'email')
      .url('http://localhost:3000/sign-in')
      .pause(1000)
      .waitForElementVisible('[data-testid="auth-card"]', 10000)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'email');
  });
});
