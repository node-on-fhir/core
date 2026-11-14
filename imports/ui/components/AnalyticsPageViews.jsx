// imports/ui/components/AnalyticsPageViews.jsx
//
// Renders nothing; fires trackPageView on mount AND on every location
// change via useLocation (must be mounted INSIDE the Router). Replaces the
// old props.location-guarded logPageView call, which never fired under
// Router v6 (no location prop is passed) — the root cause of GA4 sessions
// landing as "(not set)".

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '/imports/lib/analyticsEvents';

export function AnalyticsPageViews() {
  var location = useLocation();
  useEffect(function() {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

export default AnalyticsPageViews;
