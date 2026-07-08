// npmPackages/record-lifecycle/server/FhircastBridge.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { EventBus } from './EventBus';
import {
  LifecycleToFhircast,
  FhircastResourceTypes
} from '../lib/RecordLifecycleEvents';
import { getSubscribedTopicsForEvent } from '../../fhircast/server/hub';

// =============================================================================
// FHIRcast Bridge — Lifecycle → FHIRcast Wire Format
// =============================================================================
//
// Subscribes to the Record Lifecycle EventBus and translates events into
// FHIRcast STU3 wire format. For the PoC, translated events are logged
// to the console. In production, this would call fhircast.publishEvent.
//
// Only translates resources that have FHIRcast counterparts:
//   Patient, ImagingStudy, DiagnosticReport, Encounter
//
// Gated by settings.private.recordLifecycle.fhircastBridge (default: false).
// =============================================================================

/**
 * Build a FHIRcast STU3 event envelope from a lifecycle payload.
 *
 * @param {Object} payload - Unified event payload
 * @param {string} fhircastAction - The FHIRcast action suffix (open, close, update)
 * @param {string} topic - The hub topic to publish to
 * @returns {Object} FHIRcast event envelope
 */
function buildFhircastEvent(payload, fhircastAction, topic) {
  const resourceTypeLower = (payload.resourceType || '').toLowerCase();

  // FHIRcast event name: "{resourcetype}-{action}"
  const eventName = `${resourceTypeLower}-${fhircastAction}`;

  return {
    timestamp: payload.timestamp,
    id: payload.id,
    event: {
      'hub.topic': topic,
      'hub.event': eventName,
      context: [
        {
          key: resourceTypeLower,
          resource: {
            resourceType: payload.resourceType,
            id: payload.resourceId
          }
        },
        payload.patientId ? {
          key: 'patient',
          resource: {
            resourceType: 'Patient',
            id: payload.patientId
          }
        } : null
      ].filter(Boolean)
    },
    _meta: {
      lifecycleEvent: payload.lifecycleEvent,
      crudOperation: payload.crudOperation,
      collectionName: payload.collectionName
    }
  };
}

/**
 * Initialize the FHIRcast bridge subscriber.
 */
export function initFhircastBridge() {
  // Ensure EventBus is initialized before checking (may run before hooks init)
  EventBus.initialize();

  if (!EventBus.isEnabled()) {
    return;
  }

  const bridgeEnabled = get(Meteor, 'settings.private.recordLifecycle.fhircastBridge', false);
  if (!bridgeEnabled) {
    console.log('[record-lifecycle] FHIRcast bridge disabled by configuration');
    return;
  }

  EventBus.subscribe('fhircast-bridge', function(payload) {
    try {
      // Only translate resources with FHIRcast counterparts
      const resourceTypeLower = (payload.resourceType || '').toLowerCase();
      if (!FhircastResourceTypes.includes(resourceTypeLower)) {
        return;
      }

      // Look up the FHIRcast action for this lifecycle event
      const fhircastAction = LifecycleToFhircast[payload.lifecycleEvent];
      if (!fhircastAction) {
        return; // No FHIRcast equivalent for this lifecycle event
      }

      // Check per-resource fhircast publish config from settings
      const resourceConfig = get(Meteor, 'settings.private.fhir.rest.' + payload.resourceType + '.fhircast', null);
      const publishEnabled = resourceConfig && resourceConfig.publish === true;
      const eventAllowed = publishEnabled && Array.isArray(resourceConfig.events) && resourceConfig.events.indexOf(payload.lifecycleEvent) !== -1;

      // Build the FHIRcast event name for topic lookup
      const eventName = resourceTypeLower + '-' + fhircastAction;

      console.log(
        '[record-lifecycle] FHIRcast bridge: ' + eventName,
        JSON.stringify({
          resourceId: payload.resourceId,
          lifecycle: payload.lifecycleEvent,
          publishEnabled: publishEnabled,
          eventAllowed: eventAllowed
        })
      );

      if (publishEnabled && eventAllowed) {
        const port = process.env.PORT || '3000';
        const hubUrl = get(Meteor, 'settings.public.fhircast.hubUrl', '') || 'http://localhost:' + port + '/api/hub';

        // Collect all target topics
        const targetTopics = new Set();

        // 1. PatientId topic (if topicMode is patientId and we have a patientId)
        const topicMode = get(Meteor, 'settings.public.fhircast.topicMode', 'custom');
        if (topicMode === 'patientId' && payload.patientId) {
          targetTopics.add(payload.patientId);
        }

        // 2. Configured fallback topic (e.g. "DrXRay")
        const configuredTopic = get(Meteor, 'settings.public.fhircast.topic', '');
        if (configuredTopic) {
          targetTopics.add(configuredTopic);
        }

        // 3. Active subscriber topics from hub's in-memory store
        const subscribedTopics = getSubscribedTopicsForEvent(eventName);
        subscribedTopics.forEach(function(t) { targetTopics.add(t); });

        console.log('[record-lifecycle] FHIRcast target topics:', Array.from(targetTopics));

        // Publish to each unique topic
        targetTopics.forEach(function(topic) {
          const fhircastEvent = buildFhircastEvent(payload, fhircastAction, topic);
          Meteor.defer(function() {
            try {
              Meteor.call('fhircast.publishEvent', hubUrl, fhircastEvent);
              console.log('[record-lifecycle] FHIRcast published:', fhircastEvent.event['hub.event'], 'topic:', topic);
            } catch (err) {
              console.error('[record-lifecycle] FHIRcast publish error for topic', topic, ':', err);
            }
          });
        });
      }

    } catch (error) {
      console.error('[record-lifecycle] FHIRcast bridge error:', error);
    }
  });

  console.log('[record-lifecycle] FHIRcast bridge initialized');
}
