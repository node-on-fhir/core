// tests/nightwatch/honeycomb/theme/ambianceControls.js
// E2E: Theme & Palette ambiance controls persist across reload.
// Spec: docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

module.exports = {
  '01. Open dialog, pick an earth tone': function(browser) {
    browser.url('http://localhost:3000/');
    browser.pause(2000);
    browser.execute(function() { Session.set('themeDialogOpen', true); });
    browser.pause(1000);
    browser.expect.element('#themeEarthTone-sand').to.be.present;
    browser.execute(function() { document.querySelector('#themeEarthTone-sand').click(); });
    browser.pause(500);
    browser.execute(function() {
      return JSON.parse(localStorage.getItem('honeycomb.theme') || '{}').backgroundImagePath;
    }, [], function(result) {
      browser.assert.equal(result.value, 'color:#d9c7a7', 'sand persisted on the background axis');
    });
  },

  '02. Page-text toggle appears with a background and persists': function(browser) {
    browser.expect.element('#themePageModeToggle').to.be.present;
    browser.execute(function() { document.querySelector('#themePageText-light').click(); });
    browser.pause(500);
    browser.execute(function() {
      return JSON.parse(localStorage.getItem('honeycomb.theme') || '{}').pageMode;
    }, [], function(result) {
      browser.assert.ok(result.value === 'light' || result.value === 'dark', 'pageMode persisted');
    });
  },

  '03. Card surface persists across reload': function(browser) {
    browser.execute(function() { document.querySelector('#themeCardSurface-glass').click(); });
    browser.pause(500);
    browser.refresh();
    browser.pause(3000);
    browser.execute(function() { return Session.get('cardSurface'); }, [], function(result) {
      browser.assert.equal(result.value, 'glass', 'cardSurface restored at boot');
    });
  },

  '04. None hides page-mode control and clears the axis': function(browser) {
    browser.execute(function() { Session.set('themeDialogOpen', true); });
    browser.pause(1000);
    browser.execute(function() {
      var buttons = document.querySelectorAll('.MuiDialog-root button');
      for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].textContent.trim() === 'None') { buttons[i].click(); return; }
      }
    });
    browser.pause(500);
    browser.expect.element('#themePageModeToggle').to.not.be.present;
    browser.execute(function() {
      return JSON.parse(localStorage.getItem('honeycomb.theme') || '{}').backgroundImagePath;
    }, [], function(result) {
      browser.assert.ok(!result.value, 'background axis cleared by None');
    });
  },

  '05. Teardown: reset theme state': function(browser) {
    browser.execute(function() {
      var cur = JSON.parse(localStorage.getItem('honeycomb.theme') || '{}');
      delete cur.backgroundImagePath; delete cur.pageMode; delete cur.cardSurface;
      localStorage.setItem('honeycomb.theme', JSON.stringify(cur));
      Session.set('pageMode', undefined);
      Session.set('cardSurface', undefined);
      return true;
    });
    browser.pause(300);
    browser.end();
  }
};
