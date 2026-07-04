// certification/tdd/helpers/authentication-helper.js
// Authentication helper functions for ONC certification tests

/**
 * Logs in as a provider/clinician user
 * @param {Object} browser - Nightwatch browser object
 * @param {Object} options - Login options
 * @param {string} options.username - Username (default: 'provider')
 * @param {string} options.email - Email (default: 'provider@test.org')
 * @param {string} options.password - Password (default: 'provider123')
 * @param {Array<string>} options.roles - User roles (default: ['Provider', 'Practitioner'])
 */
function loginAsProvider(browser, options = {}) {
  const username = options.username || 'provider';
  const email = options.email || 'provider@test.org';
  const password = options.password || 'provider123';
  const roles = options.roles || ['Provider', 'Practitioner'];

  browser.execute(function() {
    return {
      isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
      userId: Meteor.userId ? Meteor.userId() : null
    };
  }, [], function(result) {
    if (!result.value.isLoggedIn) {
      browser.executeAsync(function(userData, done) {
        // NOTE: test.createTestUser's check() pattern is exactly
        // {username, email, password} — a roles key throws Match failed.
        Meteor.call('test.createTestUser', {
          username: userData.username,
          email: userData.email,
          password: userData.password
        }, function(err, userId) {
          if (!err) {
            Meteor.loginWithPassword(userData.username, userData.password, function(loginErr) {
              done({
                loginSuccess: !loginErr,
                userId: Meteor.userId(),
                error: loginErr
              });
            });
          } else {
            done({ loginSuccess: false, error: err });
          }
        });
      }, [{ username, email, password, roles }], function(loginResult) {
        if (loginResult.value.loginSuccess) {
          console.log(`✅ Logged in as provider: ${username} (${email})`);
        } else {
          console.error('❌ Provider login failed:', loginResult.value.error);
        }
      });
    } else {
      console.log('✅ Already logged in');
    }
  });

  return browser;
}

/**
 * Logs in as a patient user
 * @param {Object} browser - Nightwatch browser object
 * @param {Object} options - Login options
 * @param {string} options.username - Username (default: 'testpatient')
 * @param {string} options.email - Email (default: 'patient@test.org')
 * @param {string} options.password - Password (default: 'patient123')
 */
function loginAsPatient(browser, options = {}) {
  const username = options.username || 'testpatient';
  const email = options.email || 'patient@test.org';
  const password = options.password || 'patient123';

  browser.execute(function() {
    return {
      isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
      userId: Meteor.userId ? Meteor.userId() : null
    };
  }, [], function(result) {
    if (!result.value.isLoggedIn) {
      browser.executeAsync(function(userData, done) {
        Meteor.call('test.createTestPatient', {
          username: userData.username,
          email: userData.email,
          password: userData.password
        }, function(err, userId) {
          if (!err) {
            Meteor.loginWithPassword(userData.username, userData.password, function(loginErr) {
              done({
                loginSuccess: !loginErr,
                userId: Meteor.userId(),
                error: loginErr
              });
            });
          } else {
            done({ loginSuccess: false, error: err });
          }
        });
      }, [{ username, email, password }], function(loginResult) {
        if (loginResult.value.loginSuccess) {
          console.log(`✅ Logged in as patient: ${username} (${email})`);
        } else {
          console.error('❌ Patient login failed:', loginResult.value.error);
        }
      });
    } else {
      console.log('✅ Already logged in');
    }
  });

  return browser;
}

/**
 * Logs in as an admin/system administrator
 * @param {Object} browser - Nightwatch browser object
 * @param {Object} options - Login options
 */
function loginAsAdmin(browser, options = {}) {
  const username = options.username || 'admin';
  const email = options.email || 'admin@test.org';
  const password = options.password || 'admin123';
  const roles = options.roles || ['Administrator', 'System Administrator'];

  return loginAsProvider(browser, { username, email, password, roles });
}

/**
 * Logs out current user
 * @param {Object} browser - Nightwatch browser object
 */
function logout(browser) {
  browser.execute(function() {
    if (typeof Meteor !== 'undefined' && Meteor.userId()) {
      Meteor.logout();
      return { loggedOut: true };
    }
    return { loggedOut: false, message: 'No user logged in' };
  }, [], function(result) {
    if (result.value.loggedOut) {
      console.log('✅ Logged out successfully');
    } else {
      console.log('ℹ️ No user to log out');
    }
  });

  return browser;
}

/**
 * Checks if user is logged in
 * @param {Object} browser - Nightwatch browser object
 * @param {Function} callback - Callback with result
 */
function checkLoginStatus(browser, callback) {
  browser.execute(function() {
    return {
      isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
      userId: Meteor.userId ? Meteor.userId() : null,
      userEmail: Meteor.user ? Meteor.user().emails?.[0]?.address : null
    };
  }, [], callback);

  return browser;
}

/**
 * Ensures user is logged in as provider (logs in if needed)
 * @param {Object} browser - Nightwatch browser object
 * @param {Object} options - Login options
 */
function ensureProviderLogin(browser, options = {}) {
  checkLoginStatus(browser, function(result) {
    if (!result.value.isLoggedIn) {
      loginAsProvider(browser, options);
    } else {
      console.log('✅ Already authenticated');
    }
  });

  return browser;
}

/**
 * Ensures user is logged in as patient (logs in if needed)
 * @param {Object} browser - Nightwatch browser object
 * @param {Object} options - Login options
 */
function ensurePatientLogin(browser, options = {}) {
  checkLoginStatus(browser, function(result) {
    if (!result.value.isLoggedIn) {
      loginAsPatient(browser, options);
    } else {
      console.log('✅ Already authenticated');
    }
  });

  return browser;
}

// Export default object for CommonJS compatibility
module.exports = {
  loginAsProvider,
  loginAsPatient,
  loginAsAdmin,
  logout,
  checkLoginStatus,
  ensureProviderLogin,
  ensurePatientLogin
};
