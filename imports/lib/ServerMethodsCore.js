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

// Collision semantics (hardened 2026-07-22 after the IPS zombie-boot incident):
// canonical names OWN their names — a canonical-vs-canonical duplicate is a
// real bug and stays FATAL. Aliases are best-effort deprecation niceties and
// are NEVER load-bearing: an alias that collides with anything is dropped
// with a warning, and a later canonical define EVICTS a squatting alias.
// This matters because workflow packages load before core's imports/api
// files, so a package alias can innocently claim a name core defines later —
// that must not kill the boot.
function createRegistry(hooks) {
  const methods = {};   // canonical name -> {name, options, handler}
  const aliases = {};   // alias -> canonical name
  const warn = (hooks && typeof hooks.onWarn === 'function')
    ? hooks.onWarn
    : function(message, data) { console.warn(message, data || ''); };
  return {
    define: function(name, options, handler) {
      const check = validateMethodName(name);
      if (!check.valid) { throw new Error('[ServerMethods] invalid name: ' + check.reason); }
      // Canonical duplicate: two real definitions of the same name — fatal.
      if (methods[name]) { throw new Error('[ServerMethods] ' + name + ' already defined'); }
      // Name squatted by an alias: the canonical define wins — evict the alias.
      if (aliases[name]) {
        const holder = aliases[name];
        delete aliases[name];
        if (methods[holder]) {
          methods[holder].options.aliases = (methods[holder].options.aliases || []).filter(function(a) { return a !== name; });
        }
        warn('[ServerMethods] canonical define of "' + name + '" evicted the alias previously claimed by "' + holder + '"', { name: name, evictedFrom: holder });
      }
      const opts = Object.assign({ requireAuth: true, streaming: false, phi: false }, options);
      // Keep only the aliases that are actually free; drop contested ones.
      const requestedAliases = opts.aliases || [];
      opts.aliases = [];
      requestedAliases.forEach(function(alias) {
        if (alias === name || methods[alias]) {
          warn('[ServerMethods] alias "' + alias + '" for "' + name + '" dropped — the name is canonically defined', { alias: alias, requestedBy: name });
          return;
        }
        if (aliases[alias]) {
          warn('[ServerMethods] alias "' + alias + '" for "' + name + '" dropped — already aliased to "' + aliases[alias] + '"', { alias: alias, requestedBy: name, owner: aliases[alias] });
          return;
        }
        aliases[alias] = name;
        opts.aliases.push(alias);
      });
      methods[name] = { name: name, options: opts, handler: handler };
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
