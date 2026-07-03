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

// PHI-debug raw-to-console gate: raw payloads are allowed to reach the console backend
// ONLY when in console mode (not JSON/Splunk) AND on a development build. In all other
// cases record.raw is stripped before the primary backend writes it (defense in depth).
const rawToConsoleOk = !wantJson && Meteor.isDevelopment;

// MongoDB backend — server only; created immediately so boot-time records are
// buffered and flushed once the collection is ready in Meteor.startup.
let mongoBackend = null;
if (Meteor.isServer && get(Meteor, 'settings.private.logging.mongo.enabled', false) === true) {
  const { createMongoBackend, makeFanout } = require('/imports/lib/loggerBackends/mongoBackend.js');
  mongoBackend = createMongoBackend({
    threshold: process.env.LOGGING_MONGO_THRESHOLD || get(Meteor, 'settings.private.logging.mongo.threshold', 'info'),
    phiRetentionHours: get(Meteor, 'settings.private.logging.mongo.phiRetentionHours', 24)
  });
  // Fanout: primary backend (console/stdout) first; Mongo HIPAA tier second.
  // rawToPrimary=true only in console+dev mode — otherwise primary gets a raw-stripped
  // copy so PHI-debug payloads never reach stdout/Splunk/non-dev-console.
  backend = makeFanout(backend, mongoBackend, { rawToPrimary: rawToConsoleOk });
} else if (Meteor.isServer && !rawToConsoleOk) {
  // No Mongo fanout, but raw must still be suppressed from the primary backend
  // (json-mode-without-mongo and console-mode-non-dev). Wrapping here means even a
  // direct Logger.setPhiDebugging(true) from a meteor shell cannot leak raw to stdout
  // or to a non-development console.
  const { stripRaw } = require('/imports/lib/loggerBackends/mongoBackend.js');
  backend = stripRaw(backend);
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
      // PHI-debug records get a separate short-lived expiresAt field. Mongo's TTL index
      // only expires docs where the indexed field is a Date and exists; normal records
      // have no expiresAt so they are unaffected by this index.
      await raw.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
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

// PHI debugging — boot-time activation, settings-only (server only).
// There is deliberately NO runtime/DDP path to enable PHI debugging; enabling
// requires operator-level deployment access and leaves a deployment trail.
// Logger.setPhiDebugging() remains available from `meteor shell` on dev machines only
// (server-console access — not browser-reachable).
let phiDebuggingActive = false;
if (Meteor.isServer && get(Meteor, 'settings.private.logging.phiDebugging.enabled', false) === true) {
  // Production guard: json mode without a Mongo backend means raw payloads have nowhere
  // safe to land — refuse activation.
  if (wantJson && !mongoBackend) {
    Logger.for('loggingSetup').error('PHI debugging requested but the Mongo log backend is disabled - refusing to enable (raw payloads are only stored in the HIPAA tier or shown on a development console)');
  } else {
    Logger.setPhiDebugging(true);
    phiDebuggingActive = true;
    const rawTtl = get(Meteor, 'settings.private.logging.phiDebugging.ttlMinutes', 60);
    const ttlMinutes = Math.max(1, Math.min(240, rawTtl));
    const autoOffAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    const sinks = [];
    if (mongoBackend) { sinks.push('mongo'); }
    if (!wantJson && Meteor.isDevelopment) { sinks.push('devConsole'); }
    // Log activation at warn — every session must leave a trace in the log stream.
    Logger.for('loggingSetup').warn('PHI debugging ENABLED via settings', { ttlMinutes: ttlMinutes, autoOffAt: autoOffAt, sinks: sinks });
    // Dead-man switch: auto-disable after ttlMinutes (clamped to [1, 240]).
    setTimeout(function() {
      Logger.setPhiDebugging(false);
      Logger.for('loggingSetup').warn('PHI debugging auto-expired', { ttlMinutes: ttlMinutes });
    }, ttlMinutes * 60 * 1000);
  }
}

// backendName describes the primary (non-mongo) backend for the ready-line.
const backendName = wantJson ? 'json' : 'console';
const readyData = { source: Meteor.isServer ? 'server' : 'client', backend: backendName, captureConsole: captureConsole, threshold: threshold, phiDebugging: phiDebuggingActive };
if (Meteor.isServer && mongoBackend) {
  readyData.mongoLog = { enabled: true, threshold: mongoBackend.stats().threshold };
} else if (Meteor.isServer) {
  readyData.mongoLog = { enabled: false };
}
Logger.for('loggingSetup').info('Meteor.Logger ready', readyData);
