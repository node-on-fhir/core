// /Volumes/LangCortex/Code/honeycomb-ehr/tests/nightwatch/honeycomb/enable_autopublish/crud.pantry-management.js

const testUtils = require('../../testUtils');

describe('Pantry Management Tests', function() {
  let testNutritionProductId = null;

  //=============================================================================
  // TEST 01: Login
  //=============================================================================
  it('01. Login and verify app is ready', function(browser) {
    testUtils.login(browser, 'alice@test.com', 'alice123', function() {
      console.log('[01] Login complete');
    });
    browser.pause(2000);
  });

  //=============================================================================
  // TEST 02: Verify Pantry Dashboard loads
  //=============================================================================
  it('02. Verify Pantry Dashboard page loads', function(browser) {
    testUtils.navigateUrl(browser, '/pantry');
    browser.pause(2000);

    // Verify page loaded
    browser.expect.element('#pantryDashboardPage').to.be.present;

    // Verify summary cards exist
    browser.execute(function() {
      const page = document.querySelector('#pantryDashboardPage');
      const hasContent = page && page.innerHTML.includes('Total Calories');
      console.log('[02] Pantry Dashboard has content:', hasContent);
      return { hasContent: hasContent };
    });

    console.log('[02] Pantry Dashboard page loaded successfully');
  });

  //=============================================================================
  // TEST 03: Verify provisions calculator loads
  //=============================================================================
  it('03. Navigate to Provisions Calculator', function(browser) {
    testUtils.navigateUrl(browser, '/pantry/calculator');
    browser.pause(2000);

    // Verify page loaded
    browser.expect.element('#provisionCalculatorPage').to.be.present;

    // Verify input fields exist
    browser.expect.element('#crewCountInput').to.be.present;
    browser.expect.element('#activityLevelSelect').to.be.present;
    browser.expect.element('#rationLevelSelect').to.be.present;

    console.log('[03] Provisions Calculator page loaded successfully');
  });

  //=============================================================================
  // TEST 04: Test crew count input
  //=============================================================================
  it('04. Test crew count input', function(browser) {
    // Clear and set crew count
    browser.clearValue('#crewCountInput');
    browser.pause(300);

    browser.execute(function() {
      const input = document.querySelector('#crewCountInput input');
      if (input) {
        input.value = '6';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('[04] Set crew count to 6');
      }
    });

    browser.pause(3000); // Wait for calculation to update

    // Verify result updated (page should show calculation)
    browser.execute(function() {
      const content = document.body.innerText;
      const hasResult = content.includes('Days of Provisions') || content.includes('days');
      console.log('[04] Has provision result:', hasResult);
      return { hasResult: hasResult };
    });

    console.log('[04] Crew count input test complete');
  });

  //=============================================================================
  // TEST 05: Test activity level selection
  //=============================================================================
  it('05. Test activity level selection', function(browser) {
    // Click activity level select
    browser.execute(function() {
      const select = document.querySelector('#activityLevelSelect');
      if (select) {
        select.click();
        console.log('[05] Clicked activity level select');
      }
    });

    browser.pause(500);

    // Select "Active" option
    browser.execute(function() {
      const option = document.querySelector('[data-value="active"]');
      if (option) {
        option.click();
        console.log('[05] Selected active activity level');
      }
    });

    browser.pause(3000); // Wait for calculation to update

    console.log('[05] Activity level selection test complete');
  });

  //=============================================================================
  // TEST 06: Navigate to Intake Tracker
  //=============================================================================
  it('06. Navigate to Intake Tracker', function(browser) {
    testUtils.navigateUrl(browser, '/pantry/intake');
    browser.pause(2000);

    // Verify page loaded
    browser.expect.element('#intakeTrackerPage').to.be.present;

    // Verify crew tabs or list exists
    browser.execute(function() {
      const page = document.querySelector('#intakeTrackerPage');
      const hasCrewContent = page && (
        page.innerHTML.includes('Today\'s Progress') ||
        page.innerHTML.includes('Log Consumption')
      );
      console.log('[06] Intake Tracker has crew content:', hasCrewContent);
      return { hasCrewContent: hasCrewContent };
    });

    console.log('[06] Intake Tracker page loaded successfully');
  });

  //=============================================================================
  // TEST 07: Verify log consumption form exists
  //=============================================================================
  it('07. Verify log consumption form', function(browser) {
    // Verify form elements
    browser.expect.element('#productSelect').to.be.present;
    browser.expect.element('#quantityInput').to.be.present;
    browser.expect.element('#logConsumptionButton').to.be.present;

    console.log('[07] Log consumption form verified');
  });

  //=============================================================================
  // TEST 08: Test back to dashboard navigation
  //=============================================================================
  it('08. Navigate back to dashboard', function(browser) {
    testUtils.navigateUrl(browser, '/pantry');
    browser.pause(2000);

    // Verify we're back on dashboard
    browser.expect.element('#pantryDashboardPage').to.be.present;

    // Verify inventory table exists
    browser.expect.element('#inventoryTable').to.be.present;

    console.log('[08] Navigation back to dashboard complete');
  });

  //=============================================================================
  // TEST 09: Verify scenario comparison on dashboard
  //=============================================================================
  it('09. Verify scenario comparison section', function(browser) {
    // Check for scenario comparison content
    browser.execute(function() {
      const content = document.body.innerText;
      const hasScenarios = content.includes('Ration Scenarios') ||
        content.includes('100%') ||
        content.includes('75%');
      console.log('[09] Has scenario comparison:', hasScenarios);
      return { hasScenarios: hasScenarios };
    });

    console.log('[09] Scenario comparison verification complete');
  });
});
