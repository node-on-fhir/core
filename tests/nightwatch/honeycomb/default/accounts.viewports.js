// tests/nightwatch/honeycomb/default/accounts.viewports.js
// Responsive + accessibility checks for the one-door AuthCard at /login
// (design handoff 2026-11-01: works at desktop, tablet, and phone widths
// with no horizontal scroll; email-first card, keyboard reachable).

const { get } = require('lodash');

describe('Accounts - AuthCard viewports & accessibility', function() {
  before(function(client) {
    client
      .url(get(client, 'globals.launch_url', 'http://localhost:3000'))
      .pause(2000)
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          Meteor.logout(done);
        } else { done(); }
      })
      .pause(1000);
  });

  beforeEach(function(client) {
    client
      .executeAsync(function(done) {
        if (typeof Meteor !== 'undefined' && Meteor.userId()) {
          Meteor.logout(done);
        } else { done(); }
      })
      .pause(500);
  });

  it('should be responsive across different screen sizes without horizontal scroll', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(2000)

      // Acceptance widths from the handoff: 1920×1080, 1440×810, 1180×820
      .resizeWindow(1920, 1080)
      .pause(1000)
      .waitForElementVisible('[data-testid="auth-card"]', 10000)
      .verify.elementPresent('input[name="email"]')
      .execute(function() {
        return { overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      }, [], function(result) {
        client.assert.equal(result.value.overflow, false, 'no horizontal scroll at 1920');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/12-desktop-1920.png')

      .resizeWindow(1440, 810)
      .pause(1000)
      .verify.elementPresent('[data-testid="auth-card"]')
      .execute(function() {
        return { overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      }, [], function(result) {
        client.assert.equal(result.value.overflow, false, 'no horizontal scroll at 1440');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/13-laptop-1440.png')

      .resizeWindow(1180, 820)
      .pause(1000)
      .verify.elementPresent('[data-testid="auth-card"]')
      .execute(function() {
        return { overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      }, [], function(result) {
        client.assert.equal(result.value.overflow, false, 'no horizontal scroll at iPad landscape');
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/14-ipad-1180.png')

      .resizeWindow(375, 667)
      .pause(1000)
      .verify.elementPresent('[data-testid="auth-card"]')
      .verify.elementPresent('input[name="email"]')
      .saveScreenshot('tests/nightwatch/screenshots/login/15-mobile-375.png')

      .resizeWindow(1024, 768)
      .pause(500);
  });

  it('should have proper accessibility attributes on the email step', function(client) {
    client
      .url('http://localhost:3000/login')
      .pause(2000)
      .waitForElementVisible('[data-testid="auth-card"]', 10000)

      .verify.elementPresent('input[name="email"]')
      .verify.attributeContains('input[name="email"]', 'type', 'email')
      .verify.attributeContains('input[name="email"]', 'autocomplete', 'username')
      // Exactly one primary submit on the step
      .verify.elementPresent('button[type="submit"][data-testid="auth-submit"]')

      // Keyboard: email field → submit is reachable by TAB
      .click('input[name="email"]')
      .sendKeys('input[name="email"]', client.Keys.TAB)
      .pause(500)
      .execute(function() {
        const el = document.activeElement;
        return { tag: el.tagName, type: el.type, testid: el.getAttribute && el.getAttribute('data-testid') };
      }, [], function(result) {
        client.assert.ok(
          result.value.tag === 'BUTTON' || result.value.type === 'submit',
          'TAB from email reaches a button'
        );
      })
      .saveScreenshot('tests/nightwatch/screenshots/login/16-accessibility-check.png');
  });

  after(function(client) {
    client.end();
  });
});
