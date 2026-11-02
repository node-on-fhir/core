// tests/nightwatch/honeycomb/default/accounts.landing.js
// One-door adaptive landing (design handoff 2026-11-01): the AuthGuard
// fallback renders first-visit doors (no chronicle.lastUser) or the
// returning-user Continue-as state (lastUser present). Uses /oauth-clients —
// a requireAuth:true core route — to reliably reach the fallback logged out.

const SEEDED_LAST_USER = {
  v: 1,
  userId: 'landing-test-user',
  email: 'abbie@chronicle.health',
  username: 'awatson',
  displayName: 'Abbie Watson',
  initials: 'AW',
  lastLoginAt: new Date().toISOString(),
  passkeyEnrolled: false
};

describe('Accounts - One-door landing (guard fallback)', function() {
  beforeEach(function(client) {
    client
      .url('http://localhost:3000/')
      .pause(1000)
      .executeAsync(function(done) {
        try { window.localStorage.removeItem('chronicle.lastUser'); } catch (e) {}
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          Meteor.logout(function() { done(); });
        } else { done(); }
      })
      .pause(500);
  });

  it('first visit shows the two door tiles, no lastUser', function(client) {
    client
      .url('http://localhost:3000/oauth-clients')
      .pause(1500)
      .waitForElementVisible('[data-testid="landing-new"]', 10000)
      .verify.elementPresent('[data-testid="landing-existing"]')
      .assert.textContains('body', 'Welcome to')
      .verify.not.elementPresent('[data-testid="landing-continue"]')
      .saveScreenshot('tests/nightwatch/screenshots/landing/01-first-visit-doors.png');
  });

  it("I'm-new-here tile lands on the create step with editable email", function(client) {
    client
      .url('http://localhost:3000/oauth-clients')
      .pause(1500)
      .waitForElementVisible('[data-testid="landing-new"]', 10000)
      .click('[data-testid="landing-new"]')
      .pause(1500)
      .verify.urlContains('/signup')
      .waitForElementVisible('[data-testid="auth-card"]', 10000)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'create')
      .verify.elementPresent('input[name="email"]')
      .saveScreenshot('tests/nightwatch/screenshots/landing/02-new-here.png');
  });

  it('returning user sees Welcome back + Continue-as, which opens password step with chip', function(client) {
    client
      .url('http://localhost:3000/')
      .pause(500)
      .execute(function(seed) {
        window.localStorage.setItem('chronicle.lastUser', JSON.stringify(seed));
      }, [SEEDED_LAST_USER])
      .url('http://localhost:3000/oauth-clients')
      .pause(1500)
      .waitForElementVisible('[data-testid="landing-continue"]', 10000)
      .assert.textContains('body', 'Welcome back, Abbie')
      .assert.textContains('[data-testid="landing-continue"]', 'Continue as Abbie Watson')
      .assert.textContains('[data-testid="landing-continue"]', 'abbie@chronicle.health')
      .click('[data-testid="landing-continue"]')
      .pause(1500)
      .verify.urlContains('/signin')
      .waitForElementVisible('[data-testid="auth-card"]', 10000)
      .assert.attributeEquals('[data-testid="auth-card"]', 'data-step', 'password')
      .assert.textContains('[data-testid="auth-email-chip"]', 'abbie@chronicle.health')
      .saveScreenshot('tests/nightwatch/screenshots/landing/03-continue-as.png');
  });

  it('Switch account clears lastUser and shows the first-visit doors', function(client) {
    client
      .url('http://localhost:3000/')
      .pause(500)
      .execute(function(seed) {
        window.localStorage.setItem('chronicle.lastUser', JSON.stringify(seed));
      }, [SEEDED_LAST_USER])
      .url('http://localhost:3000/oauth-clients')
      .pause(1500)
      .waitForElementVisible('[data-testid="landing-switch"]', 10000)
      .click('[data-testid="landing-switch"]')
      .pause(1000)
      .waitForElementVisible('[data-testid="landing-new"]', 10000)
      .verify.not.elementPresent('[data-testid="landing-continue"]')
      .execute(function() {
        var raw = null;
        try { raw = window.localStorage.getItem('chronicle.lastUser'); } catch (e) {}
        return { lastUser: raw };
      }, [], function(result) {
        client.assert.equal(result.value.lastUser, null, 'lastUser cleared by Switch account');
      })
      .saveScreenshot('tests/nightwatch/screenshots/landing/04-switch-account.png');
  });

  it('invalid lastUser payloads are treated as absent', function(client) {
    client
      .url('http://localhost:3000/')
      .pause(500)
      .execute(function() {
        window.localStorage.setItem('chronicle.lastUser', JSON.stringify({ v: 99, email: 'x@y.z' }));
      })
      .url('http://localhost:3000/oauth-clients')
      .pause(1500)
      .waitForElementVisible('[data-testid="landing-new"]', 10000)
      .verify.not.elementPresent('[data-testid="landing-continue"]')
      .saveScreenshot('tests/nightwatch/screenshots/landing/05-invalid-payload.png');
  });
});
