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

// rpc-migration (feat/json-rpc): Meteor.methods -> Meteor.ServerMethods.define
// (npmPackages exemplar — GLOBAL registry). Names were already dotted/canonical.
// FHIRcast carries session/subscription CONTEXT (topic ids, hub URLs, context
// events) — not clinical resource bodies — so phi:false throughout; posture
// preserved. requireAuth: getStatus is a guard-less public probe →
// requireAuth:false; publishEvent keeps its special posture (see its note); the
// rest had `if (!this.userId)` guards → default requireAuth (true). this.userId
// -> context.userId. Publications + the trailing hub/endpoint imports untouched.
Meteor.ServerMethods.define('fhircast.getStatus', {
  description: 'Report FHIRcast module name, version, and status',
  // Public read-only status probe (guard-less pre-migration).
  requireAuth: false
}, async function() {
    console.log('[fhircast.getStatus] Checking status');

    return {
      name: 'fhircast-module',
      version: '0.1.0',
      status: 'active',
      timestamp: new Date().toISOString()
    };
});

/**
 * Forward subscription request to external FHIRcast hub
 */
Meteor.ServerMethods.define('fhircast.subscribe', {
  description: 'Forward a subscription request to an external FHIRcast hub',
  positionalParams: ['hubUrl', 'subscriptionData', 'authorization'],
  schemaObject: {
    type: 'object',
    properties: {
      hubUrl: { type: 'string' },
      subscriptionData: { type: 'object' },
      authorization: { type: ['string', 'null'] }
    },
    required: ['hubUrl', 'subscriptionData']
  }
  // requireAuth default (true) replaces the `if (!this.userId)` guard.
}, async function(params, context) {
    const hubUrl = get(params, 'hubUrl');
    const subscriptionData = get(params, 'subscriptionData');
    const authorization = get(params, 'authorization');
    check(hubUrl, String);
    check(subscriptionData, Object);
    check(authorization, Match.Maybe(String));

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
});

/**
 * Forward unsubscribe request to external FHIRcast hub
 */
Meteor.ServerMethods.define('fhircast.unsubscribe', {
  description: 'Forward an unsubscribe request to an external FHIRcast hub',
  positionalParams: ['hubUrl', 'subscriptionData', 'authorization'],
  schemaObject: {
    type: 'object',
    properties: {
      hubUrl: { type: 'string' },
      subscriptionData: { type: 'object' },
      authorization: { type: ['string', 'null'] }
    },
    required: ['hubUrl', 'subscriptionData']
  }
  // requireAuth default (true) replaces the `if (!this.userId)` guard.
}, async function(params, context) {
    const hubUrl = get(params, 'hubUrl');
    const subscriptionData = get(params, 'subscriptionData');
    const authorization = get(params, 'authorization');
    check(hubUrl, String);
    check(subscriptionData, Object);
    check(authorization, Match.Maybe(String));

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
});

/**
 * Check hub status by sending a status request
 */
Meteor.ServerMethods.define('fhircast.getHubStatus', {
  description: 'Query a FHIRcast hub for its status',
  positionalParams: ['hubUrl'],
  schemaObject: { type: 'object', properties: { hubUrl: { type: 'string' } }, required: ['hubUrl'] }
  // requireAuth default (true) replaces the `if (!this.userId)` guard.
}, async function(params, context) {
    const hubUrl = get(params, 'hubUrl');
    check(hubUrl, String);

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
});

/**
 * Get FHIRcast publish config for all eligible resource types
 */
Meteor.ServerMethods.define('fhircast.getPublishConfig', {
  description: 'Read the FHIRcast publish config for all eligible resource types'
  // requireAuth default (true) replaces the `if (!this.userId)` guard.
}, async function(params, context) {
    console.log('[fhircast.getPublishConfig] Reading publish config');

    var eligibleTypes = ['Patient', 'ImagingStudy', 'DiagnosticReport', 'Encounter'];
    var config = {};

    eligibleTypes.forEach(function(resourceType) {
      var fhircastConfig = get(Meteor, 'settings.private.fhir.rest.' + resourceType + '.fhircast', null);
      config[resourceType] = fhircastConfig || { publish: false, events: [] };
    });

    return config;
});

Meteor.ServerMethods.define('fhircast.setTopic', {
  description: 'Set the active FHIRcast topic (in-memory settings)',
  positionalParams: ['topic'],
  schemaObject: { type: 'object', properties: { topic: { type: 'string' } }, required: ['topic'] }
  // requireAuth default (true) replaces the `if (!this.userId)` guard.
}, async function(params, context) {
    const topic = get(params, 'topic');
    check(topic, String);

    console.log('[fhircast.setTopic] Setting topic:', topic);
    set(Meteor, 'settings.public.fhircast.topic', topic);

    return { topic: topic };
});

Meteor.ServerMethods.define('fhircast.setTopicMode', {
  description: 'Set the active FHIRcast topic mode (in-memory settings)',
  positionalParams: ['mode'],
  schemaObject: { type: 'object', properties: { mode: { type: 'string' } }, required: ['mode'] }
  // requireAuth default (true) replaces the `if (!this.userId)` guard.
}, async function(params, context) {
    const mode = get(params, 'mode');
    check(mode, String);

    console.log('[fhircast.setTopicMode] Setting topic mode:', mode);
    set(Meteor, 'settings.public.fhircast.topicMode', mode);

    return { topicMode: mode };
});

Meteor.ServerMethods.define('fhircast.setResourceFhircast', {
  description: 'Set FHIRcast publish config for one eligible resource type (in-memory settings)',
  positionalParams: ['resourceType', 'config'],
  schemaObject: {
    type: 'object',
    properties: { resourceType: { type: 'string' }, config: { type: 'object' } },
    required: ['resourceType', 'config']
  }
  // requireAuth default (true) replaces the `if (!this.userId)` guard.
}, async function(params, context) {
    const resourceType = get(params, 'resourceType');
    const config = get(params, 'config');
    check(resourceType, String);
    check(config, Object);

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
});

/**
 * Forward event publication to hub
 */
Meteor.ServerMethods.define('fhircast.publishEvent', {
  description: 'Publish a FHIRcast context event to a hub and store it for DDP clients',
  positionalParams: ['hubUrl', 'eventData'],
  schemaObject: {
    type: 'object',
    properties: { hubUrl: { type: 'string' }, eventData: { type: 'object' } },
    required: ['hubUrl', 'eventData']
  },
  // SPECIAL POSTURE PRESERVED: the original guard was
  // `if (!this.userId && this.connection)` — it allowed connection-less
  // server-side (bridge) calls to proceed unauthenticated while requiring a
  // logged-in user for DDP-connected callers. The ServerMethods requireAuth
  // gate can't express "only when there IS a connection", so we set
  // requireAuth:false and re-enforce the original condition inside the handler
  // via context.transport/connection. Flagged for security review.
  requireAuth: false
}, async function(params, context) {
    const hubUrl = get(params, 'hubUrl');
    const eventData = get(params, 'eventData');
    check(hubUrl, String);
    check(eventData, Object);

    // Preserve original posture: connection-bound (DDP) callers must be logged
    // in; connection-less server-bridge invocations (transport 'server') may
    // proceed. The ServerMethods context uses transport==='ddp' for the old
    // `this.connection` truthiness.
    if (!context.userId && get(context, 'transport') === 'ddp') {
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
