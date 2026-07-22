// imports/lib/warnOnce.js
// Warn-once helper for deprecation notices. Keyed so each distinct
// deprecation fires a single console.warn per client session.
// Pure JS (no Meteor/React imports) so it stays node --test friendly.

const warned = new Set();

export function warnOnce(key, message) {
  if (warned.has(key)) {
    return;
  }
  warned.add(key);
  console.warn(message);
}

// Test helper — clears the warned set so suites can assert repeat behavior.
export function resetWarnOnce() {
  warned.clear();
}

export default warnOnce;
