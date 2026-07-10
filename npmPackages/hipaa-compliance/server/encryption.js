// npmPackages/hipaa-compliance/server/encryption.js
//
// Key rotation, integrity verification, and encrypted export. Audit events
// are append-only: rotation never rewrites stored records — old events keep
// verifying/decrypting via the keyId embedded in their envelopes/extensions
// (historical keys retained under settings.private.x509.previousKeys).

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';
import crypto from 'crypto';
import { EncryptionManager } from '../lib/EncryptionManager';
import { HipaaLogger } from '../lib/HipaaLogger';
import { SecurityValidators } from '../lib/SecurityValidators';
import { EXTENSION_URLS, getExtensionValue } from '../lib/AuditEventMapping';
import { UserRoles } from '../lib/Constants';
import { buildAuditExport } from './methods';

Meteor.methods({
  // Acknowledge a rotation of the UDAP x509 key. The actual key swap happens
  // in settings (move the old PEM to settings.private.x509.previousKeys keyed
  // by its thumbprint, install the new PEM as privateKey); this method
  // validates the new key, stamps the rotation, and writes a security event.
  // No stored audit record is modified.
  'hipaa.rotateEncryptionKey': async function() {
    if (!this.userId || !(await SecurityValidators.canModifyAuditSettings(this.userId))) {
      throw new Meteor.Error('unauthorized', 'Only admins can rotate encryption keys');
    }

    // Throws encryption-key-missing when no x509 key is configured
    const activeKeyId = EncryptionManager.getActiveKeyId();

    set(Meteor, 'settings.private.hipaa.encryption.lastKeyRotation', new Date());

    await HipaaLogger.logSecurityEvent('key-rotated', {
      message: 'Active audit signing key acknowledged',
      keyId: activeKeyId,
      userId: this.userId
    });

    return {
      success: true,
      keyId: activeKeyId,
      rotatedAt: new Date()
    };
  },

  // Verify audit log integrity (signatures + tamper indicators)
  'hipaa.verifyAuditIntegrity': async function(dateRange) {
    if (!get(Meteor, 'settings.public.hipaa.features.integrityChecking', true)) {
      throw new Meteor.Error('feature-disabled',
        'Integrity checking is disabled (settings.public.hipaa.features.integrityChecking)');
    }

    if (!this.userId || !(await SecurityValidators.hasAnyRole(this.userId,
      [UserRoles.ADMIN, UserRoles.COMPLIANCE_OFFICER]))) {
      throw new Meteor.Error('unauthorized', 'Not authorized to verify audit integrity');
    }

    const AuditEvents = get(global, 'Collections.AuditEvents');
    if (!AuditEvents) {
      throw new Meteor.Error('collection-unavailable', 'AuditEvents collection not available');
    }

    const query = {};
    if (dateRange) {
      query.recorded = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const records = await AuditEvents.find(query, {
      sort: { recorded: -1 },
      limit: 1000
    }).fetchAsync();

    let valid = 0;
    let invalid = 0;
    let unsigned = 0;
    const issues = [];

    for (const record of records) {
      const signature = getExtensionValue(record, EXTENSION_URLS.SIGNATURE);

      if (signature) {
        if (EncryptionManager.verifySignature(record)) {
          valid++;
        } else {
          invalid++;
          issues.push({
            recordId: record._id,
            issue: 'Invalid signature',
            recorded: record.recorded
          });
        }
      } else {
        unsigned++;
      }

      // Tamper indicator: every audit event must carry its recorded timestamp
      if (!record.recorded) {
        issues.push({
          recordId: record._id,
          issue: 'Missing recorded timestamp'
        });
      }
    }

    await HipaaLogger.logSystemEvent('integrity-check', {
      userId: this.userId,
      recordsChecked: records.length,
      valid: valid,
      invalid: invalid,
      unsigned: unsigned,
      issuesFound: issues.length
    });

    return {
      checked: records.length,
      valid: valid,
      invalid: invalid,
      unsigned: unsigned,
      issues: issues.slice(0, 100) // Limit issues returned
    };
  },

  // Generate encrypted export
  'hipaa.generateEncryptedExport': async function(exportOptions) {
    if (!get(Meteor, 'settings.public.hipaa.features.encryptedExport', false)) {
      throw new Meteor.Error('feature-disabled',
        'Encrypted export is disabled (settings.public.hipaa.features.encryptedExport)');
    }

    await SecurityValidators.validateExportRequest(this.userId, exportOptions);

    // Build the export directly (shared helper — not a nested method call)
    const exportResult = await buildAuditExport(exportOptions);

    // Encrypt the export payload and a random export key
    const encryptedData = EncryptionManager.encryptSensitiveData(exportResult.data);
    const exportKey = crypto.randomBytes(32).toString('hex');
    const encryptedExportKey = EncryptionManager.encryptSensitiveData(exportKey);

    await HipaaLogger.logSystemEvent('encrypted-export', {
      userId: this.userId,
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
  }
});
