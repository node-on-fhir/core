// npmPackages/fhircast/server/clientEndpoint.js
//
// POST /client — Receive forwarded FHIRcast events from the hub
//
// Uses WebApp.rawConnectHandlers so this runs BEFORE Meteor's body-parsing
// middleware, which avoids the 503 caused by req.on('data') never firing
// when the body has already been consumed.

import { WebApp } from 'meteor/webapp';
import { FhircastEvents } from '../lib/FhircastEvents';
import { sanitizeDottedKeys } from '../lib/sanitize.js';

WebApp.rawConnectHandlers.use('/client', function(req, res, next) {
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

  // If body was already parsed by middleware, use it directly
  if (req.body) {
    handleBody(req.body, res);
    return;
  }

  // Otherwise read the raw body from the stream
  var bodyStr = '';
  req.on('data', function(chunk) { bodyStr += chunk; });
  req.on('end', function() {
    try {
      var body = JSON.parse(bodyStr);
      handleBody(body, res);
    } catch (err) {
      console.error('[fhircast-client] JSON parse error:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

async function handleBody(body, res) {
  try {
    console.log('[fhircast-client] Received event:', JSON.stringify(body).substring(0, 200));

    await FhircastEvents.insertAsync(Object.assign({}, sanitizeDottedKeys(body), {
      _receivedAt: new Date().toISOString(),
      _source: 'hub-callback'
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } catch (err) {
    console.error('[fhircast-client] Error storing event:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

console.log('[fhircast-client] Client endpoint registered at POST /client (rawConnectHandlers)');
