// imports/lib/rpcClient.js
// Client caller for the ServerMethods registry (Task 5): rpc() / rpcStream().
//
// Browser: fetch POST /api/rpc with the Meteor login token as bearer
// (Accounts._storedLoginToken()). JSON-RPC errors rehydrate to Meteor.Error
// via ServerMethodsCore.rpcErrorToMeteorErrorArgs, so existing
// `catch (error) { error.error === 'not-authorized' }` code keeps working.
//
// Server: rpc()/rpcStream() route through ServerMethods.invoke in-process —
// no HTTP self-call (the plan's preferred server->server orchestration path;
// callers wanting a real user context pass it explicitly via invoke()).
//
// Registered as Meteor.rpc / Meteor.rpcStream (both sides) in
// imports/startup/both/rpcClientSetup.js so packages call without
// app-absolute imports.

import { Meteor } from 'meteor/meteor';
import Core from './ServerMethodsCore.js';

// Plain counter — per-tab uniqueness is sufficient for request ids.
let requestCounter = 0;

function nextId() {
  requestCounter = requestCounter + 1;
  return requestCounter;
}

function bearerHeaders(extra) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, extra);
  try {
    // Populated in the browser after login; absent server-side / logged out
    const token = (typeof Accounts !== 'undefined' && typeof Accounts._storedLoginToken === 'function')
      ? Accounts._storedLoginToken()
      : null;
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
  } catch (tokenError) {
    // stay unauthenticated — the server pipeline decides
  }
  return headers;
}

function throwRehydrated(rpcError) {
  const args = Core.rpcErrorToMeteorErrorArgs(rpcError);
  throw new Meteor.Error(args.error, args.reason, args.details);
}

async function rpcHttp(name, params) {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: bearerHeaders(),
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId(), method: name, params: params || {} })
  });
  const body = await response.json();
  if (body.error) {
    throwRehydrated(body.error);
  }
  return body.result;
}

async function rpcStreamHttp(name, params, options) {
  const onProgress = (options && options.onProgress) || function() {};
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: bearerHeaders({ 'Accept': 'text/event-stream' }),
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId(), method: name, params: params || {} })
  });

  // Non-SSE response: unary fallback (method not streaming, or an error)
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    const body = await response.json();
    if (body.error) {
      throwRehydrated(body.error);
    }
    return body.result;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult;
  let finalError = null;

  // SSE frames: "data: {json}\n\n"
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    buffer += decoder.decode(chunk.value, { stream: true });
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const dataLine = frame.split('\n').find(function(line) { return line.startsWith('data: '); });
      if (dataLine) {
        const payload = JSON.parse(dataLine.slice(6));
        if (payload.method === 'rpc.progress') {
          onProgress(payload.params && payload.params.progress);
        } else if (payload.error) {
          finalError = payload.error;
        } else {
          finalResult = payload.result;
        }
      }
      boundary = buffer.indexOf('\n\n');
    }
  }
  if (finalError) {
    throwRehydrated(finalError);
  }
  return finalResult;
}

async function rpcServer(name, params) {
  // In-process, no HTTP hop. Trusted server context (userId null) — pass an
  // explicit context through ServerMethods.invoke directly when needed.
  return await Meteor.ServerMethods.invoke(name, params, { userId: null, transport: 'server' });
}

async function rpc(name, params) {
  if (Meteor.isServer) {
    return await rpcServer(name, params);
  }
  return await rpcHttp(name, params);
}

async function rpcStream(name, params, options) {
  if (Meteor.isServer) {
    // Progress is dropped server-side (no stream transport in-process)
    return await rpcServer(name, params);
  }
  return await rpcStreamHttp(name, params, options);
}

export { rpc, rpcStream };
