// npmPackages/hipaa-compliance/server/startup.js

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';
import { HipaaLogger } from '../lib/HipaaLogger';
import { EncryptionManager } from '../lib/EncryptionManager';
import { SecurityLevels } from '../lib/Constants';
import { setupAuditHooks, setupUserActivityHooks } from './hooks';

const log = (Meteor.Logger ? Meteor.Logger.for('hipaa-compliance') : console);

Meteor.startup(async function() {
  log.info('Initializing HIPAA Compliance package...');

  // Inject environment variables into settings
  injectEnvironmentVariables();

  // Initialize the logger
  HipaaLogger.initialize();

  // Validate encryption configuration (fail-closed: bad config is loud, and
  // production refuses to start with encryption demanded but no key)
  validateEncryptionConfig();

  // Create indexes for performance
  await createIndexes();

  // Setup collection hooks if enabled
  const hooksEnabled = get(Meteor, 'settings.public.hipaa.features.automaticHooks', true);
  if (hooksEnabled) {
    await setupAuditHooks();
    setupUserActivityHooks();
  }

  // Check encryption key rotation
  checkKeyRotation();

  // Log startup
  await HipaaLogger.logSystemEvent('init', {
    package: '@node-on-fhir/hipaa-compliance',
    version: '0.2.0',
    environment: get(Meteor, 'settings.public.hipaa.compliance.environment', 'production'),
    encryptionLevel: EncryptionManager.getEncryptionLevel()
  });

  log.info('HIPAA Compliance package initialized successfully');
});

// Inject environment variables into Meteor.settings
function injectEnvironmentVariables() {
  // Encryption/signing key — audit crypto rides the UDAP x509 key
  if (process.env.HIPAA_ENCRYPTION_KEY) {
    if (!get(Meteor, 'settings.private.x509.privateKey')) {
      set(Meteor, 'settings.private.x509.privateKey', process.env.HIPAA_ENCRYPTION_KEY);
      log.warn('HIPAA_ENCRYPTION_KEY loaded into settings.private.x509.privateKey — prefer configuring the x509 key directly in settings');
    } else {
      log.warn('HIPAA_ENCRYPTION_KEY ignored — settings.private.x509.privateKey is already configured');
    }
  }

  // Security level
  if (process.env.HIPAA_SECURITY_LEVEL) {
    set(Meteor, 'settings.private.hipaa.security.encryptionLevel', process.env.HIPAA_SECURITY_LEVEL);
    log.info('HIPAA security level set', { level: process.env.HIPAA_SECURITY_LEVEL });
  }

  // Data retention
  if (process.env.HIPAA_RETENTION_YEARS) {
    set(Meteor, 'settings.public.hipaa.compliance.dataRetentionYears',
        parseInt(process.env.HIPAA_RETENTION_YEARS));
  }

  // Environment
  if (process.env.HIPAA_ENVIRONMENT) {
    set(Meteor, 'settings.public.hipaa.compliance.environment', process.env.HIPAA_ENVIRONMENT);
  }

  // Debug access
  if (process.env.HIPAA_ALLOW_DEBUG) {
    set(Meteor, 'settings.private.hipaa.security.allowDebugAccess',
        process.env.HIPAA_ALLOW_DEBUG === 'true');
  }
}

// Validate the encryption configuration at startup. Encryption demanded with
// no key is a broken state: refuse to start in production; normalize to
// 'none' (loudly) in development so local work can proceed.
function validateEncryptionConfig() {
  const level = EncryptionManager.getEncryptionLevel();

  if (level === SecurityLevels.AES && !EncryptionManager.hasSigningKey()) {
    const environment = get(Meteor, 'settings.public.hipaa.compliance.environment', 'production');
    if (environment === 'production') {
      throw new Meteor.Error('encryption-key-missing',
        'encryptionLevel is "aes" but no x509 key is configured — set settings.private.x509.privateKey (the UDAP key)');
    }
    log.error('encryptionLevel is "aes" but no x509 key is configured — audit encryption DISABLED for this development run (set settings.private.x509.privateKey)');
    set(Meteor, 'settings.private.hipaa.security.encryptionLevel', SecurityLevels.NONE);
  }

  if (EncryptionManager.hasSigningKey()) {
    try {
      log.info('Audit signing key active', { keyId: EncryptionManager.getActiveKeyId() });
    } catch (error) {
      log.error('Configured x509 private key is unreadable', { error: error && error.message });
    }
  } else {
    log.warn('No x509 key configured — audit events will not be signed (set settings.private.x509.privateKey to enable tamper evidence)');
  }
}

// Create database indexes
async function createIndexes() {
  try {
    // Get AuditEvents from global Collections
    const AuditEvents = get(global, 'Collections.AuditEvents');
    if (!AuditEvents) {
      log.warn('AuditEvents collection not available for indexing');
      return;
    }

    const collection = AuditEvents.rawCollection();

    // Create indexes for common queries
    await collection.createIndex({ recorded: -1 });
    await collection.createIndex({ 'type.code': 1, recorded: -1 });
    await collection.createIndex({ 'agent.who.reference': 1, recorded: -1 });
    await collection.createIndex({ 'patient.reference': 1, recorded: -1 });
    await collection.createIndex({ 'entity.what.reference': 1 });

    // Compound index for patient audit trails
    await collection.createIndex({
      'patient.reference': 1,
      'type.code': 1,
      recorded: -1
    });

    // Text index for search
    await collection.createIndex({
      outcomeDesc: 'text',
      'agent.who.display': 'text',
      'patient.display': 'text'
    });

    log.info('HIPAA audit log indexes created successfully');
  } catch (error) {
    log.error('Error creating HIPAA audit log indexes', { error: error && error.message });
  }
}

// Check if encryption key rotation is needed
function checkKeyRotation() {
  try {
    if (EncryptionManager.hasSigningKey() && EncryptionManager.shouldRotateKey()) {
      log.warn('HIPAA audit key rotation is due — rotate the UDAP x509 key and acknowledge via hipaa.rotateEncryptionKey');

      // Log security event
      HipaaLogger.logSecurityEvent('key-rotation-due', {
        message: 'Encryption key rotation is overdue',
        lastRotation: get(Meteor, 'settings.private.hipaa.encryption.lastKeyRotation'),
        rotationDays: get(Meteor, 'settings.private.hipaa.encryption.keyRotationDays', 90)
      });
    }
  } catch (error) {
    log.error('Error checking key rotation', { error: error && error.message });
  }
}

// Clean up old audit logs based on retention policy
export const cleanupOldAuditLogs = async function() {
  const retentionYears = get(Meteor, 'settings.public.hipaa.compliance.dataRetentionYears', 7);
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

  // Log the cleanup attempt
  await HipaaLogger.logSystemEvent('audit-cleanup', {
    retentionYears: retentionYears,
    cutoffDate: cutoffDate
  });

  // Get AuditEvents from global Collections
  const AuditEvents = get(global, 'Collections.AuditEvents');
  if (!AuditEvents) {
    log.warn('AuditEvents collection not available for cleanup');
    return 0;
  }

  // In production, you would archive rather than delete
  // For now, we'll just count what would be cleaned
  const oldEventCount = await AuditEvents.find({
    recorded: { $lt: cutoffDate }
  }).countAsync();

  if (oldEventCount > 0) {
    log.info('Audit events older than retention threshold found', { oldEventCount, retentionYears });
    // Archive logic would go here
  }

  return oldEventCount;
};
