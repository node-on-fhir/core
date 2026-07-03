// imports/lib/Logger.js
// Structured logging facade. Plain CJS, zero deps, no Meteor imports --
// wired to Meteor via init() at startup (see loggingSetup.js) and testable
// with plain `node --test`. Registered as Meteor.Logger for workflow packages.
const { redactPhi } = require('./loggerRedact.js');
const nativeConsole = { error: console.error.bind(console), warn: console.warn.bind(console) };

const LEVELS = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, trace: 5 };

let config = { threshold: 'info', backend: { write: function() {} }, isDevelopment: false, source: 'server', phiSink: null };
let groupPath = [];
let warnedNoSink = false;

function init(options) { config = Object.assign({}, config, options); }

function emit(level, moduleName, msg, data, phi) {
  if (LEVELS[level] > LEVELS[config.threshold]) { return; }
  const record = { ts: new Date().toISOString(), level: level, module: moduleName, msg: msg, group: groupPath.slice(), source: config.source, phi: !!phi };
  if (data !== undefined) {
    if (phi) {
      record.data = data;
    } else {
      try { record.data = redactPhi(data); } catch (e) { record.data = { redactionFailed: true }; }
    }
  }
  config.backend.write(record);
}

function forModule(moduleName) {
  const child = {};
  ['error', 'warn', 'info', 'verbose', 'debug', 'trace'].forEach(function(level) {
    child[level] = function(msg, data) { emit(level, moduleName, msg, data, false); };
  });
  child.log = child.info;                       // console-fallback compatible
  child.group = function(label) { emit('info', moduleName, '▸ ' + label, undefined, false); groupPath.push(label); };
  child.groupEnd = function() { emit('info', moduleName, '◂', undefined, false); groupPath.pop(); };
  child.table = function(rows) { emit('info', moduleName, '(table)', rows, false); };
  child.phi = function(msg, resourceOrData, context) {
    const stub = { redacted: true, resourceType: resourceOrData && resourceOrData.resourceType, id: resourceOrData && resourceOrData.id };
    // The backend only ever receives the stub -- PHI is never forwarded to any backend (deliberate, stricter-than-spec).
    emit('info', moduleName, msg, stub, true);
    if (typeof config.phiSink === 'function') {
      try {
        config.phiSink({ msg: msg, resourceType: stub.resourceType, resourceId: stub.id, context: context || {}, module: moduleName });
      } catch (error) {
        nativeConsole.error('[Logger] phiSink error:', error && error.message);
      }
    } else if (!warnedNoSink) {
      warnedNoSink = true;
      nativeConsole.warn('[Logger] log.phi called but no phiSink configured -- audit routing inactive');
    }
  };
  return child;
}

const Logger = { for: forModule, init: init };
module.exports = { Logger, init: init };
