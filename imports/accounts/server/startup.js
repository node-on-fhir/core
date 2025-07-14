// imports/accounts/server/startup.js

import { Meteor } from 'meteor/meteor';
// Using Meteor's built-in accounts-base package
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { AccountsServer } from './accounts-server';
import { OAuthIntegration } from './oauth-integration';
import { AuthMiddleware } from './middleware';
import './methods'; // Import account methods

// Import test methods in non-production environments
if (get(Meteor, 'settings.public.environment') !== 'production') {
  import('./test-methods');
}

// Import dev auto-login in development
if (Meteor.isDevelopment) {
  import('./dev-autologin');
}

Meteor.startup(async () => {
  // Check if accounts module is enabled
  const accountsEnabled = get(Meteor, 'settings.public.modules.accounts.enabled', true);
  
  if (!accountsEnabled) {
    console.log('Accounts module is disabled');
    return;
  }

  console.log('Starting accounts server module...');

  // Add a global error handler to catch any account creation errors
  if (Meteor.isDevelopment) {
    const originalCreateUser = Accounts.createUser;
    Accounts.createUser = function(options, callback) {
      console.log('[Accounts] Server-side createUser called with options:', {
        username: options.username,
        email: options.email,
        profile: options.profile
      });
      
      try {
        const result = originalCreateUser.call(this, options, callback);
        console.log('[Accounts] Server-side createUser result:', result);
        return result;
      } catch (error) {
        console.error('[Accounts] Server-side createUser error:', error);
        throw error;
      }
    };
  }

  try {
    // Initialize core accounts server
    await AccountsServer.initialize();

    // Initialize OAuth providers if any are configured
    const oauthProviders = get(Meteor, 'settings.private.oauth', {});
    if (Object.keys(oauthProviders).length > 0) {
      OAuthIntegration.initialize();
    }

    // Initialize authentication middleware
    AuthMiddleware.initialize();

    // Setup server methods
    setupAccountsMethods();

    // Setup publications
    setupAccountsPublications();

    // Check for first run
    await checkFirstRun();

    console.log('Accounts server module started successfully');
  } catch (error) {
    console.error('Failed to start accounts server module:', error);
  }
});

// Server methods for accounts
function setupAccountsMethods() {
  Meteor.methods({
    // Complete first run setup
    'accounts.completeFirstRunSetup': async function(setupData) {
      // Only allow if no users exist
      const userCount = await Meteor.users.find().countAsync();
      if (userCount > 0) {
        throw new Meteor.Error('setup-already-complete', 'Setup has already been completed');
      }

      // Create admin user
      const userId = Accounts.createUser({
        email: setupData.adminEmail,
        password: setupData.adminPassword,
        profile: {
          name: setupData.adminFullName
        }
      });

      // Assign admin role
      if (Package['alanning:roles']) {
        Roles.addUsersToRoles(userId, ['admin']);
      }

      // Save organization settings
      // In production, you'd save this to a settings collection
      console.log('First run setup completed:', {
        organization: setupData.organizationName,
        admin: setupData.adminEmail
      });

      return { success: true, userId };
    },

    // Extend user session
    'accounts.extendSession': function() {
      if (!this.userId) {
        throw new Meteor.Error('not-authenticated', 'User not authenticated');
      }

      // Update last activity timestamp
      Meteor.users.update(this.userId, {
        $set: { lastActivityAt: new Date() }
      });

      return true;
    },

    // Record user activity
    'accounts.recordActivity': function() {
      if (!this.userId) return;

      // Throttled activity recording
      const user = Meteor.users.findOne(this.userId);
      const lastActivity = user?.lastActivityAt;
      
      if (!lastActivity || (new Date() - lastActivity) > 60000) { // 1 minute
        Meteor.users.update(this.userId, {
          $set: { lastActivityAt: new Date() }
        });
      }
    },

    // Setup two-factor authentication
    'accounts.setupTwoFactor': async function(method = 'totp') {
      if (!this.userId) {
        throw new Meteor.Error('not-authenticated', 'User not authenticated');
      }

      // Generate 2FA secret
      if (method === 'totp') {
        const speakeasy = require('speakeasy');
        const secret = speakeasy.generateSecret({
          name: `${get(Meteor, 'settings.public.appName', 'Honeycomb')} (${Meteor.user().emails[0].address})`
        });

        // Save secret temporarily (not enabled yet)
        Meteor.users.update(this.userId, {
          $set: {
            'services.twoFactor.tempSecret': secret.base32,
            'services.twoFactor.method': method
          }
        });

        return {
          secret: secret.base32,
          qrCode: secret.otpauth_url
        };
      }

      throw new Meteor.Error('unsupported-method', `Two-factor method ${method} not supported`);
    },

    // Verify two-factor code
    'accounts.verifyTwoFactor': function(code, method = 'totp') {
      if (!this.userId) {
        throw new Meteor.Error('not-authenticated', 'User not authenticated');
      }

      const user = Meteor.users.findOne(this.userId);
      
      if (method === 'totp') {
        const speakeasy = require('speakeasy');
        const secret = user.services?.twoFactor?.tempSecret || user.services?.twoFactor?.secret;
        
        if (!secret) {
          throw new Meteor.Error('no-secret', 'Two-factor not set up');
        }

        const verified = speakeasy.totp.verify({
          secret: secret,
          encoding: 'base32',
          token: code,
          window: 2
        });

        if (verified) {
          // Enable 2FA
          Meteor.users.update(this.userId, {
            $set: {
              'services.twoFactor.enabled': true,
              'services.twoFactor.secret': secret,
              'services.twoFactor.enabledAt': new Date()
            },
            $unset: {
              'services.twoFactor.tempSecret': 1
            }
          });

          return { success: true };
        } else {
          throw new Meteor.Error('invalid-code', 'Invalid verification code');
        }
      }

      throw new Meteor.Error('unsupported-method', `Two-factor method ${method} not supported`);
    },

    // Removed - already defined in methods.js
    // 'accounts.sendVerificationEmail': function() { ... },

    // Verify email with token
    'accounts.verifyEmail': function(token) {
      try {
        Accounts.verifyEmail(token);
        return { success: true };
      } catch (error) {
        throw new Meteor.Error('invalid-token', 'Invalid or expired token');
      }
    },

    // Update user profile
    'accounts.updateProfile': function(profileData) {
      if (!this.userId) {
        throw new Meteor.Error('not-authenticated', 'User not authenticated');
      }

      // Validate profile data
      check(profileData, {
        name: Match.Optional(String),
        bio: Match.Optional(String),
        avatar: Match.Optional(String),
        preferences: Match.Optional(Object)
      });

      // Update profile
      Meteor.users.update(this.userId, {
        $set: {
          'profile.name': profileData.name,
          'profile.bio': profileData.bio,
          'profile.avatar': profileData.avatar,
          'profile.preferences': profileData.preferences,
          'profile.updatedAt': new Date()
        }
      });

      return true;
    },

    // Removed - already defined in methods.js
    // 'accounts.checkUsername': function(username) { ... },

    // Generate API key
    'accounts.generateAPIKey': function(name, permissions) {
      if (!this.userId) {
        throw new Meteor.Error('not-authenticated', 'User not authenticated');
      }

      // Check if user can generate API keys
      if (!Roles.userIsInRole(this.userId, ['admin', 'developer'])) {
        throw new Meteor.Error('not-authorized', 'Not authorized to generate API keys');
      }

      const apiKey = Random.secret();
      const keyData = {
        name,
        permissions,
        createdAt: new Date(),
        createdBy: this.userId
      };

      // Save API key (in production, use a separate collection)
      Meteor.users.update(this.userId, {
        $push: {
          'services.apiKeys': {
            key: apiKey,
            ...keyData
          }
        }
      });

      return { apiKey, ...keyData };
    }
  });
}

// Publications for accounts
function setupAccountsPublications() {
  // Current user with additional fields
  Meteor.publish('accounts.currentUser', function() {
    if (!this.userId) {
      return this.ready();
    }

    return Meteor.users.find(this.userId, {
      fields: {
        username: 1,
        emails: 1,
        profile: 1,
        roles: 1,
        status: 1,
        statusConnection: 1,
        lastActivityAt: 1,
        patientId: 1,
        practitionerId: 1,
        fullLegalName: 1,
        'services.google.picture': 1,
        'services.github.avatar_url': 1,
        'services.twoFactor.enabled': 1
      }
    });
  });

  // User directory (for admin)
  Meteor.publish('accounts.userDirectory', function(options = {}) {
    // Check if user is admin
    if (!this.userId || !Roles.userIsInRole(this.userId, ['admin'])) {
      return this.ready();
    }

    const { search, limit = 20, skip = 0 } = options;
    const query = {};

    if (search) {
      query.$or = [
        { 'emails.address': { $regex: search, $options: 'i' } },
        { 'profile.name': { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    return Meteor.users.find(query, {
      fields: {
        username: 1,
        emails: 1,
        profile: 1,
        roles: 1,
        status: 1,
        createdAt: 1,
        lastLoginAt: 1
      },
      limit,
      skip,
      sort: { createdAt: -1 }
    });
  });

  // Online users
  Meteor.publish('accounts.onlineUsers', function() {
    if (!this.userId) {
      return this.ready();
    }

    return Meteor.users.find(
      { 'status.online': true },
      {
        fields: {
          username: 1,
          'profile.name': 1,
          'profile.avatar': 1,
          status: 1
        }
      }
    );
  });
}

// Check if this is the first run
async function checkFirstRun() {
  const userCount = await Meteor.users.find().countAsync();
  
  if (userCount === 0) {
    console.log('First run detected - no users in database');
    
    // Set first run flag
    if (!get(Meteor, 'settings.public.firstRun')) {
      Meteor.settings.public = Meteor.settings.public || {};
      Meteor.settings.public.firstRun = true;
    }
  }
}