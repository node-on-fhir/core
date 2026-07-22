// server/rpc/JsonRpcEndpoint.js
// POST /api/rpc — JSON-RPC 2.0 over Streamable HTTP (MCP-shaped), Task 4.
//
// Unary: application/json response. Streaming (method declares
// streaming:true AND the client sends Accept: text/event-stream): SSE frames —
// rpc.progress notifications per context.emit(), final frame is the response
// object. Batch: array body (cap settings.private.rpc.batchLimit, default
// 20), always HTTP 200 with per-item results; streaming methods rejected per
// item. Notifications (no id): executed, 204 empty response (spec-required).
//
// Mounted via WebApp.connectHandlers (the a2a-route idiom). Kill switch:
// settings.private.rpc.enabled === false leaves this endpoint unmounted
// entirely — the DDP shim keeps every method callable.
//
// SSE proxy notes (Galaxy/nginx): X-Accel-Buffering: no disables proxy
// buffering; each frame is written + flushed individually. Keep-alive is the
// platform default; long streams should emit progress at least every ~30s or
// the proxy may reap the socket.

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';
import ServerMethods from '/imports/lib/ServerMethods.js';
import Core from '/imports/lib/ServerMethodsCore.js';
import { resolveRpcAuth } from './RpcAuth.js';

const log = (Meteor.Logger ? Meteor.Logger.for('JsonRpcEndpoint') : console);

const MAX_BODY_BYTES = 1024 * 1024;   // 1 MB

function readBody(req) {
  return new Promise(function(resolve, reject) {
    let size = 0;
    const chunks = [];
    req.on('data', function(chunk) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body-too-large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', function() { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

function rpcErrorResponse(id, code, message, data) {
  const error = { code: code, message: message };
  if (data !== undefined) { error.data = data; }
  return { jsonrpc: '2.0', id: id === undefined ? null : id, error: error };
}

function isValidRequestShape(request) {
  return request && typeof request === 'object' && !Array.isArray(request) &&
    request.jsonrpc === '2.0' && typeof request.method === 'string' &&
    (request.params === undefined || (typeof request.params === 'object' && request.params !== null && !Array.isArray(request.params)));
}

// Run one JSON-RPC request object through the pipeline; returns a response
// object, or null for notifications (no id -> no response body).
async function runSingle(request, authContext, req) {
  const isNotification = !('id' in request);
  const id = request.id;

  if (!isValidRequestShape(request)) {
    return isNotification ? null : rpcErrorResponse(id, -32600, 'Invalid Request');
  }

  const entry = ServerMethods.get(request.method);
  if (!entry) {
    return isNotification ? null : rpcErrorResponse(id, -32601, 'Method not found: ' + request.method);
  }
  if (entry.viaAlias && get(Meteor, 'settings.private.rpc.deprecationWarnings') !== false) {
    log.warn('DEPRECATED method name over HTTP', { requested: request.method, canonical: entry.name });
  }

  const context = {
    userId: authContext.userId,
    scopes: authContext.scopes,
    role: authContext.role,
    transport: 'http',
    ip: get(req, 'headers.x-forwarded-for', req.socket && req.socket.remoteAddress),
    userAgent: get(req, 'headers.user-agent')
  };

  try {
    const result = await ServerMethods.runPipeline(entry, request.params || {}, context);
    return isNotification ? null : { jsonrpc: '2.0', id: id, result: result === undefined ? null : result };
  } catch (error) {
    if (isNotification) {
      log.warn('Notification handler threw (no response per spec)', { method: request.method, error: error.error || error.message });
      return null;
    }
    return { jsonrpc: '2.0', id: id, error: Core.meteorErrorToRpcError(error) };
  }
}

async function handleStreaming(request, entry, authContext, req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  const writeFrame = function(payload) {
    res.write('data: ' + JSON.stringify(payload) + '\n\n');
    if (typeof res.flush === 'function') { res.flush(); }
  };

  const context = {
    userId: authContext.userId,
    scopes: authContext.scopes,
    role: authContext.role,
    transport: 'http',
    ip: get(req, 'headers.x-forwarded-for', req.socket && req.socket.remoteAddress),
    userAgent: get(req, 'headers.user-agent'),
    emit: function(progress) {
      writeFrame({ jsonrpc: '2.0', method: 'rpc.progress', params: { id: request.id, progress: progress } });
    }
  };

  try {
    const result = await ServerMethods.runPipeline(entry, request.params || {}, context);
    writeFrame({ jsonrpc: '2.0', id: request.id, result: result === undefined ? null : result });
  } catch (error) {
    writeFrame({ jsonrpc: '2.0', id: request.id, error: Core.meteorErrorToRpcError(error) });
  }
  res.end();
}

if (get(Meteor, 'settings.private.rpc.enabled', true) !== false) {
  WebApp.connectHandlers.use('/api/rpc', async function(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json', 'Allow': 'POST' });
      res.end(JSON.stringify(rpcErrorResponse(null, -32600, 'POST required')));
      return;
    }

    // The app installs a global bodyParser.json on WebApp.handlers
    // (FhirEndpoints.js) which runs BEFORE this route and consumes the
    // request stream — prefer the pre-parsed req.body; fall back to reading
    // the stream only when no upstream parser touched it (e.g. mismatched
    // content-type). Malformed JSON with a json content-type is rejected by
    // the upstream parser as a plain 400 before reaching here.
    let parsed;
    if (req.body !== undefined && req.body !== null && typeof req.body === 'object') {
      parsed = req.body;
    } else {
      try {
        const raw = await readBody(req);
        parsed = JSON.parse(raw);
      } catch (parseError) {
        const status = parseError.message === 'body-too-large' ? 413 : 400;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rpcErrorResponse(null, -32700, 'Parse error')));
        return;
      }
    }

    let authContext;
    try {
      authContext = await resolveRpcAuth(req);
    } catch (authError) {
      log.error('resolveRpcAuth threw unexpectedly', { message: authError.message });
      authContext = { userId: null, scopes: [], via: null };
    }

    // ---- Batch
    if (Array.isArray(parsed)) {
      const batchLimit = get(Meteor, 'settings.private.rpc.batchLimit', 20);
      if (parsed.length === 0 || parsed.length > batchLimit) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rpcErrorResponse(null, -32600, 'Batch size must be 1..' + batchLimit)));
        return;
      }
      const responses = [];
      for (const item of parsed) {
        const entry = isValidRequestShape(item) ? ServerMethods.get(item.method) : null;
        if (entry && entry.options.streaming === true) {
          if ('id' in item) {
            responses.push(rpcErrorResponse(item.id, -32600, 'Streaming methods cannot be batched'));
          }
          continue;
        }
        const response = await runSingle(item, authContext, req);
        if (response) { responses.push(response); }
      }
      if (responses.length === 0) {
        res.writeHead(204);
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responses));
      return;
    }

    // ---- Single request
    if (!isValidRequestShape(parsed)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rpcErrorResponse(get(parsed, 'id'), -32600, 'Invalid Request')));
      return;
    }

    const entry = ServerMethods.get(parsed.method);
    const wantsStream = String(get(req, 'headers.accept', '')).includes('text/event-stream');
    if (entry && entry.options.streaming === true && wantsStream && ('id' in parsed)) {
      await handleStreaming(parsed, entry, authContext, req, res);
      return;
    }

    const response = await runSingle(parsed, authContext, req);
    if (!response) {
      res.writeHead(204);
      res.end();
      return;
    }
    const status = response.error ? Core.httpStatusForRpcCode(response.error.code) : 200;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  });
  log.info('JSON-RPC endpoint mounted', { path: '/api/rpc' });
} else {
  log.warn('JSON-RPC endpoint DISABLED via settings.private.rpc.enabled=false (DDP shim remains active)');
}
