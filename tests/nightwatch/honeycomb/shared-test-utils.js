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
  }
};