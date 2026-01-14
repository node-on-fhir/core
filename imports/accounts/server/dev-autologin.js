// imports/accounts/server/dev-autologin.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { get } from 'lodash';

// Development-only auto-login functionality
export const DevAutoLogin = {
  async setupDevUser() {
    // Only run in development
    if (!Meteor.isDevelopment) return null;

    // Check if auto-login is enabled
    const devUsername = process.env.DEV_AUTO_USERNAME;
    const devPassword = process.env.DEV_AUTO_PASSWORD;
    // Accept common truthy values: 'true', '1', 'yes', 'on'
    const autoLoginEnabled = ['true', '1', 'yes', 'on'].includes(
      (process.env.DEV_AUTO_LOGIN || '').toLowerCase()
    );

    if (!autoLoginEnabled || !devUsername || !devPassword) {
      return null;
    }
    
    console.log('[DevAutoLogin] Setting up development auto-login user...');
    
    try {
      // Check if user exists
      let user = await Accounts.findUserByUsername(devUsername);
      
      if (!user) {
        // Create the dev user
        const userId = Accounts.createUser({
          username: devUsername,
          email: `${devUsername}@dev.local`,
          password: devPassword,
          profile: {
            name: 'Development User',
            isDevelopmentAccount: true
          }
        });
        
        user = await Meteor.users.findOneAsync(userId);
        console.log(`[DevAutoLogin] Created dev user: ${devUsername}`);
      } else {
        // Update password in case it changed
        try {
          // Use Meteor 3 async API for setPassword
          if (typeof Accounts.setPasswordAsync === 'function') {
            await Accounts.setPasswordAsync(user._id, devPassword);
            console.log(`[DevAutoLogin] Updated dev user password: ${devUsername}`);
          } else if (typeof Accounts.setPassword === 'function') {
            // Fallback to sync version if async not available
            Accounts.setPassword(user._id, devPassword);
            console.log(`[DevAutoLogin] Updated dev user password (sync): ${devUsername}`);
          } else {
            console.log(`[DevAutoLogin] setPassword not available, keeping existing password`);
          }
        } catch (setPasswordError) {
          console.error(`[DevAutoLogin] Error updating password:`, setPasswordError);
          // Just use existing user - re-fetch to ensure we have valid user object
          user = await Accounts.findUserByUsername(devUsername);
        }
      }
      
      // Ensure we have a valid user before proceeding
      if (!user || !user._id) {
        console.error('[DevAutoLogin] No valid user found');
        return null;
      }
      
      // Mark as development account and optionally link to patient
      const updateFields = {
        'profile.isDevelopmentAccount': true,
        'profile.autoLoginEnabled': true
      };

      // If DEV_AUTO_PATIENT_ID is set, link this user to that patient
      const devPatientId = process.env.DEV_AUTO_PATIENT_ID;
      if (devPatientId) {
        updateFields.patientId = devPatientId;
        console.log(`[DevAutoLogin] Linking dev user to patient: ${devPatientId}`);
      }

      console.log(`[DevAutoLogin] Updating user ${user._id} with fields:`, updateFields);
      const updateResult = await Meteor.users.updateAsync(user._id, {
        $set: updateFields
      });
      console.log(`[DevAutoLogin] Update affected ${updateResult} document(s)`);

      // Verify the update worked
      const updatedUser = await Meteor.users.findOneAsync(user._id);
      console.log(`[DevAutoLogin] Verified user after update - patientId:`, updatedUser.patientId);

      return user._id;
    } catch (error) {
      console.error('[DevAutoLogin] Error setting up dev user:', error);
      return null;
    }
  },
  
  async generateAutoLoginToken(userId) {
    // Only run in development
    if (!Meteor.isDevelopment) {
      throw new Meteor.Error('not-allowed', 'Auto-login only available in development');
    }
    
    // Check if user is a dev account
    const user = await Meteor.users.findOneAsync(userId);
    if (!user?.profile?.isDevelopmentAccount) {
      throw new Meteor.Error('not-allowed', 'User is not a development account');
    }
    
    // Generate a login token
    const stampedLoginToken = Accounts._generateStampedLoginToken();
    const hashedToken = Accounts._hashLoginToken(stampedLoginToken.token);
    
    // Add the token to the user's login tokens
    await Meteor.users.updateAsync(userId, {
      $push: {
        'services.resume.loginTokens': {
          hashedToken,
          when: stampedLoginToken.when
        }
      }
    });
    
    console.log('[DevAutoLogin] Generated auto-login token for user:', user.username);
    
    // Return the unhashed token (this is what the client will use)
    return {
      userId,
      token: stampedLoginToken.token,
      tokenExpires: Accounts._tokenExpiration(stampedLoginToken.when)
    };
  }
};

// Initialize on startup
Meteor.startup(async () => {
  // Accept common truthy values: 'true', '1', 'yes', 'on'
  const autoLoginEnabled = ['true', '1', 'yes', 'on'].includes(
    (process.env.DEV_AUTO_LOGIN || '').toLowerCase()
  );

  if (Meteor.isDevelopment && autoLoginEnabled) {
    // Give accounts-password package time to initialize
    Meteor.setTimeout(async () => {
      const userId = await DevAutoLogin.setupDevUser();
      if (userId) {
        console.log('[DevAutoLogin] Development auto-login user ready');

        // Add visual warning to console
        console.warn('┌─────────────────────────────────────────────────┐');
        console.warn('│ ⚠️  DEVELOPMENT AUTO-LOGIN ENABLED              │');
        console.warn('│ Username:', process.env.DEV_AUTO_USERNAME.padEnd(27), '│');
        if (process.env.DEV_AUTO_PATIENT_ID) {
          console.warn('│ Patient ID:', process.env.DEV_AUTO_PATIENT_ID.substring(0, 25).padEnd(25), '│');
        }
        console.warn('│ This should NEVER be enabled in production!    │');
        console.warn('└─────────────────────────────────────────────────┘');
      }
    }, 1000); // 1 second delay
  }
});

// Server methods for development auto-login
Meteor.methods({
  'dev.checkPatientExists': async function(patientId) {
    // Multiple safety checks
    if (Meteor.isProduction) {
      throw new Meteor.Error('not-allowed', 'Dev methods not available in production');
    }

    if (!patientId) {
      return null;
    }

    // Import Patients collection
    const { Patients } = await import('../../lib/schemas/SimpleSchemas/Patients');

    // Check if patient exists
    const patient = await Patients.findOneAsync({ _id: patientId });

    if (patient) {
      console.log(`[DevAutoLogin] Patient exists: ${patientId} - ${patient.name?.[0]?.text || 'Unknown'}`);
      return {
        exists: true,
        _id: patient._id,
        id: patient.id,
        name: patient.name?.[0]?.text || (patient.name?.[0]?.given?.[0] + ' ' + patient.name?.[0]?.family) || 'Unknown'
      };
    } else {
      console.log(`[DevAutoLogin] Patient not found: ${patientId}`);
      return { exists: false };
    }
  },

  'dev.getAutoLoginToken': async function() {
    // Multiple safety checks
    if (Meteor.isProduction) {
      throw new Meteor.Error('not-allowed', 'Auto-login not available in production');
    }

    // Accept common truthy values: 'true', '1', 'yes', 'on'
    const autoLoginEnabled = ['true', '1', 'yes', 'on'].includes(
      (process.env.DEV_AUTO_LOGIN || '').toLowerCase()
    );

    if (!autoLoginEnabled) {
      throw new Meteor.Error('not-configured', 'Auto-login is not enabled');
    }
    
    const devUsername = process.env.DEV_AUTO_USERNAME;
    if (!devUsername) {
      throw new Meteor.Error('not-configured', 'Dev username not configured');
    }
    
    // Find the dev user
    const user = await Accounts.findUserByUsername(devUsername);
    if (!user) {
      throw new Meteor.Error('user-not-found', 'Dev user not found');
    }
    
    // Generate and return login token
    const loginData = await DevAutoLogin.generateAutoLoginToken(user._id);
    
    // Log the auto-login for security monitoring
    console.log(`[DevAutoLogin] Auto-login token requested from ${this.connection.clientAddress}`);
    
    return loginData;
  }
});