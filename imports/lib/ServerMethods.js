// imports/lib/ServerMethods.js
// Meteor wiring for the ServerMethods registry (Task 2 of the JSON-RPC plan):
// the shared middleware pipeline, the DDP compatibility shim, and the
// Meteor.ServerMethods global (assigned in server/rpc/rpcSetup.js).
//
// Pipeline order (spec): auth -> authorize -> validate params (AJV) ->
// rate limit -> PHI audit (fire-and-forget) -> dispatch (timed, redacted
// logging). The pipeline throws Meteor.Error-shaped errors; transports map
// them to JSON-RPC codes at their edge (ServerMethodsCore.meteorErrorToRpcError).
//
// Rate limiting applies to 'http' and 'ddp' transports only — in-process
// ServerMethods.invoke() ('server' transport) deliberately bypasses it
// (trusted internal orchestration; spec risk note).

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import Core from './ServerMethodsCore.js';
import FhirValidator from './FhirValidator.js';

function logFor(name) {
  return (Meteor.Logger ? Meteor.Logger.for(name) : console);
}

const registry = Core.createRegistry({
  onWarn: function(message, data) { logFor('ServerMethods').warn(message, data); }
});
let authorizer = null;
const aliasDeprecationWarned = new Set();
const rateBuckets = {};   // `${method}:${userId}` -> { tokens, lastRefillMs }

// ---------------------------------------------------------------- helpers

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Map legacy positional DDP arguments onto the named-params object.
// positionalParams (define option) names each positional slot; without it a
// positional call is wrapped as {__positional} so the handler's legacy
// adapter (or a flag during migration) can deal with it explicitly.
function adaptPositionalArgs(entry, args) {
  if (args.length === 1 && isPlainObject(args[0])) {
    return args[0];
  }
  if (args.length === 0) {
    return {};
  }
  const positionalParams = get(entry, 'options.positionalParams');
  if (Array.isArray(positionalParams) && positionalParams.length) {
    const params = {};
    positionalParams.forEach(function(paramName, index) {
      if (index < args.length) {
        params[paramName] = args[index];
      }
    });
    return params;
  }
  return { __positional: Array.prototype.slice.call(args) };
}

function takeRateToken(entry, context) {
  const rateLimit = get(entry, 'options.rateLimit');
  if (!rateLimit || context.transport === 'server') {
    return true;
  }
  const calls = get(rateLimit, 'calls', 10);
  const intervalMs = get(rateLimit, 'intervalMs', 1000);
  const key = entry.name + ':' + (context.userId || context.ip || 'anon');
  const now = Date.now();
  let bucket = rateBuckets[key];
  if (!bucket) {
    bucket = { tokens: calls, lastRefillMs: now };
    rateBuckets[key] = bucket;
  }
  const elapsed = now - bucket.lastRefillMs;
  if (elapsed >= intervalMs) {
    bucket.tokens = calls;
    bucket.lastRefillMs = now;
  }
  if (bucket.tokens <= 0) {
    return false;
  }
  bucket.tokens = bucket.tokens - 1;
  return true;
}

// Fire-and-forget PHI audit via the record-lifecycle EventBus when that
// workflow package is loaded (lazy Package lookup — audit-trail spec's
// non-blocking rule: a failure here must never fail the call).
function emitPhiAudit(entry, params, context) {
  try {
    const lifecyclePackage = globalThis.Package && globalThis.Package['@node-on-fhir/record-lifecycle'];
    const eventBus = lifecyclePackage && (lifecyclePackage.EventBus || get(lifecyclePackage, 'default.EventBus'));
    if (!eventBus || typeof eventBus.emitLifecycleEvent !== 'function') {
      return;
    }
    eventBus.emitLifecycleEvent({
      lifecycleEvent: 'rpc.invoke',
      method: entry.name,
      userId: context.userId || null,
      transport: context.transport,
      patientReference: get(params, 'patientId') || get(params, 'patient') || undefined
    });
  } catch (auditError) {
    logFor('ServerMethods').error('PHI audit emission failed (non-blocking)', { method: entry.name, message: auditError.message });
  }
}

// ------------------------------------------------------------- the pipeline

async function runPipeline(entry, params, context) {
  const options = entry.options;
  const log = context.log || logFor(entry.name);
  context.log = log;
  if (typeof context.emit !== 'function') {
    context.emit = function() {
      throw new Meteor.Error('streaming-not-supported', entry.name + ' emit() requires streaming: true and a streaming transport');
    };
  }

  // 1. Auth
  if (options.requireAuth !== false && !context.userId) {
    throw new Meteor.Error('not-authorized', 'You must be signed in to call ' + entry.name);
  }

  // 2. Authorize (fail-closed: allow declared but no authorizer -> deny)
  if (options.allow) {
    if (!authorizer) {
      throw new Meteor.Error('not-authorized', 'no authorizer registered');
    }
    const decision = await authorizer(context, options.allow);
    if (!get(decision, 'allowed')) {
      throw new Meteor.Error('not-authorized', get(decision, 'reason', 'not permitted to call ' + entry.name));
    }
  }

  // 3. Validate params
  if (options._validator) {
    const paramsObject = isPlainObject(params) ? params : {};
    if (!options._validator(paramsObject)) {
      throw new Meteor.Error('validation-failed', 'Invalid params for ' + entry.name, { errors: options._validator.errors });
    }
  }

  // 4. Rate limit (http/ddp only)
  if (!takeRateToken(entry, context)) {
    throw new Meteor.Error('too-many-requests', 'Rate limit exceeded for ' + entry.name);
  }

  // 5. PHI audit (fire-and-forget)
  if (options.phi === true) {
    emitPhiAudit(entry, params, context);
  }

  // 6. Dispatch, timed; params redacted in logs for phi methods
  const startedAt = Date.now();
  try {
    log.debug('rpc start', { method: entry.name, transport: context.transport, params: options.phi === true ? { redacted: true } : params });
  } catch (logError) {
    // logging must never fail the call
  }
  const result = await entry.handler(params, context);
  try {
    log.info('rpc finish', { method: entry.name, transport: context.transport, durationMs: Date.now() - startedAt });
  } catch (logError) {
    // logging must never fail the call
  }
  return result;
}

// ----------------------------------------------------------------- the API

const ServerMethods = {
  define: function(name, options, handler) {
    const opts = Object.assign({}, options);

    // Resolve a string schema through FhirValidator AT DEFINE TIME so a
    // missing schema fails at boot, not on first call.
    if (typeof opts.schema === 'string') {
      const validator = FhirValidator.getValidatorFor(opts.schema);
      if (!validator) {
        throw new Error('[ServerMethods] ' + name + ': schema "' + opts.schema + '" is not registered with FhirValidator (registerSchema first)');
      }
      opts._validator = validator;
      opts.schemaObject = opts.schemaObject || validator.schema;
    } else if (isPlainObject(opts.schemaObject)) {
      FhirValidator.registerSchema(name + 'Params', opts.schemaObject);
      opts._validator = FhirValidator.getValidatorFor(name + 'Params');
    }

    const entry = registry.define(name, opts, handler);

    // DDP compatibility shim: same pipeline, context built from `this`.
    // entry.options.aliases is the KEPT list (the registry drops contested
    // aliases with a warning rather than throwing).
    if (Meteor.isServer) {
      const ddpNames = [name].concat(entry.options.aliases || []);
      const ddpMethods = {};
      const existingHandlers = (Meteor.server && Meteor.server.method_handlers) || {};
      ddpNames.forEach(function(ddpName) {
        const ddpHandler = async function() {
          if (ddpName !== name && get(Meteor, 'settings.private.rpc.deprecationWarnings') !== false && !aliasDeprecationWarned.has(ddpName)) {
            aliasDeprecationWarned.add(ddpName);
            logFor('ServerMethods').warn('DEPRECATED method name "' + ddpName + '" called — use "' + name + '"', { alias: ddpName, canonical: name });
          }
          this.unblock();
          const params = adaptPositionalArgs(entry, arguments);
          const context = {
            userId: this.userId || null,
            scopes: [],
            transport: 'ddp',
            ip: get(this, 'connection.clientAddress'),
            userAgent: get(this, 'connection.httpHeaders.user-agent')
          };
          return await runPipeline(entry, params, context);
        };
        if (existingHandlers[ddpName]) {
          // Name already has a DDP handler — e.g. this canonical define just
          // evicted an alias that registered one. Replace it in place;
          // Meteor.methods() would throw on the duplicate.
          logFor('ServerMethods').warn('Replacing existing DDP handler for "' + ddpName + '" (canonical define supersedes prior registration)', { name: ddpName });
          existingHandlers[ddpName] = ddpHandler;
        } else {
          ddpMethods[ddpName] = ddpHandler;
        }
      });
      if (Object.keys(ddpMethods).length > 0) {
        Meteor.methods(ddpMethods);
      }
    }
    return entry;
  },

  // In-process invocation — the server->server orchestration path. Runs the
  // FULL pipeline (auth/authorize/validate/audit) but bypasses rate limiting
  // ('server' transport).
  invoke: async function(name, params, context) {
    const entry = registry.get(name);
    if (!entry) {
      throw new Meteor.Error('not-found', 'Method ' + name + ' is not defined');
    }
    const fullContext = Object.assign({ userId: null, scopes: [], transport: 'server' }, context);
    return await runPipeline(entry, params || {}, fullContext);
  },

  runPipeline: runPipeline,

  setAuthorizer: function(fn) {
    authorizer = fn;
  },

  get: function(nameOrAlias) {
    return registry.get(nameOrAlias);
  },

  list: function(filter) {
    return registry.list(filter);
  },

  buildOpenRpcDocument: function(info) {
    return Core.buildOpenRpcDocument(registry, info);
  }
};

export default ServerMethods;
export { ServerMethods };
