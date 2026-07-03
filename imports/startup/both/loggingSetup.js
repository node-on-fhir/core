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

if (!Meteor.isServer && get(Meteor, 'settings.public.logging.shipClientLogs', false) === true) { backend = withClientRelay(backend); }

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

const backendName = backend === consoleBackend ? 'console' : 'json';
Logger.for('loggingSetup').info('Meteor.Logger ready', { source: Meteor.isServer ? 'server' : 'client', backend: backendName, captureConsole: captureConsole, threshold: threshold });
