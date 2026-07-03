// packages/hipaa-compliance/server/startup.js

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';
import { HipaaLogger } from '../lib/HipaaLoggerAccess';
import { EncryptionManager } from '../lib/EncryptionManager';
import { setupAuditHooks, setupUserActivityHooks } from './hooks';

const log = (Meteor.Logger ? Meteor.Logger.for('hipaa-compliance') : console);

Meteor.startup(async function() {
  log.info('Initializing HIPAA Compliance package...');

  // Inject environment variables into settings
  injectEnvironmentVariables();

  // Initialize the logger
  HipaaLogger.initialize();

  // Note: Validation is now handled by the core AuditEvents collection

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
    package: 'clinical:hipaa-compliance',
    version: '0.1.0',
    environment: get(Meteor, 'settings.public.hipaa.compliance.environment', 'production'),
    encryptionLevel: get(Meteor, 'settings.private.hipaa.security.encryptionLevel', 'none')
  });

  log.info('HIPAA Compliance package initialized successfully');
});

// Inject environment variables into Meteor.settings
function injectEnvironmentVariables() {
  // Encryption key
  if (process.env.HIPAA_ENCRYPTION_KEY) {
    set(Meteor, 'settings.private.hipaa.encryption.secretKey', process.env.HIPAA_ENCRYPTION_KEY);
    log.info('Loaded HIPAA encryption key from environment');
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

// Create database indexes
async function createIndexes() {
  try {
    // Get AuditEvents from global Collections
    const AuditEvents = await global.Collections?.AuditEvents;
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
    if (EncryptionManager.shouldRotateKey()) {
      log.warn('HIPAA encryption key rotation is due — update settings.private.hipaa.encryption.lastKeyRotation');
      
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
  const AuditEvents = await global.Collections?.AuditEvents;
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