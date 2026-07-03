// imports/startup/both/loggingSetup.js
// Must be imported before workflow packages load (both client and server)
// so Meteor.Logger is available to npmPackages/* and extensions/*.
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import LoggerModule from '/imports/lib/Logger.js';
import consoleBackend from '/imports/lib/loggerBackends/consoleBackend.js';
import { withClientRelay } from '/imports/lib/loggerBackends/clientRelay.js';

const { Logger } = LoggerModule;

let backend = consoleBackend;
let wantJson = false;
if (Meteor.isServer) {
  wantJson = get(Meteor, 'settings.private.logging.format', Meteor.isProduction ? 'json' : 'console') === 'json';
  if (wantJson) { backend = require('/imports/lib/loggerBackends/jsonBackend.js'); }
}

// MongoDB backend — server only; created immediately so boot-time records are
// buffered and flushed once the collection is ready in Meteor.startup.
let mongoBackend = null;
if (Meteor.isServer && get(Meteor, 'settings.private.logging.mongo.enabled', false) === true) {
  const { createMongoBackend } = require('/imports/lib/loggerBackends/mongoBackend.js');
  mongoBackend = createMongoBackend({
    threshold: process.env.LOGGING_MONGO_THRESHOLD || get(Meteor, 'settings.private.logging.mongo.threshold', 'info')
  });
  // Fanout: primary backend first — stdout/console must never be blocked by Mongo.
  const primaryBackend = backend;
  backend = { write: function(r) { primaryBackend.write(r); mongoBackend.write(r); } };
}

if (!Meteor.isServer && get(Meteor, 'settings.public.logging.shipClientLogs', false) === true) { backend = withClientRelay(backend); }

// Wire the Mongo collection once Meteor.startup gives us a live database handle.
if (Meteor.isServer && mongoBackend) {
  Meteor.startup(async function() {
    try {
      const { Mongo, MongoInternals } = require('meteor/mongo');
      const collName     = get(Meteor, 'settings.private.logging.mongo.collection', 'ServerLogs');
      const mongoUrl     = get(Meteor, 'settings.private.logging.mongo.mongoUrl');
      const retentionDays = get(Meteor, 'settings.private.logging.mongo.retentionDays', 30);
      let collection;
      if (mongoUrl) {
        // Dedicated connection for ops teams routing logs to a separate MongoDB.
        const driver = new MongoInternals.RemoteCollectionDriver(mongoUrl);
        collection = new Mongo.Collection(collName, { _driver: driver });
      } else {
        collection = new Mongo.Collection(collName);
      }
      const raw = collection.rawCollection();
      // TTL index on ts (BSON Date) — Mongo expires docs automatically.
      await raw.createIndex({ ts: 1 }, { expireAfterSeconds: retentionDays * 86400 });
      // Query index for log viewer / admin queries.
      await raw.createIndex({ module: 1, level: 1, ts: -1 });
      mongoBackend.connect(function(docs) { return raw.insertMany(docs, { ordered: false }); });
      // Expose for the runtime-threshold override method.
      Meteor._mongoLogBackend = mongoBackend;
    } catch (err) {
      try { process.stderr.write('[loggingSetup] mongoBackend init failed: ' + (err && err.message) + '\n'); } catch (ignore) {}
    }
  });
}

// PHI sink: lazy hipaa-compliance lookup (Package registry convention --
// .claude/rules/fhir/package-registry.md). Absent package -> warns once.
let warnedNoHipaaPackage = false;
function phiSink(event) {
  if (!Meteor.isServer) { return; }   // client phi() relies on the server-side audit trail via methods
  const pkg = globalThis.Package && globalThis.Package['@node-on-fhir/hipaa-compliance'];
  const hipaaLogger = get(pkg, 'HipaaLogger');
  if (hipaaLogger && typeof hipaaLogger.logEvent === 'function') {
    hipaaLogger.logEvent({
      eventType: get(event, 'context.action', 'access'),
      resourceId: event.resourceId,
      resourceType: event.resourceType,
      message: '[' + event.module + '] ' + event.msg,
      metadata: event.context
    }).catch(function(error) { console.error('[loggingSetup] phiSink audit write failed:', error && error.message); });
  } else if (!warnedNoHipaaPackage) {
    warnedNoHipaaPackage = true;
    console.warn('[loggingSetup] log.phi called but @node-on-fhir/hipaa-compliance is not loaded -- audit routing inactive');
  }
}

const threshold = process.env.LOGGING_THRESHOLD || get(Meteor, 'settings.public.loggingThreshold', 'info');

Logger.init({
  threshold: threshold,
  backend: backend,
  isDevelopment: Meteor.isDevelopment,
  source: Meteor.isServer ? 'server' : 'client',
  phiSink: phiSink
});

Meteor.Logger = Logger;

let captureConsole = false;
if (Meteor.isServer && wantJson && get(Meteor, 'settings.private.logging.captureConsole', true) !== false) {
  require('/imports/lib/loggerBackends/consoleCapture.js').install(Logger);
  captureConsole = true;
}

// backendName describes the primary (non-mongo) backend for the ready-line.
const backendName = wantJson ? 'json' : 'console';
const readyData = { source: Meteor.isServer ? 'server' : 'client', backend: backendName, captureConsole: captureConsole, threshold: threshold };
if (Meteor.isServer && mongoBackend) {
  readyData.mongoLog = { enabled: true, threshold: mongoBackend.stats().threshold };
} else if (Meteor.isServer) {
  readyData.mongoLog = { enabled: false };
}
Logger.for('loggingSetup').info('Meteor.Logger ready', readyData);
