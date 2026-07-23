// npmPackages/hipaa-compliance/server/encryption.js
//
// Key rotation, integrity verification, and encrypted export. Audit events
// are append-only: rotation never rewrites stored records — old events keep
// verifying/decrypting via the keyId embedded in their envelopes/extensions
// (historical keys retained under settings.private.x509.previousKeys).
//
// rpc-migration (feat/json-rpc): converted from Meteor.methods to
// Meteor.ServerMethods.define (npmPackages exemplar — GLOBAL registry, no
// import). SECURITY POSTURE PRESERVED EXACTLY: these methods touch key
// material / decrypt PHI, so requireAuth stays true AND the original
// role-based inner guards (SecurityValidators.*) are kept verbatim — the
// registry's requireAuth only asserts a logged-in caller; the fine-grained
// admin/compliance-officer checks below are still load-bearing.
//   ⚠️ SECURITY REVIEW FLAG: hipaa.rotateEncryptionKey (key rotation) and
//   hipaa.generateEncryptedExport (decrypts audit PHI, emits an export key)
//   were flagged during the RPC migration for a dedicated review of the new
//   transport's auth path.
// These are NOT audit-sink writers themselves; to avoid phi-audit recursion
// (an audit event about writing an audit event) they are left phi:false — the
// underlying HipaaLogger.log*Event handles audit emission.

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';
import crypto from 'crypto';
import { EncryptionManager } from '../lib/EncryptionManager';
import { HipaaLogger } from '../lib/HipaaLogger';
import { SecurityValidators } from '../lib/SecurityValidators';
import { EXTENSION_URLS, getExtensionValue } from '../lib/AuditEventMapping';
import { UserRoles } from '../lib/Constants';
import { buildAuditExport } from './methods';

// Acknowledge a rotation of the UDAP x509 key. The actual key swap happens
// in settings (move the old PEM to settings.private.x509.previousKeys keyed
// by its thumbprint, install the new PEM as privateKey); this method
// validates the new key, stamps the rotation, and writes a security event.
// No stored audit record is modified.
Meteor.ServerMethods.define('hipaa.rotateEncryptionKey', {
  description: 'Acknowledge rotation of the active audit signing (x509) key',
  phi: false
  // requireAuth default (true). Inner admin guard preserved below.
  // ⚠️ SECURITY REVIEW: key-material operation over the new RPC transport.
}, async function(params, context) {
  if (!context.userId || !(await SecurityValidators.canModifyAuditSettings(context.userId))) {
    throw new Meteor.Error('unauthorized', 'Only admins can rotate encryption keys');
  }

  // Throws encryption-key-missing when no x509 key is configured
  const activeKeyId = EncryptionManager.getActiveKeyId();

  set(Meteor, 'settings.private.hipaa.encryption.lastKeyRotation', new Date());

  await HipaaLogger.logSecurityEvent('key-rotated', {
    message: 'Active audit signing key acknowledged',
    keyId: activeKeyId,
    userId: context.userId
  });

  return {
    success: true,
    keyId: activeKeyId,
    rotatedAt: new Date()
  };
});

// Verify audit log integrity (signatures + tamper indicators)
Meteor.ServerMethods.define('hipaa.verifyAuditIntegrity', {
  description: 'Verify stored AuditEvent signatures and tamper indicators',
  phi: false,
  positionalParams: ['dateRange'],
  schemaObject: {
    type: 'object',
    properties: { dateRange: { type: ['object', 'null'] } }
  }
  // requireAuth default (true). Inner admin/compliance-officer guard preserved.
}, async function(params, context) {
  const dateRange = get(params, 'dateRange');

  if (!get(Meteor, 'settings.public.hipaa.features.integrityChecking', true)) {
    throw new Meteor.Error('feature-disabled',
      'Integrity checking is disabled (settings.public.hipaa.features.integrityChecking)');
  }

  if (!context.userId || !(await SecurityValidators.hasAnyRole(context.userId,
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
    userId: context.userId,
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
});

// Generate encrypted export
Meteor.ServerMethods.define('hipaa.generateEncryptedExport', {
  description: 'Build and encrypt an audit-trail export plus a wrapped export key',
  phi: false,
  positionalParams: ['exportOptions'],
  schemaObject: { type: 'object', properties: { exportOptions: { type: 'object' } } }
  // requireAuth default (true). Inner SecurityValidators.validateExportRequest
  // (fail-closed) preserved.
  // ⚠️ SECURITY REVIEW: decrypts audit PHI and emits an export key over the
  // new RPC transport.
}, async function(params, context) {
  const exportOptions = get(params, 'exportOptions');

  if (!get(Meteor, 'settings.public.hipaa.features.encryptedExport', false)) {
    throw new Meteor.Error('feature-disabled',
      'Encrypted export is disabled (settings.public.hipaa.features.encryptedExport)');
  }

  await SecurityValidators.validateExportRequest(context.userId, exportOptions);

  // Build the export directly (shared helper — not a nested method call)
  const exportResult = await buildAuditExport(exportOptions);

  // Encrypt the export payload and a random export key
  const encryptedData = EncryptionManager.encryptSensitiveData(exportResult.data);
  const exportKey = crypto.randomBytes(32).toString('hex');
  const encryptedExportKey = EncryptionManager.encryptSensitiveData(exportKey);

  await HipaaLogger.logSystemEvent('encrypted-export', {
    userId: context.userId,
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
});
