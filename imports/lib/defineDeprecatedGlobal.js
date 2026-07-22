// imports/lib/defineDeprecatedGlobal.js
// Attach a deprecated property to a host object (e.g. the Meteor global) that
// fires a warn-once deprecation on first ACCESS, not at definition. Used for
// the legacy Meteor.NoDataWrapper / Meteor.NotSignedInWrapper component
// globals that packages read at runtime.
//
// configurable:true + a setter are required: Meteor hot-reload re-executes
// App.jsx module scope, which redefines the property.

import { warnOnce } from './warnOnce.js';

export function defineDeprecatedGlobal(host, name, value, message) {
  if (!host) {
    return;
  }
  let current = value;
  Object.defineProperty(host, name, {
    configurable: true,
    enumerable: true,
    get() {
      warnOnce(`deprecated-global-${name}`, message);
      return current;
    },
    set(next) {
      current = next;
    }
  });
}

export default defineDeprecatedGlobal;
