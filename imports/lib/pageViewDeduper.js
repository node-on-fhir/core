// imports/lib/pageViewDeduper.js
//
// Suppresses duplicate consecutive page_view dispatches (React StrictMode
// double-mounts, redundant history events). reset() exists for the
// consent-grant replay: the entry page fired pre-consent into the void and
// must be re-sent once. CJS: Meteor client AND node --test.

function createPageViewDeduper() {
  var lastTracked = null;
  return {
    shouldTrack: function(path) {
      if (typeof path !== 'string' || !path) { return false; }
      if (path === lastTracked) { return false; }
      lastTracked = path;
      return true;
    },
    reset: function() { lastTracked = null; }
  };
}

module.exports = { createPageViewDeduper: createPageViewDeduper };
