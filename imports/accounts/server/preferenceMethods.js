// imports/accounts/server/preferenceMethods.js
//
// Workspace preference methods — users.setHomePagePreference /
// users.saveRoutePreferences / users.clearRoutePreferences. Preferences live
// under profile.preferences.* on the user document:
//   profile.preferences.homePage              post-login landing path
//   profile.preferences.urlParams[<route>]    allowlisted display params per
//                                             route (column toggles, tat-urgency)
// Published to the owner via accounts.currentUser (profile: 1) and Meteor's
// default current-user publication — no new publication needed.

import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { get } from 'lodash';

const MAX_PARAMS_PER_ROUTE = 24;
const MAX_VALUE_LENGTH = 256;

// Route keys become Mongo dotted-path segments
// ('profile.preferences.urlParams.' + route): slashes are legal in Mongo
// field names; '.' and '$' are not. Internal app paths only — no protocols,
// no query strings.
function assertRouteKey(route) {
  if (typeof route !== 'string' || !route.startsWith('/') || route.length > 120
      || !/^\/[A-Za-z0-9/_-]*$/.test(route)) {
    throw new Meteor.Error('validation-failed',
      'route must be an internal path (letters, numbers, slash, dash, underscore)');
  }
}

ServerMethods.define('users.setHomePagePreference', {
  description: 'Persist the preferred post-login homepage on profile.preferences.homePage',
  requireAuth: true,
  rateLimit: { calls: 10, intervalMs: 10000 },
  schemaObject: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    },
    required: ['path']
  }
}, async function(params, context) {
  const path = get(params, 'path');
  assertRouteKey(path);

  await Meteor.users.updateAsync(
    { _id: context.userId },
    { $set: { 'profile.preferences.homePage': path } }
  );
  return { path: path };
});

ServerMethods.define('users.saveRoutePreferences', {
  description: 'Persist allowlisted URL params for a route under profile.preferences.urlParams.<route>',
  requireAuth: true,
  rateLimit: { calls: 10, intervalMs: 10000 }
  // No schemaObject: params is a nested map — validated manually below.
}, async function(params, context) {
  const route = get(params, 'route');
  const routeParams = get(params, 'params');
  assertRouteKey(route);

  if (typeof routeParams !== 'object' || routeParams === null || Array.isArray(routeParams)) {
    throw new Meteor.Error('validation-failed', 'params must be a flat object of string values');
  }
  const keys = Object.keys(routeParams);
  if (keys.length > MAX_PARAMS_PER_ROUTE) {
    throw new Meteor.Error('validation-failed', 'too many params for one route');
  }
  keys.forEach(function(key) {
    if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(key)) {
      throw new Meteor.Error('validation-failed', 'invalid param name: ' + key);
    }
    if (typeof routeParams[key] !== 'string' || routeParams[key].length > MAX_VALUE_LENGTH) {
      throw new Meteor.Error('validation-failed', 'param values must be short strings: ' + key);
    }
  });

  const setDoc = {};
  setDoc['profile.preferences.urlParams.' + route] = routeParams;
  await Meteor.users.updateAsync({ _id: context.userId }, { $set: setDoc });
  return { route: route, count: keys.length };
});

ServerMethods.define('users.clearRoutePreferences', {
  description: 'Remove saved URL params for a route from profile.preferences.urlParams',
  requireAuth: true,
  rateLimit: { calls: 10, intervalMs: 10000 },
  schemaObject: {
    type: 'object',
    properties: {
      route: { type: 'string' }
    },
    required: ['route']
  }
}, async function(params, context) {
  const route = get(params, 'route');
  assertRouteKey(route);

  const unsetDoc = {};
  unsetDoc['profile.preferences.urlParams.' + route] = '';
  await Meteor.users.updateAsync({ _id: context.userId }, { $unset: unsetDoc });
  return { route: route };
});
