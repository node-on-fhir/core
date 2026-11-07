// npmPackages/us-core/server/methods.js
//
// US Core server methods. `usCore.initialize` seeds the vendored US Core
// 7.0.0 ValueSets (lib/UsCoreMethods.js + data/us-core-valuesets.json) —
// moved home from provider-directory 2026-11-07; provider-directory now
// peer-depends on this package instead of carrying the datasets itself.
import { Meteor } from 'meteor/meteor';
import { UsCoreMethods } from '../lib/UsCoreMethods.js';

const log = (Meteor.Logger ? Meteor.Logger.for('us-core') : console);

// Only claim the legacy alias if nothing else (core or another package)
// already owns it — a canonical duplicate is a fatal boot error, and the
// legacy names predate the namespaced ones.
function aliasIfFree(legacyName) {
  const handlers = (Meteor.server && Meteor.server.method_handlers) || {};
  if (handlers[legacyName]) {
    log.info('legacy method name already defined elsewhere, no alias', { legacyName });
    return [];
  }
  return [legacyName];
}

Meteor.ServerMethods.define('usCore.initialize', {
  description: 'Initialize US Core value sets from the bundled definitions',
  aliases: aliasIfFree('initUsCore'),
  requireAuth: true
}, async function(params, context) {
  return await UsCoreMethods.initializeValueSets();
});
