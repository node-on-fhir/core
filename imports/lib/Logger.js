// imports/lib/Logger.js
// Structured logging facade. Plain CJS, zero deps, no Meteor imports --
// wired to Meteor via init() at startup (see loggingSetup.js) and testable
// with plain `node --test`. Registered as Meteor.Logger for workflow packages.
const { redactPhi } = require('./loggerRedact.js');
const nativeConsole = { error: console.error.bind(console), warn: console.warn.bind(console) };

const LEVELS = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, trace: 5 };

let config = { threshold: 'info', backend: { write: function() {} }, isDevelopment: false, source: 'server', phiSink: null };
let initialThreshold = 'info';   // captured at init(); reset() restores it
let groupPath = [];
// Module focus filter for debugging sessions (setModules/focus/reset).
// null = all modules. When set: info/verbose/debug/trace records emit ONLY
// for matching modules; error/warn ALWAYS pass (never filter problems away).
let moduleFilter = null;         // { spec: 'A,B*', exact: Set, prefixes: [] }
let warnedNoSink = false;
// PHI debugging flag. When true, emit() attaches the original un-redacted payload as
// record.raw so the Mongo HIPAA-tier backend can store it. The fanout in loggingSetup.js
// strips record.raw before writing to the primary (stdout/Splunk) backend — PHI never
// reaches stdout or any backend outside the compliance boundary.
// INVARIANT: record.data ALWAYS contains the redacted form. record.raw only ever exists
// when phiDebugging is true, and only flows to the Mongo backend.
let phiDebugging = false;

function init(options) {
  config = Object.assign({}, config, options);
  initialThreshold = config.threshold;
}

function moduleMatches(moduleName) {
  if (!moduleFilter) { return true; }
  if (moduleFilter.exact.has(moduleName)) { return true; }
  for (let i = 0; i < moduleFilter.prefixes.length; i++) {
    if (moduleName.indexOf(moduleFilter.prefixes[i]) === 0) { return true; }
  }
  return false;
}

// _rawPayload is an internal-only 6th arg used by phi() to carry the original resource
// so emit() can attach it as record.raw. External callers never pass _rawPayload.
function emit(level, moduleName, msg, data, phi, _rawPayload) {
  if (LEVELS[level] > LEVELS[config.threshold]) { return; }
  // Module focus: applies to info and below only — error/warn always emit.
  if (LEVELS[level] >= LEVELS.info && !moduleMatches(moduleName)) { return; }
  const record = { ts: new Date().toISOString(), level: level, module: moduleName, msg: msg, group: groupPath.slice(), source: config.source, phi: !!phi };
  if (data !== undefined) {
    if (phi) {
      record.data = data;
    } else {
      try { record.data = redactPhi(data); } catch (e) { record.data = { redactionFailed: true }; }
    }
  }
  // PHI debugging: attach original (un-redacted) payload as record.raw.
  // For phi() calls _rawPayload is the original resource; for normal calls it falls back to data.
  // structuredClone failure (e.g. functions in data) is silently swallowed — never throws.
  if (phiDebugging) {
    const rawTarget = _rawPayload !== undefined ? _rawPayload : data;
    if (rawTarget !== undefined) {
      try { record.raw = structuredClone(rawTarget); } catch (e) { /* clone failed — skip raw silently */ }
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
    // record.data always receives the stub. When phiDebugging is active, emit() attaches
    // the original resource as record.raw via the _rawPayload arg; the primary backend
    // (stdout/Splunk) never sees record.raw — the fanout in loggingSetup strips it first.
    emit('info', moduleName, msg, stub, true, resourceOrData);
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

function setThreshold(level) {
  if (LEVELS[level] == null) { nativeConsole.warn('[Logger] ignoring invalid threshold: ' + level); return; }
  config.threshold = level;
}

function getThreshold() { return config.threshold; }
function setPhiDebugging(enabled) { phiDebugging = !!enabled; }
function getPhiDebugging() { return phiDebugging; }

// ------------------------------------------------- debugging-session toggles
// setModules('PatientSidebar,Pacio*') — focus info-and-below on matching
// modules (comma-separated; trailing * = prefix glob). error/warn always pass.
// setModules(null | '' | '*') clears the filter.
function setModules(spec) {
  if (spec == null || spec === '' || spec === '*') { moduleFilter = null; return; }
  const parts = (Array.isArray(spec) ? spec : String(spec).split(','))
    .map(function(p) { return p.trim(); })
    .filter(Boolean);
  if (parts.length === 0) { moduleFilter = null; return; }
  const exact = new Set();
  const prefixes = [];
  parts.forEach(function(p) {
    if (p.slice(-1) === '*') { prefixes.push(p.slice(0, -1)); }
    else { exact.add(p); }
  });
  moduleFilter = { spec: parts.join(','), exact: exact, prefixes: prefixes };
}

function getModules() { return moduleFilter ? moduleFilter.spec : null; }

// One-call debugging mode: open the threshold all the way and (optionally)
// focus on specific modules. `Meteor.Logger.focus('PatientSidebar*')`.
function focus(spec) {
  Logger.setThreshold('trace');
  if (spec !== undefined) { Logger.setModules(spec); }
  nativeConsole.warn('[Logger] FOCUS active — threshold=trace, modules=' + (getModules() || '(all)') + '. Logger.reset() to restore.');
}

// Restore the boot configuration: init threshold, no module filter.
// (PHI debugging is deliberately NOT touched here — it has its own
// compliance-gated lifecycle; use setPhiDebugging explicitly.)
function reset() {
  config.threshold = initialThreshold;
  moduleFilter = null;
  nativeConsole.warn('[Logger] reset — threshold=' + initialThreshold + ', module filter cleared.');
}

const Logger = {
  for: forModule, init: init,
  setThreshold: setThreshold, getThreshold: getThreshold,
  setModules: setModules, getModules: getModules,
  focus: focus, reset: reset,
  setPhiDebugging: setPhiDebugging, getPhiDebugging: getPhiDebugging
};
module.exports = { Logger, init: init };
