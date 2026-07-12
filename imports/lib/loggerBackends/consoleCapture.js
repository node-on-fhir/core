// imports/lib/loggerBackends/consoleCapture.js
// Console capture adapter: in JSON logging mode, intercepts console.* calls
// and routes them through Logger as structured LogRecords.
// Plain CJS, no Meteor imports -- testable with node --test.
'use strict';

const util = require('util');
const { redactPhi } = require('../loggerRedact.js');

// Module-level state -- supports one installed target at a time.
let installedTarget = null;
let savedRawOriginals = null;
let inCapture = false;
let captureGroupDepth = 0;

// State for timer and counter methods.
var timerMap = {};
var counterMap = {};

const FORMAT_RE = /%[sdifjoO%]/;

// Level mapping for the standard console log methods.
const LEVEL_MAP = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
  dir: 'debug',
  trace: 'trace',
};

// All methods we patch (level-mapped + special-case ones).
const ALL_METHODS = ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'group', 'groupEnd', 'table',
  'time', 'timeEnd', 'timeLog', 'count', 'countReset', 'assert'];
const LEVEL_METHODS = ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir'];

function safeRedact(value) {
  try { return redactPhi(value); } catch (e) { return { redactionFailed: true }; }
}

// Fold a console arguments list into { msg, data }.
//
// Format-specifier path: if the first arg is a string with format specifiers
// AND more args follow, pre-redact the remaining args (so %j/%o cannot leak
// PHI), then call util.format. No data in this case.
//
// Plain path: first string arg becomes msg; remaining args become data
// (single arg as-is, multiple args wrapped in an array). emit() redacts data.
function foldArgs(args) {
  if (args.length === 0) { return { msg: '', data: undefined }; }
  var first = args[0];
  var rest = args.slice(1);
  if (typeof first === 'string' && FORMAT_RE.test(first) && rest.length > 0) {
    var redacted = rest.map(safeRedact);
    return { msg: util.format.apply(util, [first].concat(redacted)), data: undefined };
  }
  var msg = typeof first === 'string' ? first : util.format(first);
  var data;
  if (rest.length === 1) { data = rest[0]; }
  else if (rest.length > 1) { data = rest; }
  return { msg: msg, data: data };
}

function install(Logger, opts) {
  var target = (opts && opts.target) || console;

  // Double-install on the same target is a no-op.
  if (installedTarget === target) { return; }

  var log = Logger.for('console');

  // Save raw original function references for later restoration.
  // Fall back to target.log when a method is absent.
  var rawOriginals = {};
  ALL_METHODS.forEach(function(method) {
    rawOriginals[method] = typeof target[method] === 'function' ? target[method] : target.log;
  });

  // Bound versions used as safe fallback inside patched methods.
  var boundOriginals = {};
  ALL_METHODS.forEach(function(method) {
    boundOriginals[method] = rawOriginals[method].bind(target);
  });

  // Patch each level-mapped method.
  LEVEL_METHODS.forEach(function(method) {
    var level = LEVEL_MAP[method];
    target[method] = function() {
      var args = Array.prototype.slice.call(arguments);
      if (inCapture) { return boundOriginals[method].apply(null, args); }
      inCapture = true;
      try {
        var folded = foldArgs(args);
        log[level](folded.msg, folded.data);
      } catch (e) {
        boundOriginals[method].apply(null, args);
      } finally {
        inCapture = false;
      }
    };
  });

  // Patch group: push a capture-layer group and track depth.
  target.group = function() {
    var args = Array.prototype.slice.call(arguments);
    if (inCapture) { return boundOriginals.group.apply(null, args); }
    inCapture = true;
    try {
      var folded = foldArgs(args);
      log.group(folded.msg || 'group');
      captureGroupDepth++;
    } catch (e) {
      boundOriginals.group.apply(null, args);
    } finally {
      inCapture = false;
    }
  };

  // Patch groupEnd: only pop if this adapter opened a group; never pop
  // app-owned Logger group entries.
  target.groupEnd = function() {
    if (inCapture) { return boundOriginals.groupEnd(); }
    if (captureGroupDepth <= 0) { return; }
    inCapture = true;
    try {
      log.groupEnd();
      captureGroupDepth--;
    } catch (e) {
      boundOriginals.groupEnd();
    } finally {
      inCapture = false;
    }
  };

  // Patch table.
  target.table = function(rows) {
    if (inCapture) { return boundOriginals.table(rows); }
    inCapture = true;
    try {
      log.table(rows);
    } catch (e) {
      boundOriginals.table(rows);
    } finally {
      inCapture = false;
    }
  };

  // Patch time: record start timestamp; emit nothing.
  target.time = function(label) {
    var key = label !== undefined ? String(label) : 'default';
    try { timerMap[key] = Date.now(); } catch (e) { /* ignore */ }
  };

  // Patch timeEnd: pop entry and emit elapsed as debug.
  target.timeEnd = function(label) {
    var key = label !== undefined ? String(label) : 'default';
    if (inCapture) { return; }
    inCapture = true;
    try {
      var start = timerMap[key];
      if (start !== undefined) {
        delete timerMap[key];
        log.debug('timer ' + key, { ms: Date.now() - start });
      } else {
        log.debug('timer ' + key + ' (no start)', {});
      }
    } catch (e) {
      boundOriginals.timeEnd(label);
    } finally {
      inCapture = false;
    }
  };

  // Patch timeLog: emit elapsed without popping.
  target.timeLog = function(label) {
    var key = label !== undefined ? String(label) : 'default';
    var rest = Array.prototype.slice.call(arguments, 1);
    if (inCapture) { return; }
    inCapture = true;
    try {
      var start = timerMap[key];
      var ms = start !== undefined ? Date.now() - start : undefined;
      var data = { ms: ms };
      if (rest.length > 0) { data.data = rest; }
      log.debug('timer ' + key, data);
    } catch (e) {
      boundOriginals.timeLog.apply(null, [label].concat(rest));
    } finally {
      inCapture = false;
    }
  };

  // Patch count: increment and emit counter value as debug.
  target.count = function(label) {
    var key = label !== undefined ? String(label) : 'default';
    if (inCapture) { return; }
    inCapture = true;
    try {
      counterMap[key] = (counterMap[key] || 0) + 1;
      log.debug('count ' + key, { count: counterMap[key] });
    } catch (e) {
      boundOriginals.count(label);
    } finally {
      inCapture = false;
    }
  };

  // Patch countReset: reset counter; emit nothing.
  target.countReset = function(label) {
    var key = label !== undefined ? String(label) : 'default';
    try { counterMap[key] = 0; } catch (e) { /* ignore */ }
  };

  // Patch assert: emit error when condition is falsy; nothing when truthy.
  target.assert = function(condition) {
    if (condition) { return; }
    var rest = Array.prototype.slice.call(arguments, 1);
    if (inCapture) { return; }
    inCapture = true;
    try {
      var msg;
      var data;
      if (rest.length === 0) {
        msg = 'Assertion failed';
      } else {
        var folded = foldArgs(rest);
        msg = 'Assertion failed: ' + folded.msg;
        data = folded.data;
      }
      log.error(msg, data);
    } catch (e) {
      boundOriginals.assert.apply(null, [condition].concat(rest));
    } finally {
      inCapture = false;
    }
  };

  // Expose bound originals as an escape hatch.
  target.__original = boundOriginals;

  savedRawOriginals = rawOriginals;
  installedTarget = target;
}

function uninstall(opts) {
  var target = (opts && opts.target) || console;
  if (installedTarget !== target) { return; }

  if (savedRawOriginals) {
    ALL_METHODS.forEach(function(method) {
      target[method] = savedRawOriginals[method];
    });
  }
  delete target.__original;

  savedRawOriginals = null;
  installedTarget = null;
  inCapture = false;
  captureGroupDepth = 0;
  timerMap = {};
  counterMap = {};
}

module.exports = { install: install, uninstall: uninstall };
