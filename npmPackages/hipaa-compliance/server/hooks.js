// packages/hipaa-compliance/server/hooks.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { HipaaLogger } from '../lib/HipaaLoggerAccess';
import { CollectionNames } from '../lib/Constants';

const log = (Meteor.Logger ? Meteor.Logger.for('hipaa-compliance') : console);

// Try to get Accounts if available
let Accounts;
try {
  Accounts = Package['accounts-base']?.Accounts;
} catch (e) {
  // Accounts package not available
}

// Setup collection hooks for automatic audit logging
export const setupAuditHooks = async function() {
  // Check if hooks are enabled
  const hooksEnabled = get(Meteor, 'settings.private.hipaa.hooks.enableCollectionHooks', true);
  if (!hooksEnabled) {
    log.info('HIPAA audit hooks disabled by configuration');
    return;
  }

  // Get monitored collections from settings
  const monitoredCollections = get(
    Meteor, 
    'settings.private.hipaa.hooks.monitoredCollections',
    Object.values(CollectionNames).filter(name => name !== 'HipaaAuditLog')
  );

  log.info('Setting up HIPAA audit hooks for collections', { monitoredCollections });

  // Excluded system users
  const excludedUsers = get(
    Meteor,
    'settings.private.hipaa.hooks.excludeSystemUsers',
    ['system', 'migration-user']
  );

  // Setup hooks for each collection
  for (const collectionName of monitoredCollections) {
    try {
      // Get the collection from global namespace
      const Collection = await global.Collections?.[collectionName];
      
      if (!Collection) {
        log.warn('Collection not found for audit hooks', { collectionName });
        continue;
      }

      // Insert hook
      Collection.after.insert(async function(userId, doc) {
        // Skip system users
        if (excludedUsers.includes(userId)) return;

        // Set logger context
        HipaaLogger.setInvocation(this);

        // Extract patient context if available
        const patientId = extractPatientId(doc, collectionName);

        await HipaaLogger.logEvent({
          eventType: 'create',
          userId: userId,
          collectionName: collectionName,
          resourceType: doc.resourceType || collectionName,
          resourceId: doc._id,
          patientId: patientId,
          message: `Created ${collectionName} record`,
          metadata: {
            resourceType: doc.resourceType,
            status: doc.status
          }
        });
      });

      // Update hook
      Collection.after.update(async function(userId, doc, fieldNames, modifier, options) {
        // Skip system users
        if (excludedUsers.includes(userId)) return;

        // Skip if no actual changes
        if (fieldNames.length === 0) return;

        // Set logger context
        HipaaLogger.setInvocation(this);

        // Extract patient context
        const patientId = extractPatientId(doc, collectionName);

        await HipaaLogger.logEvent({
          eventType: 'update',
          userId: userId,
          collectionName: collectionName,
          resourceType: doc.resourceType || collectionName,
          resourceId: doc._id,
          patientId: patientId,
          message: `Updated ${collectionName} record`,
          metadata: {
            fieldsModified: fieldNames,
            modifierKeys: Object.keys(modifier)
          }
        });
      });

      // Remove hook
      Collection.after.remove(async function(userId, doc) {
        // Skip system users
        if (excludedUsers.includes(userId)) return;

        // Set logger context
        HipaaLogger.setInvocation(this);

        // Extract patient context
        const patientId = extractPatientId(doc, collectionName);

        await HipaaLogger.logEvent({
          eventType: 'delete',
          userId: userId,
          collectionName: collectionName,
          resourceType: doc.resourceType || collectionName,
          resourceId: doc._id,
          patientId: patientId,
          message: `Deleted ${collectionName} record`,
          metadata: {
            deletedResource: {
              resourceType: doc.resourceType,
              status: doc.status
            }
          }
        });
      });

      // Find hooks (for read access logging)
      if (get(Meteor, 'settings.private.hipaa.hooks.logReadAccess', false)) {
        Collection.after.find(async function(userId, selector, options) {
          // Skip system users
          if (excludedUsers.includes(userId)) return;

          // Only log if patient-specific query
          const patientId = extractPatientFromSelector(selector);
          if (!patientId) return;

          // Set logger context
          HipaaLogger.setInvocation(this);

          await HipaaLogger.logEvent({
            eventType: 'view',
            userId: userId,
            collectionName: collectionName,
            patientId: patientId,
            message: `Accessed ${collectionName} records`,
            metadata: {
              selector: selector,
              limit: options?.limit
            }
          });
        });
      }

      log.info('HIPAA audit hooks registered', { collectionName });

    } catch (error) {
      log.error('Error setting up hooks', { collectionName, error: error && error.message });
    }
  }
};

// Helper to extract patient ID from FHIR resources
function extractPatientId(doc, collectionName) {
  if (!doc) return null;

  // Direct patient record
  if (collectionName === 'Patients') {
    return doc._id;
  }

  // FHIR resources with subject reference
  const subjectRef = get(doc, 'subject.reference', '');
  if (subjectRef.startsWith('Patient/')) {
    return subjectRef.replace('Patient/', '');
  }

  // FHIR resources with patient reference
  const patientRef = get(doc, 'patient.reference', '');
  if (patientRef.startsWith('Patient/')) {
    return patientRef.replace('Patient/', '');
  }

  // Encounter-based resources
  const encounterRef = get(doc, 'encounter.reference', '');
  if (encounterRef) {
    // Would need to look up encounter to get patient
    // For now, just note it's encounter-related
    return null;
  }

  return null;
}

// Helper to extract patient ID from query selector
function extractPatientFromSelector(selector) {
  if (!selector) return null;

  // Direct patient ID query
  if (selector._id && typeof selector._id === 'string') {
    return selector._id;
  }

  // Subject reference query
  const subjectRef = get(selector, 'subject.reference');
  if (subjectRef?.startsWith('Patient/')) {
    return subjectRef.replace('Patient/', '');
  }

  // Patient reference query
  const patientRef = get(selector, 'patient.reference');
  if (patientRef?.startsWith('Patient/')) {
    return patientRef.replace('Patient/', '');
  }

  return null;
}

// Setup user activity hooks
export const setupUserActivityHooks = function() {
  if (!Accounts) {
    log.info('Accounts package not available, skipping user activity hooks');
    return;
  }
  
  // Log successful logins
  Accounts.onLogin(async function(info) {
    const userId = info.user._id;
    
    await HipaaLogger.logSystemEvent('login', {
      userId: userId,
      userName: info.user.username || info.user.emails?.[0]?.address,
      loginType: info.type,
      connection: info.connection
    });
  });

  // Log logouts
  Accounts.onLogout(async function(info) {
    if (info.user) {
      await HipaaLogger.logSystemEvent('logout', {
        userId: info.user._id,
        userName: info.user.username || info.user.emails?.[0]?.address
      });
    }
  });

  // Log failed login attempts
  Accounts.onLoginFailure(async function(info) {
    await HipaaLogger.logSecurityEvent('denied', {
      attemptedUser: info.methodArguments?.[0]?.user,
      error: info.error?.reason,
      connection: info.connection
    });
  });
};