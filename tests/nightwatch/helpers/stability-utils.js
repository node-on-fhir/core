// tests/nightwatch/helpers/stability-utils.js
// Utility functions to improve test stability in CI environments

/**
 * Stable setValue operation with retry logic
 * @param {Object} browser - Nightwatch browser object
 * @param {string} selector - Element selector
 * @param {string} value - Value to set
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 */
function stableSetValue(browser, selector, value, maxRetries = 3) {
  let attempts = 0;
  
  function attemptSetValue() {
    attempts++;
    
    browser
      .pause(500)  // Small pause before interaction
      .waitForElementVisible(selector, 10000)
      .pause(300)  // Ensure element is fully rendered
      .clearValue(selector)
      .pause(200)
      .setValue(selector, value, function(result) {
        if (result.status === -1 && attempts < maxRetries) {
          console.log(`setValue failed for ${selector}, attempt ${attempts}/${maxRetries}. Retrying...`);
          // Refresh and retry
          browser.refresh();
          browser.pause(2000);
          browser.waitForElementVisible(selector, 10000);
          attemptSetValue();
        }
      });
  }
  
  attemptSetValue();
}

/**
 * Stable click operation with retry logic
 * @param {Object} browser - Nightwatch browser object
 * @param {string} selector - Element selector
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 */
function stableClick(browser, selector, maxRetries = 3) {
  let attempts = 0;
  
  function attemptClick() {
    attempts++;
    
    browser
      .pause(300)
      .waitForElementVisible(selector, 10000)
      .pause(200)
      .click(selector, function(result) {
        if (result.status === -1 && attempts < maxRetries) {
          console.log(`Click failed for ${selector}, attempt ${attempts}/${maxRetries}. Retrying...`);
          browser.pause(1000);
          attemptClick();
        }
      });
  }
  
  attemptClick();
}

/**
 * Wait for page to be fully loaded and interactive
 * @param {Object} browser - Nightwatch browser object
 */
function waitForPageReady(browser) {
  browser
    .pause(1000)
    .execute(function() {
      return {
        readyState: document.readyState,
        meteorReady: typeof Meteor !== 'undefined' && Meteor.status().connected,
        hasReactRoot: document.getElementById('react-target') !== null,
        sessionReady: typeof Session !== 'undefined'
      };
    }, [], function(result) {
      console.log('Page ready state:', result.value);
    })
    .pause(500);
}

/**
 * Set form value with Material UI compatibility
 * @param {Object} browser - Nightwatch browser object
 * @param {string} selector - Element selector
 * @param {string} value - Value to set
 */
function setFormValue(browser, selector, value) {
  browser
    .waitForElementVisible(selector, 10000)
    .execute(function(sel, val) {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      // Check if it's already focused
      if (document.activeElement !== element) {
        element.focus();
      }
      
      // Clear existing value
      element.value = '';
      
      // Trigger input event for React
      const inputEvent = new Event('input', { bubbles: true });
      element.dispatchEvent(inputEvent);
      
      // Set new value
      element.value = val;
      
      // Trigger change event
      const changeEvent = new Event('change', { bubbles: true });
      element.dispatchEvent(changeEvent);
      
      // Blur to ensure validation
      element.blur();
      
      return true;
    }, [selector, value])
    .pause(300);  // Allow React to process
}

/**
 * Handle Material-UI Select component
 * @param {Object} browser - Nightwatch browser object
 * @param {string} selectSelector - Select element selector
 * @param {string} optionValue - Option value to select
 */
function selectMaterialUIOption(browser, selectSelector, optionValue) {
  browser
    .waitForElementVisible(selectSelector, 10000)
    .click(selectSelector)
    .pause(500)  // Wait for dropdown animation
    .execute(function(value) {
      // Find option in the portal-rendered menu
      const options = document.querySelectorAll('li[role="option"]');
      for (let option of options) {
        if (option.getAttribute('data-value') === value || 
            option.textContent.includes(value)) {
          option.click();
          return true;
        }
      }
      return false;
    }, [optionValue])
    .pause(300);
}

/**
 * Wait for Meteor client to be fully initialized with retry logic
 * This is critical for CI environments where the client bundle may load slowly
 * @param {Object} browser - Nightwatch browser object
 * @param {Function} callback - Callback function(ready: boolean)
 * @param {number} maxRetries - Maximum retry attempts (default: 30 = 30 seconds)
 */
function waitForMeteor(browser, callback, maxRetries = 30) {
  let retries = 0;

  function checkMeteor() {
    browser.execute(function() {
      try {
        return {
          meteorDefined: typeof Meteor !== 'undefined',
          sessionDefined: typeof Session !== 'undefined',
          collectionsReady: typeof Meteor !== 'undefined' && typeof Meteor.Collections !== 'undefined',
          reactTarget: document.getElementById('react-target') !== null,
          hasChildren: document.getElementById('react-target')?.children?.length > 0
        };
      } catch (e) {
        return { error: e.message };
      }
    }, [], function(result) {
      const state = result.value || {};

      // Check if all critical components are ready
      const isReady = state.meteorDefined &&
                      state.sessionDefined &&
                      state.collectionsReady &&
                      state.reactTarget &&
                      state.hasChildren;

      if (isReady) {
        console.log('[waitForMeteor] Meteor client ready:', state);
        if (callback) callback(true);
      } else if (retries < maxRetries) {
        retries++;
        if (retries % 5 === 0) {
          console.log('[waitForMeteor] Waiting for Meteor... attempt ' + retries + '/' + maxRetries, state);
        }
        browser.pause(1000);
        checkMeteor();
      } else {
        console.error('[waitForMeteor] TIMEOUT: Meteor not available after ' + maxRetries + ' seconds');
        console.error('[waitForMeteor] Final state:', state);
        if (callback) callback(false);
      }
    });
  }

  checkMeteor();
}

/**
 * Save form with stability checks
 * @param {Object} browser - Nightwatch browser object
 */
function saveFormWithVerification(browser) {
  // Capture current URL before save
  browser.url(function(result) {
    const beforeUrl = result.value;
    
    // Click save button
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save')) {
          button.click();
          return true;
        }
      }
      return false;
    });
    
    // Wait for navigation or error
    browser.pause(2000);
    
    // Check if we navigated away (successful save)
    browser.url(function(afterResult) {
      const afterUrl = afterResult.value;
      if (beforeUrl === afterUrl) {
        // Still on same page - check for errors
        browser.execute(function() {
          const errorElements = document.querySelectorAll('.error, .MuiAlert-root, [role="alert"]');
          const errors = Array.from(errorElements).map(el => el.textContent);
          console.error('Save may have failed. Errors found:', errors);
          return errors;
        });
      }
    });
  });
}

module.exports = {
  stableSetValue,
  stableClick,
  waitForPageReady,
  waitForMeteor,
  setFormValue,
  selectMaterialUIOption,
  saveFormWithVerification
};