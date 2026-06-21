// npmPackages/record-lifecycle/server/HipaaSubscriber.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { EventBus } from './EventBus';
import { LifecycleToHipaa } from '../lib/RecordLifecycleEvents';

// =============================================================================
// HIPAA Audit Subscriber
// =============================================================================
//
// Subscribes to the Record Lifecycle EventBus and forwards events to the
// existing HipaaLogger.logEvent() API. This bridges lifecycle semantics
// into the HIPAA audit trail.
//
// Gated by settings.private.recordLifecycle.hipaaSubscriber (default: true).
//
// Coexists with the existing HIPAA collection hooks during migration.
// To complete migration later, disable old hooks via:
//   settings.private.hipaa.hooks.enableCollectionHooks: false
// =============================================================================

let HipaaLogger = null;

/**
 * Initialize the HIPAA subscriber.
 * Attempts to import HipaaLogger and subscribes to the EventBus.
 */
export function initHipaaSubscriber() {
  if (!EventBus.isEnabled()) {
    return;
  }

  const subscriberEnabled = get(Meteor, 'settings.private.recordLifecycle.hipaaSubscriber', true);
  if (!subscriberEnabled) {
    console.log('[record-lifecycle] HIPAA subscriber disabled by configuration');
    return;
  }

  // Try to access HipaaLogger from the hipaa-compliance package
  try {
    const hipaaModule = Package['clinical:hipaa-compliance'];
    if (hipaaModule && hipaaModule.HipaaLogger) {
      HipaaLogger = hipaaModule.HipaaLogger;
    }
  } catch (e) {
    // Package not available via atmosphere
  }

  // Fallback: try global
  if (!HipaaLogger && typeof global !== 'undefined' && global.HipaaLogger) {
    HipaaLogger = global.HipaaLogger;
  }

  if (!HipaaLogger) {
    console.warn('[record-lifecycle] HipaaLogger not available — HIPAA subscriber will not log events');
    console.warn('[record-lifecycle] Ensure the hipaa-compliance package is installed and loaded');
    return;
  }

  EventBus.subscribe('hipaa-subscriber', function(payload) {
    try {
      // Map lifecycle event to HIPAA event type
      const hipaaEventType = LifecycleToHipaa[payload.lifecycleEvent] || 'access';

      HipaaLogger.logEvent({
        eventType: hipaaEventType,
        userId: payload.userId,
        collectionName: payload.collectionName,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
        patientId: payload.patientId,
        message: `[RLE] ${payload.lifecycleEvent} — ${payload.collectionName}/${payload.resourceId}`,
        metadata: {
          lifecycleEvent: payload.lifecycleEvent,
          crudOperation: payload.crudOperation,
          fieldNames: payload.fieldNames,
          currentStatus: payload.currentStatus,
          source: 'record-lifecycle-eventbus'
        }
      });
    } catch (error) {
      console.error('[record-lifecycle] HIPAA subscriber error:', error);
    }
  });

  console.log('[record-lifecycle] HIPAA subscriber initialized');
}
