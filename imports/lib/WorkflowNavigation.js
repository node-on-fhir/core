// imports/lib/WorkflowNavigation.js
// Workflow-orchestration URL-param helpers. Plain CJS, zero deps, no Meteor
// imports -- testable with plain `node --test` (Logger.js precedent) and
// importable from core code and npm workflow packages alike via
// '/imports/lib/WorkflowNavigation.js'.
//
// Param contract (values are bare route slugs, e.g. 'pacio-dashboard'):
//
//   next     - step-level: "after THIS page's action, go here". Consumed by
//              the immediate next hop; never forwarded onward.
//   home     - workflow-level: "when the workflow TERMINATES, return here".
//              Originated at the workflow entry point, forwarded by every
//              intermediate hop (forwardHome), and consumed at a termination
//              state (resolveWorkflowExit) -- like a callback threaded
//              through multiple functions.
//   previous - hop-local came-from; drives Back buttons only. Not handled
//              here (each page reads it directly).
//
// Termination resolution order: ?next= -> ?home= -> settings default route
// -> the page's own legacy fallback.

// Returns a cleaned route slug (no leading slashes) or null. Safety rules
// match the prior inline consumers (data-importer FileDropTab, lantern):
// internal routes only -- reject protocol escapes, backslashes, and
// protocol-relative values. Also reject embedded '?' / '#': these params are
// bare slugs by convention; anything richer falls through to the next tier.
function sanitizeRouteSlug(rawValue) {
  let slug = (typeof rawValue === 'string' ? rawValue : '').trim();
  if (!slug) {
    return null;
  }
  if (slug.includes('://') || slug.includes('\\') || slug.startsWith('//')) {
    return null;
  }
  if (slug.includes('?') || slug.includes('#')) {
    return null;
  }
  slug = slug.replace(/^\/+/, '');
  return slug.length ? slug : null;
}

// search: query string ('?a=b' or 'a=b'), URLSearchParams, or null/undefined.
// Returns '/<slug>' for a valid param value, otherwise null.
function paramPathFromSearch(search, key) {
  let params;
  if (typeof search === 'string') {
    params = new URLSearchParams(search);
  } else if (search) {
    params = search;
  } else {
    params = new URLSearchParams('');
  }
  const slug = sanitizeRouteSlug(params.get(key));
  return slug ? ('/' + slug) : null;
}

// Termination-state exit resolution, in priority order:
//   1. ?next=  (explicit step override at the terminal page)
//   2. ?home=  (the threaded workflow callback)
//   3. settingsRoute -- pass get(Meteor, 'settings.public.defaults.route');
//      '' and '/' are treated as unset, matching App.jsx root-route aliasing
//   4. fallbackPath (the page's legacy exit)
// settingsRoute is injected by the caller so this module stays Meteor-free.
function resolveWorkflowExit(search, settingsRoute, fallbackPath) {
  const nextPath = paramPathFromSearch(search, 'next');
  if (nextPath) {
    return nextPath;
  }
  const homePath = paramPathFromSearch(search, 'home');
  if (homePath) {
    return homePath;
  }
  if (typeof settingsRoute === 'string' && settingsRoute.length && settingsRoute !== '/') {
    return settingsRoute;
  }
  return fallbackPath;
}

// Hop primitive: append the current ?home= (and ONLY home) onto targetPath so
// intermediate hops carry the workflow callback forward. No-op when there is
// no valid inbound home, or when targetPath already carries one (lets entries
// that originate their own home= coexist with forwarding). `search` defaults
// to the live URL at call time -- right for click handlers.
function forwardHome(targetPath, search) {
  if (search === undefined && typeof window !== 'undefined') {
    search = window.location.search;
  }
  const homePath = paramPathFromSearch(search, 'home');
  if (!homePath) {
    return targetPath;
  }
  if (/[?&]home=/.test(targetPath)) {
    return targetPath;
  }
  const separator = targetPath.includes('?') ? '&' : '?';
  return targetPath + separator + 'home=' + encodeURIComponent(homePath.slice(1));
}

module.exports = { sanitizeRouteSlug, paramPathFromSearch, resolveWorkflowExit, forwardHome };
