// tests/nightwatch/honeycomb/shared-test-utils.js
// Shared utilities for test isolation and user management

module.exports = {
  // Ensure clean state - logout and clear users
  ensureCleanState: function(client, callback) {
    client.executeAsync(function(done) {
      if (typeof Meteor !== 'undefined') {
        // First logout if logged in
        if (Meteor.userId()) {
          console.log('Test cleanup: Logging out user');
          Meteor.logout(function() {
            // Then clear users
            console.log('Test cleanup: Clearing all test users');
            Meteor.call('test.clearUsers', function(err) {
              if (err) {
                console.error('Error clearing users:', err);
              }
              done();
            });
          });
        } else {
          // Just clear users
          console.log('Test cleanup: Clearing all test users (no user logged in)');
          Meteor.call('test.clearUsers', function(err) {
            if (err) {
              console.error('Error clearing users:', err);
            }
            done();
          });
        }
      } else {
        console.warn('Meteor not available for cleanup');
        done();
      }
    }, function() {
      if (callback) callback();
    });
  },

  // Logout current user
  logoutUser: function(client, callback) {
    client.executeAsync(function(done) {
      if (typeof Meteor !== 'undefined' && Meteor.userId()) {
        console.log('Logging out user:', Meteor.user()?.username);
        Meteor.logout(done);
      } else {
        done();
      }
    }, function() {
      if (callback) callback();
    });
  },

  // Create test user via Meteor method
  createTestUser: function(client, username, email, password, callback) {
    client.executeAsync(function(user, mail, pass, done) {
      if (typeof Meteor !== 'undefined') {
        console.log('Creating test user:', user);
        Meteor.call('test.createTestUser', {
          username: user,
          email: mail,
          password: pass
        }, function(error, result) {
          if (error) {
            console.error('Error creating test user:', error);
          }
          done({ error: error, result: result });
        });
      } else {
        done({ error: 'Meteor not available' });
      }
    }, [username, email, password], function(result) {
      console.log('Create test user result:', result.value);
      if (callback) callback(result.value);
    });
  },

  // Generate unique test credentials
  generateTestCredentials: function(prefix = 'testuser') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return {
      username: `${prefix}_${timestamp}_${random}`,
      email: `${prefix}_${timestamp}_${random}@test.com`,
      password: 'TestPassword123!'
    };
  },

  // Create test patient via Meteor method
  createTestPatient: function(client, patientData, callback) {
    client.executeAsync(function(data, done) {
      if (typeof Meteor !== 'undefined') {
        console.log('Creating test patient:', data.name);
        console.log('Current user ID:', Meteor.userId());
        console.log('Current user:', Meteor.user());

        // Set up subscription (but don't wait for it to be ready)
        const autoSubscribeEnabled = Meteor.settings?.public?.defaults?.autopublish || false;
        const subscriptionName = autoSubscribeEnabled ? 'autopublish.Patients' : 'patients.all';

        console.log('Setting up Patients subscription:', subscriptionName);
        console.log('Autopublish enabled:', autoSubscribeEnabled);

        Meteor.subscribe(subscriptionName, {}, { limit: 100 });

        // Create patient immediately - don't wait for subscription
        const patient = {
          resourceType: 'Patient',
          active: true,
          name: [{
            use: 'official',
            text: data.name || 'Test Patient',
            family: data.family || 'Patient',
            given: [data.given || 'Test']
          }],
          gender: data.gender || 'unknown',
          birthDate: data.birthDate || '1990-01-01'
        };

        // Add identifier if provided
        if (data.identifier) {
          patient.identifier = [{
            use: 'usual',
            value: data.identifier
          }];
        }

        console.log('Calling patients.insert with data:', JSON.stringify(patient, null, 2));

        Meteor.call('patients.insert', patient, function(error, result) {
          if (error) {
            console.error('Error creating test patient:', error);
            console.error('Error details:', error.message, error.reason, error.details);
            done({ error: error.message || error.reason || error, result: null });
          } else {
            console.log('Test patient created successfully with ID:', result);
            // Don't verify - subscription may be limited and won't include new patient immediately
            // The patient exists server-side, which is what matters for the test
            done({ error: null, result: result });
          }
        });
      } else {
        done({ error: 'Meteor not available' });
      }
    }, [patientData], function(result) {
      console.log('Create test patient result:', result.value);
      if (callback) callback(result.value);
    });
  },

  // Clear test patients
  clearTestPatients: function(client, callback) {
    client.executeAsync(function(done) {
      if (typeof Meteor !== 'undefined') {
        console.log('Test cleanup: Clearing test patients');
        Meteor.call('test.clearPatients', function(err) {
          if (err) {
            console.error('Error clearing patients:', err);
          }
          done();
        });
      } else {
        done();
      }
    }, function() {
      if (callback) callback();
    });
  },

  /**
   * Navigate to a URL using Meteor.navigate() to preserve Session state
   *
   * This is a drop-in replacement for browser.url() that uses React Router
   * navigation instead of full page reloads. This preserves Meteor Session
   * variables like selectedPatient, which is critical for maintaining test
   * context across navigation.
   *
   * Usage:
   *   // Instead of:
   *   browser.url('http://localhost:3000/patients')
   *
   *   // Use:
   *   testUtils.navigateUrl(browser, '/patients')
   *
   * @param {Object} client - Nightwatch browser client
   * @param {String} path - Path to navigate to (e.g., '/patients', '/allergy-intolerances')
   * @param {Function} callback - Optional callback when navigation completes
   */
  navigateUrl: function(client, path, callback) {
    client.execute(function(navigatePath) {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        console.log('[navigateUrl] Using Meteor.navigate() to:', navigatePath);
        Meteor.navigate(navigatePath);
        return { method: 'Meteor.navigate', path: navigatePath };
      } else {
        console.warn('[navigateUrl] Meteor.navigate not available, using window.location');
        window.location.href = navigatePath;
        return { method: 'window.location', path: navigatePath };
      }
    }, [path], function(result) {
      if (result && result.value) {
        console.log('[navigateUrl] Navigation method:', result.value.method);
      }
      if (callback) callback(result);
    });

    return client; // Allow chaining
  }
};