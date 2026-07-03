// imports/startup/both/loggingSetup.js
// Must be imported before workflow packages load (both client and server)
// so Meteor.Logger is available to npmPackages/* and extensions/*.
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import LoggerModule from '/imports/lib/Logger.js';
import consoleBackend from '/imports/lib/loggerBackends/consoleBackend.js';

const { Logger } = LoggerModule;

let backend = consoleBackend;
if (Meteor.isServer) {
  const wantJson = get(Meteor, 'settings.private.logging.format', Meteor.isProduction ? 'json' : 'console') === 'json';
  if (wantJson) { backend = require('/imports/lib/loggerBackends/jsonBackend.js'); }
}

// PHI sink: lazy hipaa-compliance lookup (Package registry convention --
// .claude/rules/fhir/package-registry.md). Absent package -> facade warns once.
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
  }
}

Logger.init({
  threshold: get(Meteor, 'settings.public.loggingThreshold', 'info'),
  backend: backend,
  isDevelopment: Meteor.isDevelopment,
  source: Meteor.isServer ? 'server' : 'client',
  phiSink: phiSink
});

Meteor.Logger = Logger;
const backendName = backend === consoleBackend ? 'console' : 'json';
console.log('[loggingSetup] Meteor.Logger registered (' + (Meteor.isServer ? 'server' : 'client') + ', backend: ' + backendName + ')');
Logger.for('loggingSetup').info('Meteor.Logger ready', { source: Meteor.isServer ? 'server' : 'client', backend: backendName });
