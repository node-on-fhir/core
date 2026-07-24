// tests/rpc/lib/rpcClient.mjs
//
// Minimal JSON-RPC test client for the Stage-1 RPC method tests
// (docs/RPC-TESTING.md). Pure node — no npm dependencies, runnable on a bare
// checkout against any booted server. The server must be in dev/TEST_RUN mode
// so the rpcTest.* fixtures (incl. rpcTest.mintLoginToken) are registered —
// which is how every CI boot runs.
//
//   RPC_BASE_URL=http://localhost:3000   (default)

const BASE_URL = process.env.RPC_BASE_URL || 'http://localhost:3000';
const RPC_URL = BASE_URL + '/api/rpc';

let nextId = 1;
let cachedToken = null;

// Low-level call: returns the full JSON-RPC envelope ({ result } | { error })
// plus the HTTP status. Never throws on an RPC-level error — tests assert on
// the envelope. Throws only on transport failure/timeout.
export async function rpcEnvelope(method, params, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 10000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (options.token) { headers['Authorization'] = 'Bearer ' + options.token; }
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params: params || {} }),
      signal: controller.signal
    });
    const body = await response.json();
    return { status: response.status, ...body };
  } finally {
    clearTimeout(timer);
  }
}

// Convenience: return result, throw an Error carrying the rpc error otherwise.
export async function rpcCall(method, params, options = {}) {
  const envelope = await rpcEnvelope(method, params, options);
  if (envelope.error) {
    const e = new Error(method + ' → ' + envelope.error.code + ' ' + envelope.error.message);
    e.rpcError = envelope.error;
    throw e;
  }
  return envelope.result;
}

// Mint (and cache) a real Meteor login token via the test fixture.
export async function mintToken() {
  if (cachedToken) { return cachedToken; }
  const result = await rpcCall('rpcTest.mintLoginToken');
  cachedToken = result.token;
  return cachedToken;
}

// The live OpenRPC document — what is ACTUALLY registered on this boot
// (more truthful than the committed docs/openrpc.json snapshot).
export async function discover() {
  const result = await rpcCall('rpc.discover');
  return result.methods;
}

export { BASE_URL, RPC_URL };
