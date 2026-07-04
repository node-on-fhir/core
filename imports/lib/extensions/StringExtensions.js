// imports/lib/extensions/StringExtensions.js
// Core replacement for String.prototype.addUnderscores from clinical:extended-api.
// Bug fix: original took an `input` arg and ignored `this`; this operates on `this`.
// Plain CJS, zero Meteor imports -- wired at startup, testable with `node --test`.
function installStringExtensions() {
  // eslint-disable-next-line no-extend-native
  String.prototype.addUnderscores = function() {
    return this.replace(/ /g, '_');
  };
}

module.exports = { installStringExtensions };
