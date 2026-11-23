// imports/ui/hooks/useGoogleMapsApiKey.js
//
// BYOK resolution hook for Google-Maps-backed surfaces. Deployment settings
// key wins (operator-managed web deploys); otherwise the signed-in user's
// saved key (userApiKeys provider 'googleMaps'); otherwise null and the
// caller (MapGuard) decides the fallback.

import { useState, useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { resolveMapsKey, MAPS_PROVIDER_ID } from '/imports/lib/googleMapsKeyResolution';

export function useGoogleMapsApiKey() {
  const [state, setState] = useState({
    apiKey: get(Meteor, 'settings.public.google.maps.apiKey', '') || null,
    source: null,
    checked: false
  });

  const refresh = useCallback(function() {
    var cancelled = false;
    async function resolve() {
      var settingsKey = get(Meteor, 'settings.public.google.maps.apiKey', '');
      var userEntry = null;
      if (!settingsKey && Meteor.userId()) {
        try {
          userEntry = await Meteor.rpc('userApiKeys.getForProvider', { provider: MAPS_PROVIDER_ID });
        } catch (err) {
          console.warn('[useGoogleMapsApiKey] Could not fetch user Maps key:', err.reason || err.message);
        }
      } else if (!settingsKey) {
        console.info('[useGoogleMapsApiKey] No settings key and no signed-in user — maps unavailable.');
      }
      if (cancelled) { return; }
      var resolved = resolveMapsKey({ settingsKey: settingsKey, userEntry: userEntry });
      setState({ apiKey: resolved.apiKey, source: resolved.source, checked: true });
    }
    resolve();
    return function() { cancelled = true; };
  }, []);

  useEffect(function() { return refresh(); }, [refresh]);

  return { apiKey: state.apiKey, source: state.source, checked: state.checked, refresh: refresh };
}
