// /tests/nightwatch/helpers/login-helper.js

module.exports = {
  /**
   * Checks if user is logged in with robust error handling and retry logic
   * @param {Object} browser - Nightwatch browser object
   * @param {Function} callback - Callback function with login state
   */
  checkLoginState: function(browser, callback) {
    browser.execute(function() {
      try {
        return {
          meteorAvailable: typeof Meteor !== 'undefined',
          isLoggedIn: typeof Meteor !== 'undefined' && Meteor.userId && !!Meteor.userId(),
          userId: (typeof Meteor !== 'undefined' && Meteor.userId) ? Meteor.userId() : null,
          username: (typeof Meteor !== 'undefined' && Meteor.user && Meteor.user()) ? Meteor.user().username : null,
          error: null
        };
      } catch (e) {
        return {
          meteorAvailable: false,
          isLoggedIn: false,
          userId: null,
          username: null,
          error: e.message
        };
      }
    }, [], function(result) {
      console.log('Initial login state check:', result);
      
      // Handle null result with retry
      if (!result || !result.value) {
        console.error('Login state check returned null, retrying in 2s...');
        browser.pause(2000);
        
        browser.execute(function() {
          try {
            return {
              meteorAvailable: typeof Meteor !== 'undefined',
              isLoggedIn: typeof Meteor !== 'undefined' && Meteor.userId && !!Meteor.userId(),
              userId: (typeof Meteor !== 'undefined' && Meteor.userId) ? Meteor.userId() : null,
              username: (typeof Meteor !== 'undefined' && Meteor.user && Meteor.user()) ? Meteor.user().username : null,
              error: null
            };
          } catch (e) {
            return {
              meteorAvailable: false,
              isLoggedIn: false,
              userId: null,
              username: null,
              error: e.message
            };
          }
        }, [], function(retryResult) {
          if (!retryResult || !retryResult.value) {
            callback({
              meteorAvailable: false,
              isLoggedIn: false,
              error: 'Failed to check login state after retry'
            });
          } else {
            callback(retryResult.value);
          }
        });
      } else {
        callback(result.value);
      }
    });
  },

  /**
   * Performs login with test user
   * @param {Object} browser - Nightwatch browser object
   * @param {Function} callback - Callback function after login attempt
   */
  performLogin: function(browser, callback) {
    browser.executeAsync(function(done) {
      if (typeof Meteor !== 'undefined') {
        Meteor.call('test.createTestUser', {
          username: 'janedoe',
          email: 'janedoe@test.org',
          password: 'janedoe123'
        }, function(err, userId) {
          if (err) {
            console.error('Failed to create test user:', err);
            done({ userCreated: false, error: err.message });
          } else {
            console.log('Test user ready, userId:', userId);
            Meteor.loginWithPassword('janedoe', 'janedoe123', function(loginErr) {
              if (loginErr) {
                console.error('Login failed:', loginErr);
                done({ userCreated: true, loginSuccess: false, error: loginErr.message });
              } else {
                console.log('Login successful');
                done({ 
                  userCreated: true,
                  loginSuccess: true, 
                  userId: Meteor.userId(), 
                  username: Meteor.user() ? Meteor.user().username : null 
                });
              }
            });
          }
        });
      } else {
        done({ userCreated: false, loginSuccess: false, error: 'Meteor not available' });
      }
    }, [], function(result) {
      if (callback) {
        callback(result.value);
      }
    });
  },

  /**
   * Ensures user is logged in before proceeding
   * @param {Object} browser - Nightwatch browser object
   * @param {Function} callback - Callback function after ensuring login
   */
  ensureLoggedIn: function(browser, callback) {
    const self = this;
    let retryCount = 0;
    const maxRetries = 5;
    
    const attemptLogin = () => {
      // Check login state
      self.checkLoginState(browser, function(loginState) {
        console.log(`Login state check (attempt ${retryCount + 1}/${maxRetries}):`, loginState);
        
        if (!loginState.meteorAvailable) {
          retryCount++;
          if (retryCount < maxRetries) {
            // Wait for Meteor to be available
            console.log(`Meteor not available, waiting 3s before retry ${retryCount}/${maxRetries}...`);
            browser.pause(3000);
            attemptLogin(); // Retry
          } else {
            console.error('Meteor is not available after maximum retries');
            if (callback) callback(false);
          }
        } else if (!loginState.isLoggedIn) {
          // Try to login
          console.log('Not logged in, attempting login...');
          self.performLogin(browser, function(loginResult) {
            if (loginResult.loginSuccess) {
              console.log('Successfully logged in as:', loginResult.username);
              browser.pause(1000); // Give time for session to stabilize
              if (callback) callback(true);
            } else {
              console.error('Login failed:', loginResult.error);
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(`Login failed, retrying in 2s... (${retryCount}/${maxRetries})`);
                browser.pause(2000);
                attemptLogin(); // Retry
              } else {
                if (callback) callback(false);
              }
            }
          });
        } else {
          // Already logged in
          console.log('Already logged in as:', loginState.username, 'userId:', loginState.userId);
          if (callback) callback(true);
        }
      });
    };
    
    attemptLogin();
  }
};