// imports/lib/loggerBackends/mongoBackend.js
// MongoDB backend for queryable, retained log storage.
// Plain CJS, zero Meteor imports — testable with plain `node`.
// Motivating use case: desktop-lattice Electron deployments ship with embedded
// MongoDB and no Splunk; this gives them queryable, access-controlled logs inside
// the compliance boundary. Server deployments get a queryable convenience store
// alongside stdout/Splunk.
// Connected lazily via connect(insertMany) once Meteor.startup has the collection
// ready; records emitted before connect() are buffered and flushed on connect.
'use strict';

var LEVELS = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, trace: 5 };

function createMongoBackend(options) {
  options = options || {};
  var threshold     = (options.threshold != null)      ? options.threshold      : 'info';
  var flushIntervalMs = (options.flushIntervalMs != null) ? options.flushIntervalMs : 2000;
  var maxBatch      = (options.maxBatch != null)       ? options.maxBatch       : 50;
  var maxBuffer     = (options.maxBuffer != null)      ? options.maxBuffer      : 5000;

  var buffer    = [];
  var dropped   = 0;
  var insertMany = null;
  var connected = false;
  var timer     = null;

  function doFlush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (buffer.length === 0 || !insertMany) { return; }
    var docs = buffer.splice(0, buffer.length);
    insertMany(docs).catch(function(err) {
      // NEVER call console or Logger here — would cause recursion.
      try { process.stderr.write('[mongoBackend] insert failed: ' + (err && err.message) + '\n'); } catch (ignore) {}
      dropped += docs.length;
    });
  }

  function ensureTimer() {
    if (!timer) {
      timer = setTimeout(function() { timer = null; doFlush(); }, flushIntervalMs);
    }
  }

  return {
    write: function(record) {
      if (record.msg === '◂') { return; }                                // group-close sentinel
      if (LEVELS[record.level] == null || LEVELS[record.level] > LEVELS[threshold]) { return; }
      // Convert ts to BSON Date — required for the TTL index (ISO strings can't TTL).
      var doc = Object.assign({}, record, { ts: new Date(record.ts) });
      if (!connected) {
        // Not yet wired to Mongo; buffer up to maxBuffer (drop oldest beyond cap).
        if (buffer.length >= maxBuffer) { buffer.shift(); dropped++; }
        buffer.push(doc);
        return;
      }
      buffer.push(doc);
      if (buffer.length >= maxBatch) { doFlush(); }
      else { ensureTimer(); }
    },

    connect: function(insertManyFn) {
      // Attach the sink and immediately flush buffered boot-time records.
      insertMany = insertManyFn;
      connected  = true;
      doFlush();
    },

    flush: function() { doFlush(); },

    setThreshold: function(level) {
      if (LEVELS[level] == null) {
        try { process.stderr.write('[mongoBackend] ignoring invalid threshold: ' + level + '\n'); } catch (ignore) {}
        return;
      }
      threshold = level;
    },

    stats: function() {
      return { buffered: buffer.length, dropped: dropped, threshold: threshold, connected: connected };
    },

    stop: function() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (connected && buffer.length > 0) { doFlush(); }
    }
  };
}

module.exports = { createMongoBackend: createMongoBackend };
