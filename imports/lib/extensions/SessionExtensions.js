// imports/lib/extensions/SessionExtensions.js
// Core replacement for the Session.* helpers formerly in clinical:extended-api.
// Plain CJS, zero Meteor imports (Logger.js precedent) -- wired to Meteor's
// Session at client startup (imports/startup/client/index.js) and testable
// with plain `node --test`.
function installSessionExtensions(Session) {
  Session.toggle = function(key) {
    const current = Session.get(key);
    if (current === true) { Session.set(key, false); }
    else if (current === false) { Session.set(key, true); }
    return true;   // undefined/null: leave as-is (matches original)
  };
  // NOTE: shadows ReactiveDict.prototype.clear() (no-arg form resets ALL keys);
  // this keyed form matches the original clinical:extended-api behavior.
  Session.clear  = function(key) { Session.set(key, null);      return true; };
  Session.remove = function(key) { Session.set(key, undefined); return true; };
  Session.setAll = function(obj) {
    Object.keys(obj || {}).forEach(function(k) { Session.set(k, obj[k]); });
    return true;
  };
  return Session;
}

module.exports = { installSessionExtensions };
