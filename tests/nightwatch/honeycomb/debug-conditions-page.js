// tests/nightwatch/honeycomb/debug-conditions-page.js

describe('Debug Conditions Page', function() {
  it('Check what happens when navigating to conditions', browser => {
    browser
      .url('http://localhost:3000')
      .pause(2000)
      .execute(function() {
        return {
          loggedIn: Meteor.userId() !== null,
          url: window.location.href,
          hasConditionsPage: document.querySelector('#conditionsPage') !== null,
          bodyContent: document.body.textContent.substring(0, 200)
        };
      }, [], function(result) {
        console.log('Initial state:', result.value);
      })
      .url('http://localhost:3000/conditions')
      .pause(3000)  // Give plenty of time
      .execute(function() {
        // Get all info about what's on the page
        const conditionsPage = document.querySelector('#conditionsPage');
        const conditionsTable = document.querySelector('#conditionsTable');
        const noDataCard = document.querySelector('.no-data-card');
        const allDivs = document.querySelectorAll('div[id]');
        const divIds = Array.from(allDivs).map(div => div.id).slice(0, 10);
        
        return {
          url: window.location.href,
          hasConditionsPage: conditionsPage !== null,
          hasConditionsTable: conditionsTable !== null,
          hasNoDataCard: noDataCard !== null,
          divIds: divIds,
          pageTitle: document.title,
          bodyClasses: document.body.className,
          reactTarget: document.querySelector('#react-target')?.innerHTML?.substring(0, 200)
        };
      }, [], function(result) {
        console.log('Conditions page state:', result.value);
        browser.assert.ok(
          result.value.hasConditionsPage || result.value.hasConditionsTable || result.value.hasNoDataCard,
          'At least one expected element is present'
        );
      })
      .saveScreenshot('tests/nightwatch/screenshots/conditions/debug-page-state.png')
      .end();
  });
});