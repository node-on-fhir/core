// imports/lib/usePersistedRouteParams.js
//
// Opt-in persisted URL params for CRUD/table routes. Each route declares an
// ALLOWLIST of params that are user preferences (column toggles, display
// modes) — transient navigation state (tabs, panels, text filters) must stay
// out. Saved values live at profile.preferences.urlParams[routeKey]
// (users.saveRoutePreferences / users.clearRoutePreferences).
//
// Semantics:
//  - Hydration happens ONCE, on the first arrival of the saved map (the user
//    doc may land after mount), and only fills allowlisted params ABSENT
//    from the URL — an explicit URL always wins, so shared links behave.
//  - Saves fire only from persistCurrentParams() (call it from toggle
//    handlers with the freshly-built URLSearchParams); hydration and
//    reactive echoes can never trigger a write.

import { useRef, useEffect, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useSearchParams } from 'react-router-dom';
import { get, debounce, isEqual } from 'lodash';

export function usePersistedRouteParams(routeKey, allowlist) {
  const [searchParams, setSearchParams] = useSearchParams();
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef(null);

  const savedParams = useTracker(function() {
    return get(Meteor.user(), ['profile', 'preferences', 'urlParams', routeKey], null);
  }, [routeKey]);

  useEffect(function() {
    if (hydratedRef.current || !savedParams) {
      return;
    }
    hydratedRef.current = true;
    lastSavedRef.current = savedParams;

    const merged = new URLSearchParams(searchParams);
    let changed = false;
    allowlist.forEach(function(param) {
      if (merged.get(param) === null && typeof savedParams[param] === 'string') {
        merged.set(param, savedParams[param]);
        changed = true;
      }
    });
    if (changed) {
      setSearchParams(merged, { replace: true });
    }
  }, [savedParams]);  // eslint-disable-line react-hooks/exhaustive-deps

  const debouncedSave = useMemo(function() {
    return debounce(function(collected) {
      if (isEqual(collected, lastSavedRef.current)) {
        return;
      }
      lastSavedRef.current = collected;
      Meteor.rpc('users.saveRoutePreferences', { route: routeKey, params: collected })
        .catch(function(error) {
          console.warn('[usePersistedRouteParams] save failed for ' + routeKey + ':', error.reason || error.message);
        });
    }, 1000);
  }, [routeKey]);

  useEffect(function() {
    return function() {
      // Persist a trailing toggle on unmount rather than dropping it
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  // Call with the freshly-built URLSearchParams from a toggle handler (React
  // state hasn't committed yet at that point), or with nothing to snapshot
  // the current URL.
  function persistCurrentParams(nextParams) {
    const source = nextParams || searchParams;
    const collected = {};
    allowlist.forEach(function(param) {
      const value = source.get(param);
      if (value !== null) {
        collected[param] = value;
      }
    });
    debouncedSave(collected);
  }

  return { persistCurrentParams: persistCurrentParams };
}

export default usePersistedRouteParams;
