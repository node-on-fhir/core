// certification/tdd/helpers/selector-helper.js
// Helper functions for finding elements with flexible selectors

/**
 * Attempts to find an element using multiple selector strategies
 * @param {Object} browser - Nightwatch browser object
 * @param {Object} selectors - Object with different selector strategies
 * @param {string} selectors.testid - data-testid value
 * @param {string} selectors.id - element id
 * @param {string} selectors.class - class name
 * @param {string} selectors.text - text content to search for
 * @param {Function} callback - Callback function (optional)
 * @returns {Object} browser - For chaining
 */
export function findElementFlexible(browser, selectors, callback) {
  const strategies = [];

  if (selectors.testid) {
    strategies.push(`[data-testid="${selectors.testid}"]`);
  }
  if (selectors.id) {
    strategies.push(`#${selectors.id}`);
  }
  if (selectors.class) {
    strategies.push(`.${selectors.class}`);
  }

  browser.execute(function(strategiesArray, textToFind) {
    // Try each selector strategy
    for (let selector of strategiesArray) {
      const element = document.querySelector(selector);
      if (element) {
        return { found: true, selector: selector, element: true };
      }
    }

    // If text search is provided, try finding by text content
    if (textToFind) {
      const allElements = document.querySelectorAll('*');
      for (let el of allElements) {
        if (el.textContent.includes(textToFind) && el.children.length === 0) {
          return { found: true, selector: 'text:' + textToFind, element: true };
        }
      }
    }

    return { found: false, selector: null };
  }, [strategies, selectors.text || null], function(result) {
    if (result.value.found) {
      console.log(`✅ Found element using selector: ${result.value.selector}`);
    } else {
      console.warn(`⚠️ Element not found with any of these selectors:`, selectors);
    }

    if (callback) {
      callback(result);
    }
  });

  return browser;
}

/**
 * Waits for an element to be visible, trying multiple selectors
 * @param {Object} browser - Nightwatch browser object
 * @param {Object} selectors - Selector strategies object
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @returns {Object} browser - For chaining
 */
export function waitForElementFlexible(browser, selectors, timeout = 5000) {
  if (selectors.testid) {
    browser.waitForElementVisible(`[data-testid="${selectors.testid}"]`, timeout);
  } else if (selectors.id) {
    browser.waitForElementVisible(`#${selectors.id}`, timeout);
  } else if (selectors.class) {
    browser.waitForElementVisible(`.${selectors.class}`, timeout);
  }

  return browser;
}

/**
 * Checks if page has loaded successfully (no 404, has content)
 * @param {Object} browser - Nightwatch browser object
 * @param {string} pageIdentifier - Identifier for logging (e.g., "170.315.a.1")
 * @returns {Object} browser - For chaining
 */
export function verifyPageLoaded(browser, pageIdentifier) {
  browser
    .assert.not.textContains('body', '404')
    .assert.not.textContains('body', 'Page not found')
    .assert.not.textContains('body', 'Cannot GET')
    .perform(function() {
      console.log(`✅ ${pageIdentifier} - Page loaded successfully (no errors)`);
    });

  return browser;
}

/**
 * Checks for page content using multiple strategies
 * @param {Object} browser - Nightwatch browser object
 * @param {Array<string>} selectors - Array of CSS selectors to try
 * @param {string} criterion - ONC criterion identifier (e.g., "170.315.a.1")
 * @returns {Object} browser - For chaining
 */
export function verifyPageContent(browser, selectors, criterion) {
  const selectorString = selectors.join(', ');

  browser.elements('css selector', selectorString, function(result) {
    if (result.value && result.value.length > 0) {
      browser.assert.ok(true, `ONC ${criterion} - Page loaded with content elements`);
    } else {
      browser.assert.ok(false, `ONC ${criterion} - No recognizable page elements found`);
    }
  });

  return browser;
}

/**
 * Takes a screenshot and logs it
 * @param {Object} browser - Nightwatch browser object
 * @param {string} filename - Screenshot filename (without path)
 * @param {string} criterion - ONC criterion identifier
 * @returns {Object} browser - For chaining
 */
export function takeScreenshot(browser, filename, criterion) {
  browser
    .saveScreenshot(`tests/screenshots/${filename}`)
    .perform(function() {
      console.log(`📸 Screenshot saved for ONC ${criterion}: ${filename}`);
    });

  return browser;
}

/**
 * Logs test completion summary
 * @param {Object} browser - Nightwatch browser object
 * @param {string} criterion - ONC criterion identifier
 * @param {string} title - Test title
 * @param {Array<string>} capabilities - List of capabilities verified
 * @returns {Object} browser - For chaining
 */
export function logTestCompletion(browser, criterion, title, capabilities) {
  browser.perform(function() {
    console.log(`✅ ONC ${criterion} - ${title} test completed`);
    if (capabilities && capabilities.length > 0) {
      console.log('📋 Verified:');
      capabilities.forEach(function(capability) {
        console.log(`   - ${capability}`);
      });
    }
  });

  return browser;
}

/**
 * Checks if element exists and is visible
 * @param {Object} browser - Nightwatch browser object
 * @param {string} selector - CSS selector
 * @param {string} description - Description for assertion message
 * @returns {Object} browser - For chaining
 */
export function assertElementExists(browser, selector, description) {
  browser.elements('css selector', selector, function(result) {
    if (result.value && result.value.length > 0) {
      browser.assert.ok(true, description || `Element exists: ${selector}`);
    } else {
      browser.assert.ok(false, description || `Element not found: ${selector}`);
    }
  });

  return browser;
}

/**
 * Checks if any of multiple elements exist (OR condition)
 * @param {Object} browser - Nightwatch browser object
 * @param {Array<string>} selectors - Array of CSS selectors
 * @param {string} description - Description for assertion
 * @returns {Object} browser - For chaining
 */
export function assertAnyElementExists(browser, selectors, description) {
  browser.execute(function(selectorArray) {
    for (let selector of selectorArray) {
      const element = document.querySelector(selector);
      if (element) {
        return { found: true, selector: selector };
      }
    }
    return { found: false };
  }, [selectors], function(result) {
    if (result.value.found) {
      browser.assert.ok(true, description || `Found element using: ${result.value.selector}`);
    } else {
      browser.assert.ok(false, description || `No elements found from: ${selectors.join(', ')}`);
    }
  });

  return browser;
}

/**
 * Waits for React/Meteor to finish rendering
 * @param {Object} browser - Nightwatch browser object
 * @param {number} timeout - Max wait time in milliseconds (default: 3000)
 * @returns {Object} browser - For chaining
 */
export function waitForReactRender(browser, timeout = 3000) {
  browser.pause(500).execute(function() {
    // Check if React has finished rendering
    return {
      meteorReady: typeof Meteor !== 'undefined',
      reactReady: typeof React !== 'undefined'
    };
  });

  return browser;
}

/**
 * Verifies a capability exists by checking for UI indicators
 * @param {Object} browser - Nightwatch browser object
 * @param {Object} config - Configuration object
 * @param {Array<string>} config.selectors - Selectors to check
 * @param {string} config.criterion - ONC criterion
 * @param {string} config.capability - Capability description
 * @returns {Object} browser - For chaining
 */
export function verifyCapability(browser, config) {
  assertAnyElementExists(
    browser,
    config.selectors,
    `ONC ${config.criterion} - ${config.capability} capability exists`
  );

  return browser;
}

// Export default object for CommonJS compatibility
module.exports = {
  findElementFlexible,
  waitForElementFlexible,
  verifyPageLoaded,
  verifyPageContent,
  takeScreenshot,
  logTestCompletion,
  assertElementExists,
  assertAnyElementExists,
  waitForReactRender,
  verifyCapability
};
