// packages/multi-factor-auth/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, set } from 'lodash';
import bcrypt from 'bcrypt';

import { MFACore, DefaultMFAPolicies } from '../lib/MFACore';

let Users;
let MFAAuditLogs;

Meteor.startup(async function(){
  // Access global collections
  Users = Meteor.users;
  
  // Create MFA audit logs collection
  MFAAuditLogs = new Mongo.Collection('mfa_audit_logs');
  
  // Create indexes for audit logs
  if (MFAAuditLogs._ensureIndex) {
    MFAAuditLogs._ensureIndex({ userId: 1, timestamp: -1 });
    MFAAuditLogs._ensureIndex({ timestamp: -1 });
  }
});

// Audit logging function
async function logMFAEvent(userId, event, status, ipAddress, details = {}) {
  if (MFAAuditLogs) {
    await MFAAuditLogs.insertAsync({
      userId: userId,
      event: event,
      status: status,
      ipAddress: ipAddress,
      details: details,
      timestamp: new Date()
    });
  }
  
  console.log(`MFA Event: ${event} - ${status} - User: ${userId} - IP: ${ipAddress}`);
}

Meteor.methods({
  'mfa.setupTOTP': async function(args) {
    check(args, {
      secret: String,
      verificationCode: String,
      backupCodes: [String]
    });

    // Check authentication
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to setup MFA');
    }

    const { secret, verificationCode, backupCodes } = args;
    const ipAddress = this.connection?.clientAddress || 'unknown';

    try {
      // Verify the TOTP code
      const isValid = MFACore.verifyToken(secret, verificationCode);
      
      if (!isValid) {
        await logMFAEvent(this.userId, 'TOTP Setup Failed', 'failed', ipAddress, { 
          reason: 'Invalid verification code' 
        });
        throw new Meteor.Error('invalid-code', 'Invalid verification code');
      }

      // Hash backup codes for storage
      const hashedBackupCodes = backupCodes.map(code => ({
        hash: MFACore.hashBackupCode(code),
        used: false,
        createdAt: new Date()
      }));

      // Update user with MFA configuration
      const mfaConfig = {
        totp: {
          enabled: true,
          secret: secret, // In production, encrypt this
          setupDate: new Date()
        },
        backup: {
          enabled: true,
          codes: hashedBackupCodes,
          codesRemaining: backupCodes.length
        },
        lastSetup: new Date(),
        isRequired: MFACore.requiresMFA(await Users.findOneAsync(this.userId), DefaultMFAPolicies.roleBasedStandard)
      };

      await Users.updateAsync(this.userId, {
        $set: { mfa: mfaConfig }
      });

      await logMFAEvent(this.userId, 'TOTP Setup Completed', 'success', ipAddress);

      return { 
        success: true,
        message: 'MFA setup completed successfully'
      };

    } catch (error) {
      await logMFAEvent(this.userId, 'TOTP Setup Failed', 'failed', ipAddress, { 
        error: error.message 
      });
      
      if (error instanceof Meteor.Error) {
        throw error;
      }
      
      console.error('Error setting up MFA:', error);
      throw new Meteor.Error('setup-failed', 'Failed to setup MFA');
    }
  },

  'mfa.verifyTOTP': async function(args) {
    check(args, {
      code: String,
      rememberDevice: Match.Maybe(Boolean)
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to verify MFA');
    }

    const { code, rememberDevice = false } = args;
    const ipAddress = this.connection?.clientAddress || 'unknown';

    try {
      const user = await Users.findOneAsync(this.userId);
      const secret = get(user, 'mfa.totp.secret');
      
      if (!secret) {
        throw new Meteor.Error('mfa-not-configured', 'MFA not configured for this user');
      }

      // Verify TOTP code
      const isValid = MFACore.verifyToken(secret, code);
      
      if (isValid) {
        // Update last used timestamp
        await Users.updateAsync(this.userId, {
          $set: { 'mfa.lastUsed': new Date() }
        });

        await logMFAEvent(this.userId, 'TOTP Verification', 'success', ipAddress);

        return { 
          success: true,
          verified: true
        };
      } else {
        await logMFAEvent(this.userId, 'TOTP Verification', 'failed', ipAddress, { 
          reason: 'Invalid code' 
        });
        
        return { 
          success: false,
          error: 'Invalid verification code'
        };
      }

    } catch (error) {
      await logMFAEvent(this.userId, 'TOTP Verification', 'failed', ipAddress, { 
        error: error.message 
      });
      throw error;
    }
  },

  'mfa.verifyBackupCode': async function(args) {
    check(args, {
      code: String
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to verify backup code');
    }

    const { code } = args;
    const ipAddress = this.connection?.clientAddress || 'unknown';

    try {
      const user = await Users.findOneAsync(this.userId);
      const backupCodes = get(user, 'mfa.backup.codes', []);
      
      // Find matching unused backup code
      const hashedCode = MFACore.hashBackupCode(code);
      const matchingCodeIndex = backupCodes.findIndex(bc => 
        bc.hash === hashedCode && !bc.used
      );

      if (matchingCodeIndex >= 0) {
        // Mark code as used
        const updatePath = `mfa.backup.codes.${matchingCodeIndex}.used`;
        await Users.updateAsync(this.userId, {
          $set: {
            [updatePath]: true,
            'mfa.lastUsed': new Date()
          },
          $inc: { 'mfa.backup.codesRemaining': -1 }
        });

        await logMFAEvent(this.userId, 'Backup Code Used', 'success', ipAddress);

        return { 
          success: true,
          verified: true,
          codesRemaining: get(user, 'mfa.backup.codesRemaining', 0) - 1
        };
      } else {
        await logMFAEvent(this.userId, 'Backup Code Verification', 'failed', ipAddress, { 
          reason: 'Invalid or used code' 
        });
        
        return { 
          success: false,
          error: 'Invalid or already used backup code'
        };
      }

    } catch (error) {
      await logMFAEvent(this.userId, 'Backup Code Verification', 'failed', ipAddress, { 
        error: error.message 
      });
      throw error;
    }
  },

  'mfa.generateNewBackupCodes': async function() {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to generate backup codes');
    }

    const ipAddress = this.connection?.clientAddress || 'unknown';

    try {
      const user = await Users.findOneAsync(this.userId);
      
      if (!get(user, 'mfa.totp.enabled')) {
        throw new Meteor.Error('mfa-not-enabled', 'MFA must be enabled to generate backup codes');
      }

      // Generate new backup codes
      const newCodes = MFACore.generateBackupCodes(8);
      const hashedBackupCodes = newCodes.map(code => ({
        hash: MFACore.hashBackupCode(code),
        used: false,
        createdAt: new Date()
      }));

      // Update user with new backup codes
      await Users.updateAsync(this.userId, {
        $set: {
          'mfa.backup.codes': hashedBackupCodes,
          'mfa.backup.codesRemaining': newCodes.length,
          'mfa.backup.enabled': true
        }
      });

      await logMFAEvent(this.userId, 'Backup Codes Regenerated', 'success', ipAddress);

      return { 
        success: true,
        codes: newCodes
      };

    } catch (error) {
      await logMFAEvent(this.userId, 'Backup Code Generation', 'failed', ipAddress, { 
        error: error.message 
      });
      throw error;
    }
  },

  'mfa.disable': async function(args) {
    check(args, {
      confirmationCode: String
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to disable MFA');
    }

    const { confirmationCode } = args;
    const ipAddress = this.connection?.clientAddress || 'unknown';

    try {
      const user = await Users.findOneAsync(this.userId);
      
      // Check if MFA is required for this user
      if (MFACore.requiresMFA(user, DefaultMFAPolicies.roleBasedStandard)) {
        await logMFAEvent(this.userId, 'MFA Disable Attempt', 'failed', ipAddress, { 
          reason: 'MFA required for user role' 
        });
        throw new Meteor.Error('mfa-required', 'MFA cannot be disabled for your account role');
      }

      // Verify confirmation code
      const secret = get(user, 'mfa.totp.secret');
      if (!secret || !MFACore.verifyToken(secret, confirmationCode)) {
        await logMFAEvent(this.userId, 'MFA Disable Attempt', 'failed', ipAddress, { 
          reason: 'Invalid confirmation code' 
        });
        throw new Meteor.Error('invalid-code', 'Invalid confirmation code');
      }

      // Disable MFA
      await Users.updateAsync(this.userId, {
        $unset: { mfa: '' }
      });

      await logMFAEvent(this.userId, 'MFA Disabled', 'success', ipAddress);

      return { 
        success: true,
        message: 'MFA has been disabled'
      };

    } catch (error) {
      if (error instanceof Meteor.Error) {
        throw error;
      }
      
      await logMFAEvent(this.userId, 'MFA Disable Failed', 'failed', ipAddress, { 
        error: error.message 
      });
      throw new Meteor.Error('disable-failed', 'Failed to disable MFA');
    }
  },

  'mfa.getAuditLogs': async function(args = {}) {
    check(args, {
      limit: Match.Maybe(Number)
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to view audit logs');
    }

    const { limit = 10 } = args;

    try {
      if (!MFAAuditLogs) {
        return [];
      }

      const logs = await MFAAuditLogs.findAsync(
        { userId: this.userId },
        { 
          sort: { timestamp: -1 },
          limit: Math.min(limit, 50), // Max 50 records
          fields: {
            event: 1,
            status: 1,
            ipAddress: 1,
            timestamp: 1,
            'details.reason': 1
          }
        }
      ).fetchAsync();

      return logs;

    } catch (error) {
      console.error('Error fetching MFA audit logs:', error);
      throw new Meteor.Error('fetch-failed', 'Failed to fetch audit logs');
    }
  },

  'mfa.checkStatus': async function() {
    if (!this.userId) {
      return { configured: false, required: false };
    }

    try {
      const user = await Users.findOneAsync(this.userId);
      
      return {
        configured: get(user, 'mfa.totp.enabled', false),
        required: MFACore.requiresMFA(user, DefaultMFAPolicies.roleBasedStandard),
        backupCodesRemaining: get(user, 'mfa.backup.codesRemaining', 0),
        lastUsed: get(user, 'mfa.lastUsed')
      };

    } catch (error) {
      console.error('Error checking MFA status:', error);
      return { configured: false, required: false };
    }
  },

  'mfa.validateCompliance': async function() {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to validate compliance');
    }

    try {
      const user = await Users.findOneAsync(this.userId);
      const mfaConfig = {
        totpEnabled: get(user, 'mfa.totp.enabled', false),
        backupCodesEnabled: get(user, 'mfa.backup.enabled', false),
        enforcementPolicy: DefaultMFAPolicies.roleBasedStandard,
        sessionTimeout: 3600,
        auditLogging: true
      };

      const compliance = MFACore.validateONCCompliance(mfaConfig);
      
      return {
        ...compliance,
        userStatus: {
          mfaConfigured: mfaConfig.totpEnabled,
          mfaRequired: MFACore.requiresMFA(user, DefaultMFAPolicies.roleBasedStandard)
        }
      };

    } catch (error) {
      console.error('Error validating MFA compliance:', error);
      throw new Meteor.Error('validation-failed', 'Failed to validate compliance');
    }
  }
});