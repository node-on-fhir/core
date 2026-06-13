// imports/lib/globalCollections.js
//
// Guarded access to the `global.Collections` registry (FABLE-TECH-DEBT-PAYDOWN.md
// § P2 string contracts). Reading `global.Collections.X` for an unregistered or
// misspelled X returns undefined and fails silently downstream. These helpers
// turn that into a loud, once-per-name warning at access time — the runtime
// ("wrap access") complement to the build-time `scripts/audit-global-collections.js`.
//
// Isomorphic and dependency-free.

const _warned = new Set();

function _registry() {
  if (typeof global !== 'undefined' && global.Collections) return global.Collections;
  if (typeof Meteor !== 'undefined' && Meteor && Meteor.Collections) return Meteor.Collections;
  return null;
}

/**
 * Return global.Collections[name], warning once if it is not registered.
 * Prefer this over bare `global.Collections.X` in package code so a typo or a
 * missing registration surfaces in the console instead of as a silent undefined.
 */
export function getCollection(name) {
  const reg = _registry();
  const collection = reg ? reg[name] : undefined;
  if (!collection && !_warned.has(name)) {
    _warned.add(name);
    console.warn('[globalCollections] global.Collections.' + name + ' is not registered — '
      + 'returns undefined. Check the spelling, or run '
      + 'scripts/audit-global-collections.js to list unregistered references.');
  }
  return collection;
}

/**
 * Assert that every name in `names` is registered; warn (once per name) for any
 * that are missing. Call from a package's server/client startup to fail loudly
 * about the collections it depends on. Returns the list of missing names.
 */
export function assertCollectionsRegistered(names, context) {
  const reg = _registry();
  const missing = (names || []).filter((n) => !(reg && reg[n]));
  missing.forEach((n) => {
    if (_warned.has(n)) return;
    _warned.add(n);
    console.warn('[globalCollections] ' + (context || 'package') + ' depends on unregistered '
      + 'collection "' + n + '" — it will read as undefined.');
  });
  return missing;
}

export default { getCollection, assertCollectionsRegistered };
