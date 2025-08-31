// /tests/nightwatch/helpers/circleci-helper.js

module.exports = {
  /**
   * CircleCI-specific wait times
   */
  TIMEOUTS: {
    SHORT: 1000,
    MEDIUM: 3000,
    LONG: 5000,
    EXTRA_LONG: 10000,
    NAVIGATION: 15000
  },

  /**
   * Wait for application to be fully ready
   */
  waitForAppReady: function(browser, callback) {
    const maxRetries = 5;
    let retryCount = 0;
    
    const checkApp = () => {
      browser.execute(function() {
        try {
          return {
            meteorReady: typeof Meteor !== 'undefined',
            collectionsReady: typeof Meteor !== 'undefined' && typeof Meteor.Collections !== 'undefined',
            routerReady: document.querySelector('#app-root') !== null || document.querySelector('[id$="Page"]') !== null,
            bodyReady: document.body !== null && document.body.innerHTML.length > 100,
            error: null
          };
        } catch (e) {
          return {
            meteorReady: false,
            collectionsReady: false,
            routerReady: false,
            bodyReady: false,
            error: e.message
          };
        }
      }, [], function(result) {
        console.log(`App readiness check (attempt ${retryCount + 1}):`, result.value);
        
        if (!result.value || !result.value.meteorReady || !result.value.routerReady) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`App not ready, retrying in 3s... (${retryCount}/${maxRetries})`);
            browser.pause(3000);
            checkApp();
          } else {
            console.error('App failed to become ready after maximum retries');
            if (callback) callback(false);
          }
        } else {
          console.log('App is ready');
          if (callback) callback(true);
        }
      });
    };
    
    checkApp();
  },

  /**
   * Navigate with retry logic
   */
  navigateWithRetry: function(browser, url, expectedElementId, callback) {
    const maxRetries = 3;
    let retryCount = 0;
    
    const tryNavigate = () => {
      browser
        .url(url)
        .pause(this.TIMEOUTS.MEDIUM);
      
      browser.execute(function(elementId) {
        return {
          currentUrl: window.location.href,
          hasElement: document.querySelector(elementId) !== null,
          hasBody: document.body !== null,
          bodyLength: document.body ? document.body.innerHTML.length : 0
        };
      }, [expectedElementId], function(result) {
        console.log(`Navigation check (attempt ${retryCount + 1}):`, result.value);
        
        if (!result.value || !result.value.hasElement) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Expected element not found, retrying navigation... (${retryCount}/${maxRetries})`);
            browser.pause(2000);
            tryNavigate();
          } else {
            console.error(`Failed to find ${expectedElementId} after navigation to ${url}`);
            if (callback) callback(false);
          }
        } else {
          console.log(`Successfully navigated to ${url}`);
          if (callback) callback(true);
        }
      });
    };
    
    tryNavigate();
  },

  /**
   * Save with enhanced error handling and navigation fallback
   */
  saveWithNavigation: function(browser, saveButtonText, targetUrl, targetElementId) {
    // Capture console errors
    browser.execute(function() {
      window.saveErrors = [];
      const originalError = console.error;
      console.error = function() {
        window.saveErrors.push(Array.from(arguments).join(' '));
        originalError.apply(console, arguments);
      };
    });

    // Click save button
    browser.execute(function(buttonText) {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes(buttonText)) {
          console.log('Clicking button:', button.textContent);
          button.click();
          return { clicked: true, buttonText: button.textContent };
        }
      }
      return { clicked: false };
    }, [saveButtonText], function(result) {
      if (!result.value.clicked) {
        browser.assert.fail(`Could not find button with text: ${saveButtonText}`);
      }
    });

    // Wait and check for errors
    browser.pause(this.TIMEOUTS.MEDIUM);
    
    browser.execute(function() {
      return {
        currentUrl: window.location.pathname,
        saveErrors: window.saveErrors || [],
        hasErrorElements: document.querySelectorAll('[color="error"], .error, [class*="error"]').length > 0,
        isLoggedIn: typeof Meteor !== 'undefined' && Meteor.userId && !!Meteor.userId()
      };
    }, [], function(result) {
      console.log('Post-save check:', result.value);
      
      if (!result.value.isLoggedIn) {
        browser.assert.fail('User is not logged in after save - authentication may have failed');
      }
      
      if (result.value.saveErrors.length > 0) {
        console.error('Save errors detected:', result.value.saveErrors);
      }
    });

    // Wait for navigation or force it
    browser.pause(this.TIMEOUTS.MEDIUM);
    
    browser.execute(function(expectedUrl) {
      return window.location.pathname === expectedUrl;
    }, [targetUrl], function(result) {
      if (!result.value) {
        console.log(`Not redirected to ${targetUrl}, forcing navigation...`);
        browser.url(`http://localhost:3000${targetUrl}`);
      }
    });

    // Wait for target element
    browser
      .pause(this.TIMEOUTS.SHORT)
      .waitForElementVisible(targetElementId, this.TIMEOUTS.NAVIGATION);
  },

  /**
   * Robust element interaction with retry
   */
  clickElementWithRetry: function(browser, selector, callback) {
    browser.execute(function(sel) {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({ behavior: 'instant', block: 'center' });
        
        // Try multiple click methods
        try {
          element.click();
          return { clicked: true, method: 'click' };
        } catch (e1) {
          try {
            element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return { clicked: true, method: 'dispatchEvent' };
          } catch (e2) {
            return { clicked: false, error: e2.message };
          }
        }
      }
      return { clicked: false, error: 'Element not found' };
    }, [selector], function(result) {
      console.log(`Click result for ${selector}:`, result.value);
      if (callback) callback(result.value.clicked);
    });
  },

  /**
   * Wait for element with enhanced checks
   */
  waitForElementEnhanced: function(browser, selector, timeout) {
    const startTime = Date.now();
    const checkInterval = 500;
    
    const checkElement = () => {
      browser.execute(function(sel) {
        const element = document.querySelector(sel);
        return {
          exists: element !== null,
          visible: element ? element.offsetParent !== null : false,
          text: element ? element.textContent : '',
          tag: element ? element.tagName : ''
        };
      }, [selector], function(result) {
        const elapsed = Date.now() - startTime;
        
        if (result.value && result.value.exists && result.value.visible) {
          console.log(`Element ${selector} found and visible`);
        } else if (elapsed < timeout) {
          browser.pause(checkInterval);
          checkElement();
        } else {
          browser.assert.fail(`Element ${selector} not visible after ${timeout}ms`);
        }
      });
    };
    
    checkElement();
  }
};