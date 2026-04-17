// /tests/nightwatch/helpers/save-navigation-helper.js

module.exports = {
  /**
   * Handles save button click and navigation with fallback
   *
   * @deprecated Use saveWithDiagnostics() instead for better error handling and diagnostics
   *
   * @param {Object} browser - Nightwatch browser object
   * @param {String} resourceType - The resource type (e.g., 'observations', 'conditions')
   * @param {String} pageSelectorId - The ID of the list page element (e.g., '#observationsPage')
   * @param {Function} callback - Optional callback after navigation
   */
  saveAndNavigate: function(browser, resourceType, pageSelectorId, callback) {
    const resourcePath = resourceType.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    
    // Click save button
    browser.execute(function() {
      window.beforeSaveUrl = window.location.pathname;
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save')) {
          console.log('Clicking save button:', button.textContent);
          button.click();
          return { clicked: true, buttonText: button.textContent };
        }
      }
      return { clicked: false };
    }, [], function(result) {
      if (!result.value.clicked) {
        browser.assert.fail('Could not find Save button');
      }
    });

    // Wait for potential navigation
    browser.pause(3000); // Give time for save and potential redirect

    // Check current state
    browser.execute(function() {
      return {
        currentUrl: window.location.pathname,
        beforeSaveUrl: window.beforeSaveUrl,
        hasListPage: document.querySelector(arguments[0]) !== null,
        hasDetailPage: document.querySelector('[id$="DetailPage"]') !== null,
        errors: Array.from(document.querySelectorAll('[color="error"], .error, [class*="error"]'))
          .map(el => el.textContent).filter(t => t),
        isLoggedIn: typeof Meteor !== 'undefined' && Meteor.userId && !!Meteor.userId()
      };
    }, [pageSelectorId], function(result) {
      console.log('Post-save state:', result.value);
      
      const state = result.value;
      
      // Check for errors
      if (state.errors && state.errors.length > 0) {
        browser.assert.fail(`Save failed with errors: ${state.errors.join(', ')}`);
        return;
      }
      
      // Check login state
      if (!state.isLoggedIn) {
        browser.assert.fail('User is not logged in after save');
        return;
      }
      
      // Check if we're still on the same page
      if (state.currentUrl === state.beforeSaveUrl && state.currentUrl.includes('/new')) {
        console.log('Still on new page after save - attempting client-side navigation');
        
        // Try client-side navigation first to preserve Session
        browser.execute(function(targetPath) {
          console.log('Attempting client-side navigation to:', targetPath);
          
          // Check if we have React Router's navigate function
          if (window.navigate && typeof window.navigate === 'function') {
            console.log('Using window.navigate');
            window.navigate(targetPath);
            return { method: 'navigate', success: true };
          }
          
          // Check for useNavigate hook stored globally (some apps do this)
          if (window.__navigate && typeof window.__navigate === 'function') {
            console.log('Using window.__navigate');
            window.__navigate(targetPath);
            return { method: '__navigate', success: true };
          }
          
          // Try React Router v6 history
          if (window.__reactRouterHistory && window.__reactRouterHistory.push) {
            console.log('Using React Router history.push');
            window.__reactRouterHistory.push(targetPath);
            return { method: 'history.push', success: true };
          }
          
          // Try HTML5 History API with popstate event
          if (window.history && window.history.pushState) {
            console.log('Using HTML5 History API');
            window.history.pushState({}, '', targetPath);
            window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
            
            // Give React Router time to respond
            setTimeout(() => {
              window.dispatchEvent(new Event('pushstate'));
            }, 100);
            
            return { method: 'pushState', success: true };
          }
          
          // No client-side navigation available
          return { method: 'none', success: false };
        }, [`/${resourcePath}`], function(result) {
          console.log('Client-side navigation result:', result.value);
          
          // If client-side navigation failed, fall back to Meteor.navigate() to preserve Session
          if (!result.value.success) {
            console.log('Client-side navigation not available, using Meteor.navigate fallback');
            browser.execute(function(path) {
              if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
                console.log('[saveAndNavigate] Using Meteor.navigate() to preserve Session');
                Meteor.navigate(path);
              } else {
                console.warn('[saveAndNavigate] Meteor.navigate not available, using window.location');
                window.location.href = path;
              }
            }, [`/${resourcePath}`]);
            browser.pause(1000);
          } else {
            // Give client-side navigation time to complete
            browser.pause(1000);
          }
        });
      }
    });

    // Wait for the list page to be visible
    browser
      .waitForElementVisible(pageSelectorId, 10000) // Increased timeout for CI
      .pause(500); // Small pause for stability

    // Verify Session was preserved (for debugging)
    browser.execute(function() {
      if (typeof Session !== 'undefined') {
        return {
          hasSession: true,
          selectedPatientId: Session.get('selectedPatientId'),
          selectedPatient: Session.get('selectedPatient') ? 'Present' : 'Missing'
        };
      }
      return { hasSession: false };
    }, [], function(result) {
      console.log('Session state after navigation:', result.value);
    });

    // Execute callback if provided
    if (callback) {
      callback();
    }
  },

  /**
   * Enhanced save with better diagnostics
   * @param {Object} browser - Nightwatch browser object
   * @param {Object} options - Configuration options
   */
  saveWithDiagnostics: function(browser, options) {
    const {
      resourceType,
      listPageId,
      listPagePath,
      expectedRedirect = true,
      saveButtonText = 'Save'
    } = options;

    // Capture pre-save state
    browser.execute(function() {
      window.preSaveState = {
        url: window.location.pathname,
        timestamp: Date.now(),
        formData: {}
      };
      
      // Capture form values for debugging
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.id && input.value) {
          window.preSaveState.formData[input.id] = input.value;
        }
      });
      
      console.log('Pre-save state captured:', window.preSaveState);
    });

    // Click save button
    browser.execute(function(buttonText) {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes(buttonText)) {
          // Check if button is disabled
          if (button.disabled) {
            return { clicked: false, reason: 'Button is disabled' };
          }
          
          console.log('Clicking button:', button.textContent);
          button.click();
          return { clicked: true };
        }
      }
      return { clicked: false, reason: 'Button not found' };
    }, [saveButtonText], function(result) {
      if (!result.value.clicked) {
        browser.assert.fail(`Could not click save button: ${result.value.reason}`);
      }
    });

    // Monitor for navigation or errors
    browser.pause(2000); // Initial wait

    // Check post-save state
    browser.execute(function(expectedListPageId) {
      const postSaveState = {
        url: window.location.pathname,
        timestamp: Date.now(),
        navigationOccurred: window.location.pathname !== window.preSaveState.url,
        hasListPage: document.querySelector(expectedListPageId) !== null,
        hasDetailPage: document.querySelector('[id$="DetailPage"]') !== null,
        isLoggedIn: typeof Meteor !== 'undefined' && Meteor.userId && !!Meteor.userId()
      };

      // Check for various error indicators
      const errorSelectors = [
        '.MuiAlert-standardError',       // MUI Alert severity="error"
        '.MuiAlert-filledError',         // MUI Alert variant="filled" severity="error"
        '.MuiAlert-outlinedError',       // MUI Alert variant="outlined" severity="error"
        '.snackbar-error'                // Snackbar errors
      ];
      
      postSaveState.errors = [];
      errorSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent.trim();
          if (text && !postSaveState.errors.includes(text)) {
            postSaveState.errors.push(text);
          }
        });
      });

      // Check console for Meteor method errors
      if (window.consoleErrors) {
        postSaveState.consoleErrors = window.consoleErrors;
      }

      // Calculate time taken
      postSaveState.saveTime = postSaveState.timestamp - window.preSaveState.timestamp;

      return postSaveState;
    }, [listPageId], function(result) {
      const state = result.value;
      console.log('Post-save diagnostics:', state);

      // Analyze the result
      if (state.errors.length > 0) {
        browser.assert.fail(`Save errors detected: ${state.errors.join(', ')}`);
        return;
      }

      if (!state.isLoggedIn) {
        browser.assert.fail('Lost authentication after save');
        return;
      }

      // If we expect redirect but it didn't happen
      if (expectedRedirect && !state.navigationOccurred) {
        console.log(`No navigation after ${state.saveTime}ms - forcing navigation to ${listPagePath}`);
        browser.execute(function(path) {
          if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
            console.log('[saveWithDiagnostics] Using Meteor.navigate() to preserve Session');
            Meteor.navigate(path);
          } else {
            console.warn('[saveWithDiagnostics] Meteor.navigate not available, using window.location');
            window.location.href = path;
          }
        }, [listPagePath]);
        browser.pause(1000);
      }
    });

    // Final wait for list page
    browser
      .waitForElementVisible(listPageId, 10000)
      .pause(500);
  }
};