// npmPackages/fhircast-module/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { fetch } from 'meteor/fetch';
import { get, set } from 'lodash';
import { AllLifecycleEvents } from '../../record-lifecycle/lib/RecordLifecycleEvents';
import { FhircastEvents } from '../lib/FhircastEvents';
import { sanitizeDottedKeys } from '../lib/sanitize.js';

// =============================================================================
// METEOR METHODS (Meteor v3 Async Pattern)
// =============================================================================

Meteor.methods({
  /**
   * Get FHIRcast module status
   * @returns {Object} Module status information
   */
  'fhircast.getStatus': async function() {
    console.log('[fhircast.getStatus] Checking status');

    return {
      name: 'fhircast-module',
      version: '0.1.0',
      status: 'active',
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Forward subscription request to external FHIRcast hub
   * @param {String} hubUrl - The hub URL to subscribe to
   * @param {Object} subscriptionData - Subscription parameters
   * @returns {Object} Response from the hub
   */
  'fhircast.subscribe': async function(hubUrl, subscriptionData, authorization) {
    check(hubUrl, String);
    check(subscriptionData, Object);
    check(authorization, Match.Maybe(String));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.subscribe] Subscribing to hub:', hubUrl);
    console.log('[fhircast.subscribe] Topic:', subscriptionData['hub.topic']);

    try {
      var payload = Object.assign({}, subscriptionData);
      if (Array.isArray(payload['hub.events'])) {
        payload['hub.events'] = payload['hub.events'].join(',');
      }

      var headers = { 'Content-Type': 'application/json' };
      if (authorization) {
        headers['Authorization'] = authorization;
      }

      var response = await fetch(hubUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      var statusCode = response.status;
      console.log('[fhircast.subscribe] Hub response status:', statusCode);

      return {
        success: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[fhircast.subscribe] Error:', error.message);
      throw new Meteor.Error('hub-error', 'Failed to connect to FHIRcast hub: ' + error.message);
    }
  },

  /**
   * Forward unsubscribe request to external FHIRcast hub
   * @param {String} hubUrl - The hub URL to unsubscribe from
   * @param {Object} subscriptionData - Unsubscription parameters
   * @returns {Object} Response from the hub
   */
  'fhircast.unsubscribe': async function(hubUrl, subscriptionData, authorization) {
    check(hubUrl, String);
    check(subscriptionData, Object);
    check(authorization, Match.Maybe(String));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.unsubscribe] Unsubscribing from hub:', hubUrl);

    try {
      var payload = Object.assign({}, subscriptionData, {
        'hub.mode': 'unsubscribe'
      });

      if (Array.isArray(payload['hub.events'])) {
        payload['hub.events'] = payload['hub.events'].join(',');
      }

      var headers = { 'Content-Type': 'application/json' };
      if (authorization) {
        headers['Authorization'] = authorization;
      }

      var response = await fetch(hubUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      var statusCode = response.status;
      console.log('[fhircast.unsubscribe] Hub response status:', statusCode);

      return {
        success: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[fhircast.unsubscribe] Error:', error.message);
      throw new Meteor.Error('hub-error', 'Failed to unsubscribe from FHIRcast hub: ' + error.message);
    }
  },

  /**
   * Check hub status by sending a status request
   * @param {String} hubUrl - The hub URL to check
   * @returns {Object} Hub status information
   */
  'fhircast.getHubStatus': async function(hubUrl) {
    check(hubUrl, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.getHubStatus] Checking hub status:', hubUrl);

    try {
      var response = await fetch(hubUrl + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      var statusCode = response.status;
      var body = null;

      try {
        body = await response.json();
      } catch (e) {
        console.warn('[fhircast.getHubStatus] Could not parse response body');
      }

      return {
        success: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        data: body,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[fhircast.getHubStatus] Error:', error.message);
      throw new Meteor.Error('hub-error', 'Failed to check hub status: ' + error.message);
    }
  },

  /**
   * Forward event publication to hub
   * @param {String} hubUrl - The hub URL
   * @param {Object} eventData - Event to publish
   * @returns {Object} Response from the hub
   */
  /**
   * Get FHIRcast publish config for all eligible resource types
   * @returns {Object} Map of resourceType → fhircast config
   */
  'fhircast.getPublishConfig': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.getPublishConfig] Reading publish config');

    var eligibleTypes = ['Patient', 'ImagingStudy', 'DiagnosticReport', 'Encounter'];
    var config = {};

    eligibleTypes.forEach(function(resourceType) {
      var fhircastConfig = get(Meteor, 'settings.private.fhir.rest.' + resourceType + '.fhircast', null);
      config[resourceType] = fhircastConfig || { publish: false, events: [] };
    });

    return config;
  },

  /**
   * Set FHIRcast config for a specific resource type (in-memory, lost on restart)
   * @param {String} resourceType - The FHIR resource type
   * @param {Object} config - The fhircast config { publish: Boolean, events: String[] }
   * @returns {Object} Updated config
   */
  'fhircast.setTopic': async function(topic) {
    check(topic, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.setTopic] Setting topic:', topic);
    set(Meteor, 'settings.public.fhircast.topic', topic);

    return { topic: topic };
  },

  'fhircast.setTopicMode': async function(mode) {
    check(mode, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.setTopicMode] Setting topic mode:', mode);
    set(Meteor, 'settings.public.fhircast.topicMode', mode);

    return { topicMode: mode };
  },

  'fhircast.setResourceFhircast': async function(resourceType, config) {
    check(resourceType, String);
    check(config, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    var eligibleTypes = ['Patient', 'ImagingStudy', 'DiagnosticReport', 'Encounter'];
    if (eligibleTypes.indexOf(resourceType) === -1) {
      throw new Meteor.Error('invalid-resource', 'Resource type ' + resourceType + ' is not FHIRcast-eligible. Must be one of: ' + eligibleTypes.join(', '));
    }

    // Validate events if provided
    if (config.events && Array.isArray(config.events)) {
      var invalidEvents = config.events.filter(function(evt) {
        return AllLifecycleEvents.indexOf(evt) === -1;
      });
      if (invalidEvents.length > 0) {
        throw new Meteor.Error('invalid-events', 'Invalid lifecycle events: ' + invalidEvents.join(', '));
      }
    }

    var settingsPath = 'settings.private.fhir.rest.' + resourceType + '.fhircast';
    console.log('[fhircast.setResourceFhircast] Updating', settingsPath, config);

    set(Meteor, settingsPath, config);

    return config;
  },

  /**
   * Forward event publication to hub
   * @param {String} hubUrl - The hub URL
   * @param {Object} eventData - Event to publish
   * @returns {Object} Response from the hub
   */
  'fhircast.publishEvent': async function(hubUrl, eventData) {
    check(hubUrl, String);
    check(eventData, Object);

    if (!this.userId && this.connection) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    console.log('[fhircast.publishEvent] Publishing event to hub:', hubUrl);

    var hubSuccess = false;
    var hubStatus = null;

    try {
      var response = await fetch(hubUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      hubStatus = response.status;
      hubSuccess = hubStatus >= 200 && hubStatus < 300;
      console.log('[fhircast.publishEvent] Hub response status:', hubStatus);
    } catch (error) {
      console.warn('[fhircast.publishEvent] Hub unreachable:', error.message);
    }

    // Always store the event via DDP so clients receive it regardless of hub status
    try {
      await FhircastEvents.insertAsync(Object.assign({}, sanitizeDottedKeys(eventData), {
        _receivedAt: new Date().toISOString(),
        _source: 'server-bridge'
      }));
      console.log('[fhircast.publishEvent] Event stored in FhircastEvents collection');
    } catch (insertError) {
      console.error('[fhircast.publishEvent] Failed to store event:', insertError.message);
    }

    return {
      success: hubSuccess,
      status: hubStatus,
      timestamp: new Date().toISOString()
    };
  }
});

// =============================================================================
// PUBLICATIONS
// =============================================================================

Meteor.publish('fhircast.events', async function() {
  var self = this;

  var handle = await FhircastEvents.find({}, {
    sort: { _receivedAt: -1 },
    limit: 200
  }).observeChanges({
    added: function(id, fields) {
      self.added('FhircastEvents', id, sanitizeDottedKeys(fields));
    },
    changed: function(id, fields) {
      self.changed('FhircastEvents', id, sanitizeDottedKeys(fields));
    },
    removed: function(id) {
      self.removed('FhircastEvents', id);
    }
  });

  self.ready();
  self.onStop(function() {
    handle.stop();
  });
});

console.log('[fhircast-module] Server methods registered');

import './clientEndpoint.js';

// Register FHIRcast hub HTTP endpoint
import './hub.js';
