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

// -----------------------------------------------------------------------------
// ServerMethods registry (rpc-migration). AUTH-SENSITIVE package (ONC d(13) MFA).
// These are post-login self-service MFA methods: they operate on the caller's
// own userId, verify TOTP / backup codes, and enroll/disable MFA credentials.
// None call this.setUserId and none mint session tokens, so they are NOT skipped
// — but the credential-verifying/enrolling members (setupTOTP, verifyTOTP,
// verifyBackupCode, generateNewBackupCodes, disable) are FLAGGED for a dedicated
// security review (see .claude/ralph/jsonrpc-skipped.md). Auth guards deleted ->
// requireAuth defaults to true. this.userId -> context.userId; this.connection
// -> context.connection (IP address preserved).

Meteor.ServerMethods.define('mfa.setupTOTP', {
  description: 'Verify a TOTP code and enroll TOTP + backup codes for the caller',
  positionalParams: ['args'],
  schemaObject: {
    type: 'object',
    properties: {
      args: {
        type: 'object',
        properties: {
          secret: { type: 'string' },
          verificationCode: { type: 'string' },
          backupCodes: { type: 'array', items: { type: 'string' } }
        },
        required: ['secret', 'verificationCode', 'backupCodes']
      }
    },
    required: ['args']
  }
}, async function(params, context) {
    const args = params.args;

    const { secret, verificationCode, backupCodes } = args;
    const ipAddress = context.ip || context.connection?.clientAddress || 'unknown';

    try {
      // Verify the TOTP code
      const isValid = MFACore.verifyToken(secret, verificationCode);
      
      if (!isValid) {
        await logMFAEvent(context.userId, 'TOTP Setup Failed', 'failed', ipAddress, {
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
        isRequired: MFACore.requiresMFA(await Users.findOneAsync(context.userId), DefaultMFAPolicies.roleBasedStandard)
      };

      await Users.updateAsync(context.userId, {
        $set: { mfa: mfaConfig }
      });

      await logMFAEvent(context.userId, 'TOTP Setup Completed', 'success', ipAddress);

      return {
        success: true,
        message: 'MFA setup completed successfully'
      };

    } catch (error) {
      await logMFAEvent(context.userId, 'TOTP Setup Failed', 'failed', ipAddress, {
        error: error.message
      });

      if (error instanceof Meteor.Error) {
        throw error;
      }

      console.error('Error setting up MFA:', error);
      throw new Meteor.Error('setup-failed', 'Failed to setup MFA');
    }
});

// FLAGGED for security review — credential verification (MFA gate)
Meteor.ServerMethods.define('mfa.verifyTOTP', {
  description: 'Verify a TOTP code for the authenticated caller',
  positionalParams: ['args'],
  schemaObject: {
    type: 'object',
    properties: {
      args: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          rememberDevice: { type: 'boolean' }
        },
        required: ['code']
      }
    },
    required: ['args']
  }
}, async function(params, context) {
    const args = params.args;

    const { code, rememberDevice = false } = args;
    const ipAddress = context.ip || context.connection?.clientAddress || 'unknown';

    try {
      const user = await Users.findOneAsync(context.userId);
      const secret = get(user, 'mfa.totp.secret');

      if (!secret) {
        throw new Meteor.Error('mfa-not-configured', 'MFA not configured for this user');
      }

      // Verify TOTP code
      const isValid = MFACore.verifyToken(secret, code);

      if (isValid) {
        // Update last used timestamp
        await Users.updateAsync(context.userId, {
          $set: { 'mfa.lastUsed': new Date() }
        });

        await logMFAEvent(context.userId, 'TOTP Verification', 'success', ipAddress);

        return {
          success: true,
          verified: true
        };
      } else {
        await logMFAEvent(context.userId, 'TOTP Verification', 'failed', ipAddress, {
          reason: 'Invalid code'
        });

        return {
          success: false,
          error: 'Invalid verification code'
        };
      }

    } catch (error) {
      await logMFAEvent(context.userId, 'TOTP Verification', 'failed', ipAddress, {
        error: error.message
      });
      throw error;
    }
});

// FLAGGED for security review — backup-code credential verification
Meteor.ServerMethods.define('mfa.verifyBackupCode', {
  description: 'Verify and consume a one-time MFA backup code for the caller',
  positionalParams: ['args'],
  schemaObject: {
    type: 'object',
    properties: {
      args: {
        type: 'object',
        properties: { code: { type: 'string' } },
        required: ['code']
      }
    },
    required: ['args']
  }
}, async function(params, context) {
    const args = params.args;

    const { code } = args;
    const ipAddress = context.ip || context.connection?.clientAddress || 'unknown';

    try {
      const user = await Users.findOneAsync(context.userId);
      const backupCodes = get(user, 'mfa.backup.codes', []);
      
      // Find matching unused backup code
      const hashedCode = MFACore.hashBackupCode(code);
      const matchingCodeIndex = backupCodes.findIndex(bc => 
        bc.hash === hashedCode && !bc.used
      );

      if (matchingCodeIndex >= 0) {
        // Mark code as used
        const updatePath = `mfa.backup.codes.${matchingCodeIndex}.used`;
        await Users.updateAsync(context.userId, {
          $set: {
            [updatePath]: true,
            'mfa.lastUsed': new Date()
          },
          $inc: { 'mfa.backup.codesRemaining': -1 }
        });

        await logMFAEvent(context.userId, 'Backup Code Used', 'success', ipAddress);

        return {
          success: true,
          verified: true,
          codesRemaining: get(user, 'mfa.backup.codesRemaining', 0) - 1
        };
      } else {
        await logMFAEvent(context.userId, 'Backup Code Verification', 'failed', ipAddress, {
          reason: 'Invalid or used code'
        });

        return {
          success: false,
          error: 'Invalid or already used backup code'
        };
      }

    } catch (error) {
      await logMFAEvent(context.userId, 'Backup Code Verification', 'failed', ipAddress, {
        error: error.message
      });
      throw error;
    }
});

// FLAGGED for security review — regenerates MFA backup-code credentials
Meteor.ServerMethods.define('mfa.generateNewBackupCodes', {
  description: 'Regenerate and store a fresh set of MFA backup codes for the caller'
}, async function(params, context) {
    const ipAddress = context.ip || context.connection?.clientAddress || 'unknown';

    try {
      const user = await Users.findOneAsync(context.userId);
      
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
      await Users.updateAsync(context.userId, {
        $set: {
          'mfa.backup.codes': hashedBackupCodes,
          'mfa.backup.codesRemaining': newCodes.length,
          'mfa.backup.enabled': true
        }
      });

      await logMFAEvent(context.userId, 'Backup Codes Regenerated', 'success', ipAddress);

      return {
        success: true,
        codes: newCodes
      };

    } catch (error) {
      await logMFAEvent(context.userId, 'Backup Code Generation', 'failed', ipAddress, {
        error: error.message
      });
      throw error;
    }
});

// FLAGGED for security review — disables an MFA credential (gated on TOTP confirm)
Meteor.ServerMethods.define('mfa.disable', {
  description: 'Disable MFA for the caller after confirmation-code verification',
  positionalParams: ['args'],
  schemaObject: {
    type: 'object',
    properties: {
      args: {
        type: 'object',
        properties: { confirmationCode: { type: 'string' } },
        required: ['confirmationCode']
      }
    },
    required: ['args']
  }
}, async function(params, context) {
    const args = params.args;

    const { confirmationCode } = args;
    const ipAddress = context.ip || context.connection?.clientAddress || 'unknown';

    try {
      const user = await Users.findOneAsync(context.userId);

      // Check if MFA is required for this user
      if (MFACore.requiresMFA(user, DefaultMFAPolicies.roleBasedStandard)) {
        await logMFAEvent(context.userId, 'MFA Disable Attempt', 'failed', ipAddress, {
          reason: 'MFA required for user role'
        });
        throw new Meteor.Error('mfa-required', 'MFA cannot be disabled for your account role');
      }

      // Verify confirmation code
      const secret = get(user, 'mfa.totp.secret');
      if (!secret || !MFACore.verifyToken(secret, confirmationCode)) {
        await logMFAEvent(context.userId, 'MFA Disable Attempt', 'failed', ipAddress, {
          reason: 'Invalid confirmation code'
        });
        throw new Meteor.Error('invalid-code', 'Invalid confirmation code');
      }

      // Disable MFA
      await Users.updateAsync(context.userId, {
        $unset: { mfa: '' }
      });

      await logMFAEvent(context.userId, 'MFA Disabled', 'success', ipAddress);

      return {
        success: true,
        message: 'MFA has been disabled'
      };

    } catch (error) {
      if (error instanceof Meteor.Error) {
        throw error;
      }

      await logMFAEvent(context.userId, 'MFA Disable Failed', 'failed', ipAddress, {
        error: error.message
      });
      throw new Meteor.Error('disable-failed', 'Failed to disable MFA');
    }
});

Meteor.ServerMethods.define('mfa.getAuditLogs', {
  description: 'Return the caller recent MFA audit-log entries',
  positionalParams: ['args'],
  schemaObject: {
    type: 'object',
    properties: {
      args: {
        type: 'object',
        properties: { limit: { type: 'number' } }
      }
    }
  }
}, async function(params, context) {
    const args = params.args || {};

    const { limit = 10 } = args;

    try {
      if (!MFAAuditLogs) {
        return [];
      }

      const logs = await MFAAuditLogs.findAsync(
        { userId: context.userId },
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
});

// Public by design: historically returned a not-configured default pre-login
// (consumed by login-flow UI before a session exists). requireAuth:false; the
// guard is preserved as a graceful early return.
Meteor.ServerMethods.define('mfa.checkStatus', {
  description: 'Report the caller MFA configuration and enforcement status',
  requireAuth: false
}, async function(params, context) {
    if (!context.userId) {
      return { configured: false, required: false };
    }

    try {
      const user = await Users.findOneAsync(context.userId);

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
});

Meteor.ServerMethods.define('mfa.validateCompliance', {
  description: 'Validate the caller MFA configuration against ONC compliance policy'
}, async function(params, context) {
    try {
      const user = await Users.findOneAsync(context.userId);
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
});