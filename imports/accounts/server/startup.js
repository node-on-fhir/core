// imports/accounts/server/startup.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
// Using Meteor's built-in accounts-base package
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import crypto from 'crypto';
import './email-config'; // Configure MAIL_URL before accounts initialization
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

    // Migrate legacy speakeasy 2FA data to accounts-2fa format
    await migrateLegacy2faData();

    console.log('Accounts server module started successfully');
  } catch (error) {
    console.error('Failed to start accounts server module:', error);
  }
});

// Migrate legacy speakeasy 2FA data to accounts-2fa format
async function migrateLegacy2faData() {
  const usersWithLegacy2fa = await Meteor.users.find({
    'services.twoFactor.enabled': true,
    'services.twoFactor.secret': { $exists: true }
  }).fetchAsync();

  if (usersWithLegacy2fa.length === 0) {
    return;
  }

  console.log('[2FA Migration] Found', usersWithLegacy2fa.length, 'users with legacy 2FA data');

  for (const user of usersWithLegacy2fa) {
    const legacySecret = get(user, 'services.twoFactor.secret');
    const alreadyMigrated = get(user, 'services.twoFactorAuthentication.secret');

    if (alreadyMigrated) {
      console.log('[2FA Migration] User', user._id, 'already migrated, skipping');
      continue;
    }

    await Meteor.users.updateAsync(user._id, {
      $set: {
        'services.twoFactorAuthentication.type': 'otp',
        'services.twoFactorAuthentication.secret': legacySecret
      }
    });

    console.log('[2FA Migration] Migrated user:', user._id);
  }

  console.log('[2FA Migration] Migration complete');
}

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
    'accounts.extendSession': async function() {
      if (!this.userId) {
        throw new Meteor.Error('not-authenticated', 'User not authenticated');
      }

      // Update last activity timestamp
      await Meteor.users.updateAsync(this.userId, {
        $set: { lastActivityAt: new Date() }
      });

      return true;
    },

    // Record user activity
    'accounts.recordActivity': async function() {
      if (!this.userId) return;

      // Throttled activity recording
      const user = await Meteor.users.findOneAsync(this.userId);
      const lastActivity = user?.lastActivityAt;
      
      if (!lastActivity || (new Date() - lastActivity) > 60000) { // 1 minute
        await Meteor.users.updateAsync(this.userId, {
          $set: { lastActivityAt: new Date() }
        });
      }
    },

    // Generate backup codes for 2FA
    'accounts.generateBackupCodes': async function() {
      if (!this.userId) {
        throw new Meteor.Error('not-authenticated', 'User not authenticated');
      }

      const codeCount = get(Meteor, 'settings.private.accounts.twoFactor.backupCodeCount', 10);
      const codes = [];
      const hashedCodes = [];

      for (let i = 0; i < codeCount; i++) {
        const code = Random.hexString(8);
        codes.push(code);
        const hash = crypto.createHash('sha256').update(code).digest('hex');
        hashedCodes.push(hash);
      }

      await Meteor.users.updateAsync(this.userId, {
        $set: {
          'services.twoFactorAuthentication.backupCodes': hashedCodes
        }
      });

      console.log('[accounts.generateBackupCodes] Generated', codeCount, 'backup codes for user:', this.userId);
      // Return plaintext codes (shown to user once only)
      return codes;
    },

    // Verify a backup code (internal helper)
    'accounts.verifyBackupCode': async function(code) {
      check(code, String);

      if (!this.userId) {
        throw new Meteor.Error('not-authenticated', 'User not authenticated');
      }

      const user = await Meteor.users.findOneAsync(this.userId);
      const storedCodes = get(user, 'services.twoFactorAuthentication.backupCodes', []);

      const hash = crypto.createHash('sha256').update(code).digest('hex');
      const codeIndex = storedCodes.indexOf(hash);

      if (codeIndex === -1) {
        throw new Meteor.Error('invalid-backup-code', 'Invalid backup code');
      }

      // Remove used code (single-use)
      storedCodes.splice(codeIndex, 1);
      await Meteor.users.updateAsync(this.userId, {
        $set: {
          'services.twoFactorAuthentication.backupCodes': storedCodes
        }
      });

      console.log('[accounts.verifyBackupCode] Backup code used. Remaining:', storedCodes.length);
      return { success: true, remaining: storedCodes.length };
    },

    // Use a backup code to bypass 2FA during login
    'accounts.useBackupCodeForLogin': async function(usernameOrEmail, password, backupCode) {
      check(usernameOrEmail, String);
      check(password, String);
      check(backupCode, String);

      // Find the user
      let user = await Accounts.findUserByUsername(usernameOrEmail);
      if (!user) {
        user = await Accounts.findUserByEmail(usernameOrEmail);
      }
      if (!user) {
        throw new Meteor.Error('user-not-found', 'User not found');
      }

      // Verify the backup code
      const storedCodes = get(user, 'services.twoFactorAuthentication.backupCodes', []);
      const hash = crypto.createHash('sha256').update(backupCode).digest('hex');
      const codeIndex = storedCodes.indexOf(hash);

      if (codeIndex === -1) {
        throw new Meteor.Error('invalid-backup-code', 'Invalid backup code');
      }

      // Remove used code (single-use)
      storedCodes.splice(codeIndex, 1);

      // Temporarily disable 2FA so the next login attempt succeeds, then re-enable it
      const originalSecret = get(user, 'services.twoFactorAuthentication.secret');
      const originalType = get(user, 'services.twoFactorAuthentication.type');

      await Meteor.users.updateAsync(user._id, {
        $set: {
          'services.twoFactorAuthentication.backupCodes': storedCodes
        },
        $unset: {
          'services.twoFactorAuthentication.secret': 1,
          'services.twoFactorAuthentication.type': 1
        }
      });

      // Re-enable 2FA immediately after clearing
      // The caller will call Meteor.loginWithPassword() right after this
      // We use Meteor.defer to restore 2FA after the login completes
      Meteor.defer(async function() {
        await Meteor.users.updateAsync(user._id, {
          $set: {
            'services.twoFactorAuthentication.secret': originalSecret,
            'services.twoFactorAuthentication.type': originalType
          }
        });
      });

      console.log('[accounts.useBackupCodeForLogin] Backup code used for user:', user._id, 'Remaining:', storedCodes.length);
      return { success: true, remaining: storedCodes.length };
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
    'accounts.updateProfile': async function(profileData) {
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
      await Meteor.users.updateAsync(this.userId, {
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
    'accounts.generateAPIKey': async function(name, permissions) {
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
      await Meteor.users.updateAsync(this.userId, {
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
        'services.twoFactor.enabled': 1,
        'services.twoFactorAuthentication.type': 1
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