// npmPackages/record-lifecycle/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { EventBus } from './EventBus';
import { AllLifecycleEvents, RecordLifecycleEvent } from '../lib/RecordLifecycleEvents';
import { buildEventPayload } from '../lib/EventPayload';

// =============================================================================
// METEOR METHODS — Record Lifecycle
// =============================================================================

Meteor.methods({
  /**
   * Check if the record lifecycle feature is enabled.
   * Used by the client for settings-gated UI (tri-state pattern).
   */
  'recordLifecycle.checkSettings': async function() {
    const enabled = get(Meteor, 'settings.private.recordLifecycle.enabled', false);
    const hipaaSubscriber = get(Meteor, 'settings.private.recordLifecycle.hipaaSubscriber', true);
    const fhircastBridge = get(Meteor, 'settings.private.recordLifecycle.fhircastBridge', false);

    console.log('[recordLifecycle.checkSettings] enabled:', enabled);

    return {
      enabled: enabled,
      hipaaSubscriber: hipaaSubscriber,
      fhircastBridge: fhircastBridge
    };
  },

  /**
   * Get EventBus status (event count, subscriber count, buffer size).
   */
  'recordLifecycle.getStatus': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to view EventBus status.');
    }

    const enabled = get(Meteor, 'settings.private.recordLifecycle.enabled', false);
    if (!enabled) {
      return { enabled: false };
    }

    const status = EventBus.getStatus();
    console.log('[recordLifecycle.getStatus]', status);
    return status;
  },

  /**
   * Get recent events from the EventBus circular buffer.
   *
   * @param {number} [limit=50] - Max number of events to return
   * @returns {Object[]} Recent events, newest first
   */
  'recordLifecycle.getRecentEvents': async function(limit) {
    check(limit, Match.Maybe(Number));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to view lifecycle events.');
    }

    const enabled = get(Meteor, 'settings.private.recordLifecycle.enabled', false);
    if (!enabled) {
      return [];
    }

    const count = limit || 50;
    const events = EventBus.getRecentEvents(count);

    // Strip full resource body to reduce payload size
    return events.map(function(event) {
      return {
        id: event.id,
        timestamp: event.timestamp,
        lifecycleEvent: event.lifecycleEvent,
        crudOperation: event.crudOperation,
        collectionName: event.collectionName,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        userId: event.userId,
        patientId: event.patientId,
        currentStatus: event.currentStatus,
        fieldNames: event.fieldNames,
        source: event.source
      };
    });
  },

  /**
   * Emit a manual lifecycle event for testing purposes.
   *
   * @param {string} lifecycleEvent - The lifecycle event code (e.g., 'originate')
   * @param {string} resourceType - FHIR resource type (e.g., 'Patient')
   * @param {string} resourceId - Resource ID
   * @param {Object} [metadata] - Additional metadata
   */
  'recordLifecycle.emitManualEvent': async function(lifecycleEvent, resourceType, resourceId, metadata) {
    check(lifecycleEvent, String);
    check(resourceType, String);
    check(resourceId, String);
    check(metadata, Match.Maybe(Object));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to emit lifecycle events.');
    }

    const enabled = get(Meteor, 'settings.private.recordLifecycle.enabled', false);
    if (!enabled) {
      throw new Meteor.Error('feature-disabled',
        'Record Lifecycle is disabled. Set Meteor.settings.private.recordLifecycle.enabled to true.');
    }

    // Validate lifecycle event code
    if (!AllLifecycleEvents.includes(lifecycleEvent)) {
      throw new Meteor.Error('invalid-event',
        `Unknown lifecycle event: ${lifecycleEvent}. Valid events: ${AllLifecycleEvents.join(', ')}`);
    }

    const payload = {
      id: require('meteor/random').Random.id(),
      timestamp: new Date().toISOString(),
      lifecycleEvent: lifecycleEvent,
      crudOperation: 'manual',
      collectionName: resourceType,
      resourceType: resourceType,
      resourceId: resourceId,
      userId: this.userId,
      patientId: null,
      patientReference: null,
      fieldNames: [],
      currentStatus: null,
      modifier: null,
      resource: null,
      source: 'manual',
      metadata: metadata || {}
    };

    EventBus.emitLifecycleEvent(payload);

    console.log(`[recordLifecycle.emitManualEvent] ${lifecycleEvent} — ${resourceType}/${resourceId}`);
    return { success: true, eventId: payload.id };
  }
});
