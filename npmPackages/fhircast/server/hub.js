// npmPackages/fhircast-module/server/hub.js
//
// FHIRcast Hub HTTP Endpoint (STU3)
// Accepts subscription/unsubscription requests and stores them in memory.

import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import { FhircastEvents } from '../lib/FhircastEvents';

// =============================================================================
// HELPERS
// =============================================================================

function sanitizeDottedKeys(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeDottedKeys);
  var result = {};
  Object.keys(obj).forEach(function(key) {
    var safeKey = key.replace(/\./g, '_');
    result[safeKey] = sanitizeDottedKeys(obj[key]);
  });
  return result;
}

// =============================================================================
// IN-MEMORY SUBSCRIPTION STORE
// =============================================================================

// Map<topic, Array<{ subscriber, events, channelType, createdAt }>>
const subscriptions = new Map();

// =============================================================================
// OPTIONS /api/hub — CORS preflight
// =============================================================================

WebApp.handlers.use('/api/hub', function(req, res, next) {
  if (req.method === 'OPTIONS') {
    console.log('[fhircast-hub] OPTIONS /api/hub — CORS preflight');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.writeHead(204);
    res.end();
    return;
  }
  next();
});

// =============================================================================
// POST /api/hub — Subscribe / Unsubscribe
// =============================================================================

WebApp.handlers.post('/api/hub', async function(req, res) {
  console.log('[fhircast-hub] POST /api/hub');
  console.log('[fhircast-hub] Content-Type:', req.headers['content-type']);
  console.log('[fhircast-hub] Body:', JSON.stringify(req.body));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  var body = req.body || {};

  var mode = body['hub.mode'];
  var topic = body['hub.topic'];
  var events = body['hub.events'];
  var channelType = body['hub.channel.type'] || 'websocket';

  console.log('[fhircast-hub] mode:', mode);
  console.log('[fhircast-hub] topic:', topic);
  console.log('[fhircast-hub] events:', events);
  console.log('[fhircast-hub] channelType:', channelType);

  // Detect FHIRcast event notification (no hub.mode, has event.hub.topic)
  if (!mode && body.event && body.event['hub.topic']) {
    var eventTopic = body.event['hub.topic'];
    var eventName = body.event['hub.event'];
    console.log('[fhircast-hub] Event notification received:', eventName, 'topic:', eventTopic);
    console.log('[fhircast-hub] Subscribers for topic:', (subscriptions.get(eventTopic) || []).length);

    // Store in FhircastEvents so it appears via DDP on the publish page
    FhircastEvents.insertAsync(Object.assign({}, sanitizeDottedKeys(body), {
      _receivedAt: new Date().toISOString(),
      _source: 'hub-received'
    }));

    // Forward to subscribers
    var topicSubscribers = subscriptions.get(eventTopic) || [];
    topicSubscribers.forEach(function(sub) {
      if (sub.callback) {
        try {
          fetch(sub.callback, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }).then(function(resp) {
            console.log('[fhircast-hub] Forwarded to', sub.callback, '— status:', resp.status);
          }).catch(function(err) {
            console.warn('[fhircast-hub] Forward failed to', sub.callback, ':', err.message);
          });
        } catch (err) {
          console.warn('[fhircast-hub] Forward error:', err.message);
        }
      }
    });

    // Forward to WebSocket clients
    topicSubscribers.forEach(function(sub) {
      if (sub.channelEndpoint) {
        var endpointId = sub.channelEndpoint;
        var bindIdx = endpointId.lastIndexOf('/bind/');
        if (bindIdx !== -1) {
          endpointId = endpointId.substring(bindIdx + 6);
        }
        if (connectedClients.has(endpointId)) {
          try {
            var clientWs = connectedClients.get(endpointId);
            if (clientWs.readyState === 1) { // WebSocket.OPEN
              clientWs.send(JSON.stringify(body));
            }
            console.log('[fhircast-hub] Forwarded via WS to endpoint:', endpointId);
          } catch (err) {
            console.warn('[fhircast-hub] WS forward error:', err.message);
          }
        }
      }
    });

    // Fallback: check for clients connected by topic (from /ws/fhircast/{topic} paths)
    if (connectedClients.has(eventTopic)) {
      try {
        var topicWs = connectedClients.get(eventTopic);
        if (topicWs.readyState === 1) {
          topicWs.send(JSON.stringify(body));
          console.log('[fhircast-hub] Forwarded via WS to topic-keyed client:', eventTopic);
        }
      } catch (err) {
        console.warn('[fhircast-hub] WS topic-forward error:', err.message);
      }
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'received',
      'hub.topic': eventTopic,
      'hub.event': eventName,
      subscribers: (subscriptions.get(eventTopic) || []).length,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Validate required fields
  if (!mode) {
    console.warn('[fhircast-hub] Missing hub.mode');
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Missing required field: hub.mode' }));
    return;
  }

  if (!topic) {
    console.warn('[fhircast-hub] Missing hub.topic');
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Missing required field: hub.topic' }));
    return;
  }

  // ---------------------------------------------------------------------------
  // SUBSCRIBE
  // ---------------------------------------------------------------------------
  if (mode === 'subscribe') {
    if (!events) {
      console.warn('[fhircast-hub] Missing hub.events for subscribe');
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing required field: hub.events' }));
      return;
    }

    var eventsArray = Array.isArray(events) ? events : String(events).split(',').map(function(e) { return e.trim(); });

    var subscriber = {
      callback: body['hub.callback'] || null,
      events: eventsArray,
      channelType: channelType,
      channelEndpoint: body['hub.channel.endpoint'] || null,
      createdAt: new Date().toISOString()
    };

    if (!subscriptions.has(topic)) {
      subscriptions.set(topic, []);
    }
    subscriptions.get(topic).push(subscriber);

    console.log('[fhircast-hub] Subscription stored for topic:', topic, '— events:', eventsArray.join(', '));
    console.log('[fhircast-hub] Total topics:', subscriptions.size, '— subscribers for this topic:', subscriptions.get(topic).length);

    var wsEndpoint = body['hub.channel.endpoint'] || 'ws://localhost:' + (process.env.PORT || '3100') + '/bind/' + encodeURIComponent(topic);

    res.writeHead(202);
    res.end(JSON.stringify({
      'hub.channel.endpoint': wsEndpoint,
      'hub.topic': topic,
      'hub.events': eventsArray,
      'hub.mode': 'subscribe',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // ---------------------------------------------------------------------------
  // UNSUBSCRIBE
  // ---------------------------------------------------------------------------
  if (mode === 'unsubscribe') {
    if (subscriptions.has(topic)) {
      var before = subscriptions.get(topic).length;
      // Remove last subscriber for this topic (simple strategy)
      subscriptions.get(topic).pop();
      if (subscriptions.get(topic).length === 0) {
        subscriptions.delete(topic);
      }
      console.log('[fhircast-hub] Unsubscribed from topic:', topic, '— was:', before, 'now:', (subscriptions.get(topic) || []).length);
    } else {
      console.log('[fhircast-hub] No subscriptions found for topic:', topic);
    }

    res.writeHead(202);
    res.end(JSON.stringify({
      'hub.mode': 'unsubscribe',
      'hub.topic': topic,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // ---------------------------------------------------------------------------
  // UNKNOWN MODE
  // ---------------------------------------------------------------------------
  console.warn('[fhircast-hub] Unknown hub.mode:', mode);
  res.writeHead(400);
  res.end(JSON.stringify({ error: 'Unknown hub.mode: ' + mode + '. Expected "subscribe" or "unsubscribe".' }));
});

// =============================================================================
// GET /api/hub — Status / Discovery
// =============================================================================

WebApp.handlers.get('/api/hub', async function(req, res) {
  console.log('[fhircast-hub] GET /api/hub — status request');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  var topicDetails = {};
  var totalSubscribers = 0;

  subscriptions.forEach(function(subscribers, topic) {
    topicDetails[topic] = subscribers.map(function(sub) {
      return {
        events: sub.events,
        channelType: sub.channelType,
        createdAt: sub.createdAt
      };
    });
    totalSubscribers += subscribers.length;
  });

  var response = {
    status: 'active',
    hub: 'FHIRcast STU3 Hub',
    version: '0.1.0',
    totalTopics: subscriptions.size,
    totalSubscribers: totalSubscribers,
    topics: topicDetails,
    timestamp: new Date().toISOString()
  };

  res.writeHead(200);
  res.end(JSON.stringify(response, null, 2));
});

// =============================================================================
// POST /client — Receive forwarded FHIRcast events
// =============================================================================

WebApp.handlers.use('/client', function(req, res, next) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return next();
  }

  var bodyStr = '';
  req.on('data', function(chunk) { bodyStr += chunk; });
  req.on('end', async function() {
    try {
      var body = JSON.parse(bodyStr);
      console.log('[fhircast-client] Received event:', JSON.stringify(body).substring(0, 200));

      await FhircastEvents.insertAsync(Object.assign({}, sanitizeDottedKeys(body), {
        _receivedAt: new Date().toISOString(),
        _source: 'hub-callback'
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } catch (err) {
      console.error('[fhircast-client] Error:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

// =============================================================================
// WEBSOCKET SERVER for /bind endpoint
// =============================================================================

var connectedClients = new Map();
Meteor.startup(function() {
  console.log('[fhircast-ws] Meteor.startup fired — scheduling gatekeeper installation');
  setTimeout(function() {
    try {
      var server = WebApp.httpServer;
      var WebSocketServer = require('ws').Server;
      var wss = new WebSocketServer({ noServer: true });

      // Capture all existing upgrade listeners (Meteor DDP, SockJS, etc.)
      var existingListeners = server.listeners('upgrade').slice();
      console.log('[fhircast-ws] Captured', existingListeners.length, 'existing upgrade listener(s) (deferred)');

      // Remove them all
      server.removeAllListeners('upgrade');

      // Single gatekeeper listener
      server.on('upgrade', function(req, socket, head) {
        console.log('[fhircast-ws] Upgrade request received, url:', req.url);

        // Match /bind/{id}, /fhir-proxy/bind/{id}, OR /ws/fhircast/{topic}
        var bindMatch = req.url.match(/(?:^|\/fhir-proxy)(\/bind\/.+)/);
        var fhircastMatch = !bindMatch && req.url.match(/^\/ws\/fhircast\/(.+)/);
        if (bindMatch || fhircastMatch) {
          var endpoint;
          if (bindMatch) {
            var bindPath = bindMatch[1];  // '/bind/{id}'
            endpoint = bindPath.replace('/bind/', '');
          } else {
            endpoint = decodeURIComponent(fhircastMatch[1]);
          }
          console.log('[fhircast-ws] Upgrade request for endpoint:', endpoint);

          wss.handleUpgrade(req, socket, head, function(ws) {
            connectedClients.set(endpoint, ws);
            console.log('[fhircast-ws] Client connected, endpoint:', endpoint);

            ws.send(JSON.stringify({ bound: true }));

            ws.on('message', function(data) {
              console.log('[fhircast-ws] Received data from client, endpoint:', endpoint, 'bytes:', data.length);
            });
            ws.on('close', function() {
              connectedClients.delete(endpoint);
              console.log('[fhircast-ws] Client disconnected:', endpoint);
            });
            ws.on('error', function(err) {
              console.warn('[fhircast-ws] Socket error:', err.message);
              connectedClients.delete(endpoint);
            });
          });
          return; // Do NOT forward to other handlers
        }

        // === Everything else: forward to original listeners (DDP, etc.) ===
        for (var i = 0; i < existingListeners.length; i++) {
          existingListeners[i].call(server, req, socket, head);
        }
      });

      console.log('[fhircast-ws] WebSocket upgrade handler installed (gatekeeper pattern, deferred)');
      console.log('[fhircast-ws] Total upgrade listeners now:', server.listenerCount('upgrade'));
    } catch (err) {
      console.error('[fhircast-ws] FATAL: Gatekeeper installation failed:', err);
    }
  }, 500);
});

// =============================================================================
// SUBSCRIPTION QUERY — for in-process consumers (e.g. FhircastBridge)
// =============================================================================

/**
 * Return all topics that have at least one subscriber listening for `eventName`.
 *
 * @param {string} eventName - e.g. "diagnosticreport-open"
 * @returns {string[]} list of topic strings
 */
export function getSubscribedTopicsForEvent(eventName) {
  var topics = [];
  subscriptions.forEach(function(subscribers, topic) {
    var hasEvent = subscribers.some(function(sub) {
      return sub.events.includes(eventName);
    });
    if (hasEvent) {
      topics.push(topic);
    }
  });
  return topics;
}

// =============================================================================
// STARTUP LOG
// =============================================================================

console.log('[fhircast-hub] Hub endpoint registered at POST /api/hub');
console.log('[fhircast-hub] Hub status available at GET /api/hub');
console.log('[fhircast-hub] Client endpoint registered at POST /client');
