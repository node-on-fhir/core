// packages/hipaa-compliance/server/encryption.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import crypto from 'crypto';
import { HipaaAuditLog } from '../lib/Collections';
import { EncryptionManager } from '../lib/EncryptionManager';
import { HipaaLogger } from '../lib/HipaaLoggerAccess';
import { SecurityValidators } from '../lib/SecurityValidators';
import { SecurityLevels } from '../lib/Constants';

// Try to import Roles if available
let Roles;
try {
  Roles = Package['alanning:roles']?.Roles;
} catch (e) {
  // Roles package not available
}

// Server-side encryption utilities
Meteor.methods({
  // Rotate encryption key
  'hipaa.rotateEncryptionKey': async function(newKey, reencryptExisting = false) {
    // Only admins can rotate keys
    if (!this.userId || !Roles.userIsInRole(this.userId, ['admin'])) {
      throw new Meteor.Error('unauthorized', 'Only admins can rotate encryption keys');
    }

    // Validate new key
    if (!newKey || newKey.length < 32) {
      throw new Meteor.Error('invalid-key', 'Encryption key must be at least 32 characters');
    }

    const oldKey = EncryptionManager.getEncryptionKey();
    const oldLevel = EncryptionManager.getEncryptionLevel();

    try {
      // Update the key in settings (in production, this would update secure storage)
      Meteor.settings.private.hipaa.encryption.secretKey = newKey;
      Meteor.settings.private.hipaa.encryption.lastKeyRotation = new Date();

      // Log the key rotation
      await HipaaLogger.logSecurityEvent('key-rotated', {
        message: 'Encryption key rotated successfully',
        reencryptExisting: reencryptExisting
      });

      // Re-encrypt existing data if requested
      if (reencryptExisting && oldLevel !== 'none') {
        await this.reencryptAuditLogs(oldKey, newKey, oldLevel);
      }

      return {
        success: true,
        rotatedAt: new Date()
      };
    } catch (error) {
      // Restore old key on error
      Meteor.settings.private.hipaa.encryption.secretKey = oldKey;
      throw new Meteor.Error('rotation-failed', 'Failed to rotate encryption key');
    }
  },

  // Re-encrypt audit logs with new key
  'hipaa.reencryptAuditLogs': async function(oldKey, newKey, encryptionLevel) {
    // Only system can call this
    if (this.userId) {
      throw new Meteor.Error('system-only', 'This method is for system use only');
    }

    let processed = 0;
    let errors = 0;

    // Process in batches
    const batchSize = 100;
    const totalRecords = await HipaaAuditLog.find({
      encryptionLevel: { $ne: 'none' }
    }).countAsync();

    console.log(`Re-encrypting ${totalRecords} audit records...`);

    for (let skip = 0; skip < totalRecords; skip += batchSize) {
      const batch = await HipaaAuditLog.find({
        encryptionLevel: { $ne: 'none' }
      }, {
        limit: batchSize,
        skip: skip
      }).fetchAsync();

      for (const record of batch) {
        try {
          // Decrypt with old key
          const decrypted = this.decryptWithKey(record, oldKey, encryptionLevel);
          
          // Re-encrypt with new key
          const reencrypted = this.encryptWithKey(decrypted, newKey, encryptionLevel);
          
          // Update record
          await HipaaAuditLog.updateAsync(record._id, {
            $set: reencrypted
          });
          
          processed++;
        } catch (error) {
          console.error(`Failed to re-encrypt record ${record._id}:`, error);
          errors++;
        }
      }

      // Progress update
      if (processed % 1000 === 0) {
        console.log(`Re-encrypted ${processed}/${totalRecords} records`);
      }
    }

    console.log(`Re-encryption complete. Processed: ${processed}, Errors: ${errors}`);

    return {
      processed: processed,
      errors: errors,
      total: totalRecords
    };
  },

  // Verify audit log integrity
  'hipaa.verifyAuditIntegrity': async function(dateRange) {
    // Check permissions
    if (!this.userId || !Roles.userIsInRole(this.userId, ['admin', 'compliance-officer'])) {
      throw new Meteor.Error('unauthorized', 'Not authorized to verify audit integrity');
    }

    const query = {};
    if (dateRange) {
      query.eventDate = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const records = await HipaaAuditLog.find(query, {
      limit: 1000
    }).fetchAsync();

    let valid = 0;
    let invalid = 0;
    const issues = [];

    for (const record of records) {
      // Verify signature if present
      if (record.signature) {
        const isValid = EncryptionManager.verifySignature(record, record.signature);
        if (isValid) {
          valid++;
        } else {
          invalid++;
          issues.push({
            recordId: record._id,
            issue: 'Invalid signature',
            eventDate: record.eventDate
          });
        }
      } else {
        valid++; // No signature to verify
      }

      // Check for tampering indicators
      if (!record.createdAt) {
        issues.push({
          recordId: record._id,
          issue: 'Missing createdAt timestamp',
          eventDate: record.eventDate
        });
      }
    }

    // Log the integrity check
    await HipaaLogger.logSystemEvent('integrity-check', {
      recordsChecked: records.length,
      valid: valid,
      invalid: invalid,
      issuesFound: issues.length
    });

    return {
      checked: records.length,
      valid: valid,
      invalid: invalid,
      issues: issues.slice(0, 100) // Limit issues returned
    };
  },

  // Generate encrypted export
  'hipaa.generateEncryptedExport': async function(exportOptions) {
    // Validate permissions
    if (!SecurityValidators.canExportAuditData(this.userId)) {
      throw new Meteor.Error('unauthorized', 'Not authorized to export data');
    }

    // Get the data
    const exportResult = await Meteor.call('hipaa.exportAuditTrail', exportOptions);

    // Encrypt the export
    const encryptedData = EncryptionManager.encryptSensitiveData(
      exportResult.data,
      SecurityLevels.AES
    );

    // Generate export key
    const exportKey = crypto.randomBytes(32).toString('hex');
    
    // Encrypt the export key with the master key
    const encryptedExportKey = EncryptionManager.encryptSensitiveData(
      exportKey,
      SecurityLevels.AES
    );

    // Log the encrypted export
    await HipaaLogger.logSystemEvent('encrypted-export', {
      format: exportOptions.format,
      recordCount: exportResult.recordCount,
      encrypted: true
    });

    return {
      encryptedData: encryptedData,
      encryptedKey: encryptedExportKey,
      format: exportResult.format,
      recordCount: exportResult.recordCount,
      exportDate: exportResult.exportDate,
      instructions: 'Decrypt the key first, then use it to decrypt the data'
    };
  },

  // Helper to decrypt with specific key
  decryptWithKey: function(record, key, level) {
    const tempManager = Object.create(EncryptionManager);
    tempManager.getEncryptionKey = () => key;
    tempManager.getEncryptionLevel = () => level;
    return tempManager.decryptAuditEvent(record);
  },

  // Helper to encrypt with specific key
  encryptWithKey: function(record, key, level) {
    const tempManager = Object.create(EncryptionManager);
    tempManager.getEncryptionKey = () => key;
    tempManager.getEncryptionLevel = () => level;
    return tempManager.encryptAuditEvent(record);
  }
});