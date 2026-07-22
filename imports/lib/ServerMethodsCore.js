// imports/lib/ServerMethodsCore.js
// Transport-neutral method-registry core. Plain CJS, zero Meteor imports —
// testable with `node --test` (npm run test:rpc). Meteor wiring (pipeline,
// DDP shim, Meteor.ServerMethods) lives in ServerMethods.js.
//
// Error-code contract (spec Decision 7): Meteor.Error <-> JSON-RPC error is
// lossless via error.data {error, reason, details}; reserved codes per the
// JSON-RPC 2.0 spec; app errors -32000..-32099. Non-Meteor throws map to
// -32603 with NO detail leak.

const NAME_RE = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/;
const CODE_FOR_ERROR = { 'not-authorized': -32001, 'feature-disabled': -32002, 'not-found': -32004, 'validation-failed': -32602 };
const STATUS_FOR_CODE = { '-32001': 403, '-32602': 400, '-32600': 400, '-32700': 400, '-32601': 404 };

function validateMethodName(name) {
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    return { valid: false, reason: 'method name must be dotted lower-camel resource.action, got: ' + name };
  }
  return { valid: true };
}

function createRegistry() {
  const methods = {};   // canonical name -> {name, options, handler}
  const aliases = {};   // alias -> canonical name
  return {
    define: function(name, options, handler) {
      const check = validateMethodName(name);
      if (!check.valid) { throw new Error('[ServerMethods] invalid name: ' + check.reason); }
      if (methods[name] || aliases[name]) { throw new Error('[ServerMethods] ' + name + ' already defined'); }
      const opts = Object.assign({ requireAuth: true, streaming: false, phi: false, aliases: [] }, options);
      methods[name] = { name: name, options: opts, handler: handler };
      opts.aliases.forEach(function(alias) {
        if (methods[alias] || aliases[alias]) { throw new Error('[ServerMethods] alias collision: ' + alias); }
        aliases[alias] = name;
      });
      return methods[name];
    },
    get: function(nameOrAlias) {
      if (methods[nameOrAlias]) { return Object.assign({ viaAlias: false }, methods[nameOrAlias]); }
      if (aliases[nameOrAlias]) { return Object.assign({ viaAlias: true }, methods[aliases[nameOrAlias]]); }
      return null;
    },
    list: function(filter) {
      let all = Object.values(methods);
      if (filter && filter.mcp === true) {
        all = all.filter(function(m) { return m.options.mcp && m.options.mcp.expose === true; });
      }
      return all.map(function(m) { return { name: m.name, options: m.options }; });
    }
  };
}

function meteorErrorToRpcError(error) {
  const isMeteorShaped = error && (error.isClientSafe === true || (typeof error.error === 'string' && 'reason' in error));
  if (!isMeteorShaped) {
    return { code: -32603, message: 'Internal error' };   // never leak internals
  }
  const code = CODE_FOR_ERROR[error.error] !== undefined ? CODE_FOR_ERROR[error.error] : -32000;
  return { code: code, message: error.reason || String(error.error), data: { error: error.error, reason: error.reason, details: error.details } };
}

function rpcErrorToMeteorErrorArgs(rpcError) {
  const data = (rpcError && rpcError.data) || {};
  return { error: data.error !== undefined ? data.error : rpcError.code, reason: data.reason || rpcError.message, details: data.details };
}

function httpStatusForRpcCode(code) { return STATUS_FOR_CODE[String(code)] || 500; }

function buildOpenRpcDocument(registry, info) {
  return {
    openrpc: '1.3.2',
    info: { title: info.title, version: info.version },
    methods: registry.list().map(function(m) {
      return {
        name: m.name,
        summary: m.options.description || '',
        params: [{ name: 'params', required: true, schema: m.options.schemaObject || { type: 'object' } }],
        result: { name: 'result', schema: {} },
        'x-streaming': m.options.streaming === true,
        'x-phi': m.options.phi === true
      };
    })
  };
}

module.exports = { validateMethodName, createRegistry, meteorErrorToRpcError, rpcErrorToMeteorErrorArgs, buildOpenRpcDocument, httpStatusForRpcCode };
